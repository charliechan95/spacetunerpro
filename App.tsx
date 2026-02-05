
import React, { useState, useEffect, useRef } from 'react';
import { ScaleDefinition, NoteDefinition, TuningResult } from './types';
import { DEFAULT_SCALES, COLORS } from './constants';
import { detectPitch, getNoteFromFrequency, calculateRMS, NoteSmoother } from './utils/audioUtils';
import { AudioSynth } from './utils/audioSynth';
import TunerInterface from './components/TunerInterface';
import AITuningAssistant from './components/AITuningAssistant';
import HelpView from './components/HelpView';
import ToneGenerator from './components/ToneGenerator';
import SplashScreen from './components/SplashScreen';
import { LayoutDashboard, MessageSquare, BookOpen, Activity } from 'lucide-react';

type Tab = 'tuner' | 'generator' | 'ai' | 'help';
type Theme = 'dark' | 'light';

const App: React.FC = () => {
  // --- Global State ---
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tuner');
  const [theme, setTheme] = useState<Theme>('dark');
  
  const [referencePitch, setReferencePitch] = useState<number>(440.0);
  const [isChromatic, setIsChromatic] = useState<boolean>(false);
  const [globalOctaveShift, setGlobalOctaveShift] = useState<number>(0);

  const [allScales, setAllScales] = useState<ScaleDefinition[]>(() => {
    const saved = localStorage.getItem('spaceTunerScales');
    return saved ? JSON.parse(saved) : DEFAULT_SCALES;
  });
  
  const [currentScale, setCurrentScale] = useState<ScaleDefinition>(allScales[0]);
  const [targetNote, setTargetNote] = useState<NoteDefinition | null>(allScales[0].notes[0]);
  
  const [audioStarted, setAudioStarted] = useState<boolean>(false);
  const [tuningResult, setTuningResult] = useState<TuningResult | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // --- Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastAnalysisTimeRef = useRef<number>(0);
  const noteSmootherRef = useRef<NoteSmoother>(new NoteSmoother(5));
  const referencePitchRef = useRef<number>(440.0);
  const synthRef = useRef<AudioSynth>(new AudioSynth());
  const hapticCooldownRef = useRef<number>(0);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('spaceTunerScales', JSON.stringify(allScales));
  }, [allScales]);

  useEffect(() => {
    referencePitchRef.current = referencePitch;
  }, [referencePitch]);

  // Theme Management
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.setProperty('--bg-primary', '#020617');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.setProperty('--bg-primary', '#f8fafc');
    }
  }, [theme]);

  // Haptic Feedback Effect
  useEffect(() => {
    if (tuningResult?.status === 'perfect') {
      const now = Date.now();
      // Simple debounce for haptics (every 500ms max)
      if (now - hapticCooldownRef.current > 500) {
        if (navigator.vibrate) {
          navigator.vibrate(20); // Short tick
        }
        hapticCooldownRef.current = now;
      }
    }
  }, [tuningResult?.status]);

  // --- Audio Engine ---
  const startAudioEngine = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (audioStarted && sourceRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false, 
          autoGainControl: false, 
          noiseSuppression: false, 
          latency: 0
        } as any
      });

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096; 
      analyser.smoothingTimeConstant = 0.1;
      
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;
      sourceRef.current = source;
      
      setAudioStarted(true);
      setPermissionError(null);
      analyzePitch();

    } catch (err) {
      console.error(err);
      setPermissionError("Microphone access denied. Please allow permission.");
      setAudioStarted(false);
    }
  };

  const analyzePitch = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    // Throttle analysis to ~25 FPS to reduce CPU load while maintaining UI smoothness
    const now = performance.now();
    if (now - lastAnalysisTimeRef.current < 40) {
      requestRef.current = requestAnimationFrame(analyzePitch);
      return;
    }
    lastAnalysisTimeRef.current = now;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const rms = calculateRMS(buffer);
    const sampleRate = audioContextRef.current.sampleRate;
    
    const { frequency: rawFrequency, clarity } = detectPitch(buffer, sampleRate);

    // Stricter clarity threshold (0.6) for higher precision/confidence
    if (rawFrequency > 20 && clarity > 0.6) {
      noteSmootherRef.current.add(rawFrequency);
      const frequency = noteSmootherRef.current.getSmoothed();
      const detectedResult = getNoteFromFrequency(frequency, referencePitchRef.current);
      
      let status: TuningResult['status'] = 'far';
      if (Math.abs(detectedResult.cents) <= 5) status = 'perfect';
      else if (Math.abs(detectedResult.cents) <= 20) status = 'close';

      setTuningResult({
        detectedFrequency: frequency,
        closestNote: `${detectedResult.noteName}${detectedResult.octave}`,
        noteName: detectedResult.noteName,
        octave: detectedResult.octave,
        centsOff: detectedResult.cents,
        status,
        rms: rms
      });
    } else {
        if (rms < 0.005) {
           noteSmootherRef.current.reset();
           if (tuningResult) {
              setTuningResult({ ...tuningResult, rms: rms });
           }
        }
    }
    requestRef.current = requestAnimationFrame(analyzePitch);
  };

  // --- Actions ---
  const handleScaleChange = (id: string) => {
    const scale = allScales.find(s => s.id === id) || DEFAULT_SCALES[0];
    setCurrentScale(scale);
    setTargetNote(scale.notes[0]); 
  };

  const handleNoteClick = (note: NoteDefinition) => {
    setTargetNote(note);
    if (!audioStarted) startAudioEngine();
  };

  const playReferenceTone = (frequency: number) => {
    synthRef.current.playTone(frequency);
  };

  const stopReferenceTone = () => {
    synthRef.current.stop();
  };

  const adjustReferencePitch = (amount: number) => {
    setReferencePitch(prev => parseFloat((prev + amount).toFixed(1)));
  };

  const adjustOctaveShift = (amount: number) => {
    setGlobalOctaveShift(prev => {
        const newVal = prev + amount;
        if (newVal > 3) return 3;
        if (newVal < -3) return -3;
        return newVal;
    });
  };

  // Helper for transitions
  const getTabContent = () => {
    switch(activeTab) {
      case 'tuner':
        return (
          <div className="h-full animate-[fadeIn_0.3s_ease-out]">
            <TunerInterface 
              tuningResult={tuningResult}
              targetNote={targetNote}
              currentScale={currentScale}
              allScales={allScales}
              isChromatic={isChromatic}
              referencePitch={referencePitch}
              globalOctaveShift={globalOctaveShift}
              audioStarted={audioStarted}
              analyser={analyserRef.current}
              theme={theme}
              onScaleChange={handleScaleChange}
              onNoteClick={handleNoteClick}
              onStartAudio={startAudioEngine}
              onReferencePitchChange={adjustReferencePitch}
              onOctaveShiftChange={adjustOctaveShift}
              onToggleChromatic={() => setIsChromatic(!isChromatic)}
              onSaveCustomScale={(s) => {
                 setAllScales(prev => [...prev, s]);
                 setCurrentScale(s);
              }}
              onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              onPlayTone={playReferenceTone}
              onStopTone={stopReferenceTone}
            />
          </div>
        );
      case 'generator':
        return (
           <div className="h-full animate-[fadeIn_0.3s_ease-out]">
             <ToneGenerator theme={theme} synth={synthRef.current} />
           </div>
        );
      case 'ai':
        return (
          <div className="h-full animate-[fadeIn_0.3s_ease-out]">
            <AITuningAssistant 
               tuningResult={tuningResult}
               targetNote={targetNote}
               scaleName={currentScale.name}
               isActive={activeTab === 'ai'}
               theme={theme}
            />
          </div>
        );
      case 'help':
        return (
          <div className="h-full animate-[fadeIn_0.3s_ease-out]">
            <HelpView theme={theme} />
          </div>
        );
      default:
        return null;
    }
  };

  // --- Render ---
  return (
    <div className={`fixed inset-0 h-[100dvh] flex flex-col font-sans overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {/* Define Keyframes for FadeIn if not present in global CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {getTabContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className={`flex-none h-16 border-t flex items-center justify-around z-50 pb-safe transition-colors ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <NavButton 
            active={activeTab === 'tuner'} 
            onClick={() => setActiveTab('tuner')} 
            icon={<LayoutDashboard size={24}/>} 
            label="Tuner" 
            theme={theme}
          />
          <NavButton 
            active={activeTab === 'generator'} 
            onClick={() => setActiveTab('generator')} 
            icon={<Activity size={24}/>} 
            label="Tone Gen" 
            theme={theme}
          />
          <NavButton 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
            icon={<MessageSquare size={24}/>} 
            label="AI Chat" 
            theme={theme}
          />
          <NavButton 
            active={activeTab === 'help'} 
            onClick={() => setActiveTab('help')} 
            icon={<BookOpen size={24}/>} 
            label="Guide" 
            theme={theme}
          />
      </nav>

      {/* Global Toast for Errors */}
      {permissionError && (
          <div className="fixed top-20 left-4 right-4 bg-rose-900/90 border border-rose-500 p-4 rounded-xl text-white text-center z-50 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-2">
            {permissionError}
          </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, theme: Theme }> = ({ active, onClick, icon, label, theme }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
      active 
        ? 'text-amber-500' 
        : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className={`p-1 rounded-xl transition-all duration-300 ${active ? (theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50') : 'hover:scale-105'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);

export default App;
