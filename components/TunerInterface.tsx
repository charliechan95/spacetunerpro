import React, { useState } from 'react';
import { Settings, Plus, Volume2, ChevronDown, Activity, Music2, ToggleLeft, ToggleRight, Radio, Mic2, Minus, ArrowUp, ArrowDown, Play, Square, Moon, Sun } from 'lucide-react';
import { TuningResult, NoteDefinition, ScaleDefinition } from '../types';
import { PITCH_PRESETS } from '../constants';
import TunerMeter from './TunerMeter';
import Oscilloscope from './Oscilloscope';
import CustomScaleBuilder from './CustomScaleBuilder';

interface Props {
  tuningResult: TuningResult | null;
  targetNote: NoteDefinition | null;
  currentScale: ScaleDefinition;
  allScales: ScaleDefinition[];
  isChromatic: boolean;
  referencePitch: number;
  globalOctaveShift: number;
  audioStarted: boolean;
  analyser: AnalyserNode | null;
  theme: 'dark' | 'light';
  
  onScaleChange: (scaleId: string) => void;
  onNoteClick: (note: NoteDefinition) => void;
  onStartAudio: () => void;
  onReferencePitchChange: (val: number) => void;
  onOctaveShiftChange: (val: number) => void;
  onToggleChromatic: () => void;
  onSaveCustomScale: (scale: ScaleDefinition) => void;
  onToggleTheme: () => void;
  onPlayTone: (freq: number) => void;
  onStopTone: () => void;
}

const TunerInterface: React.FC<Props> = ({
  tuningResult, targetNote, currentScale, allScales, isChromatic, referencePitch, globalOctaveShift, audioStarted, analyser, theme,
  onScaleChange, onNoteClick, onStartAudio, onReferencePitchChange, onOctaveShiftChange, onToggleChromatic, onSaveCustomScale, onToggleTheme, onPlayTone, onStopTone
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Helper to calculate frequency for audio playback logic
  const calculateTargetFreq = (noteName: string, octave: number) => {
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = NOTE_NAMES.indexOf(noteName);
    const midiNumber = (octave + 1) * 12 + noteIndex;
    return referencePitch * Math.pow(2, (midiNumber - 69) / 12);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      onStopTone();
      setIsPlaying(false);
    } else {
      if (targetNote && !isChromatic) {
        const freq = calculateTargetFreq(targetNote.name, targetNote.octave + globalOctaveShift);
        onPlayTone(freq);
        setIsPlaying(true);
      }
    }
  };

  const displayFrequency = tuningResult?.detectedFrequency || 0;
  let displayCents = 0;
  let displayTargetFreq = 0;
  let displayNoteName = "--";

  if (isChromatic) {
     displayCents = tuningResult?.centsOff || 0;
     displayNoteName = tuningResult?.closestNote || "--";
     if (tuningResult && tuningResult.detectedFrequency > 0) {
        displayTargetFreq = tuningResult.detectedFrequency / Math.pow(2, tuningResult.centsOff / 1200);
     }
  } else {
     if (targetNote) {
        displayTargetFreq = calculateTargetFreq(targetNote.name, targetNote.octave + globalOctaveShift);
        displayNoteName = `${targetNote.name}${targetNote.octave + globalOctaveShift}`;
        if (tuningResult && tuningResult.detectedFrequency > 0) {
           displayCents = 1200 * Math.log2(tuningResult.detectedFrequency / displayTargetFreq);
        }
     }
  }

  const renderPetals = () => {
    if (isChromatic) {
        return (
            <div className="w-full max-w-[320px] h-[320px] mx-auto my-4 flex items-center justify-center">
                 <div className={`w-56 h-56 rounded-full border flex flex-col items-center justify-center relative shadow-inner ${theme === 'dark' ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-100'}`}>
                    <div className={`absolute inset-0 rounded-full border-2 border-dashed animate-[spin_60s_linear_infinite] opacity-30 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}></div>
                    <Radio size={40} className="text-slate-500 mb-2 opacity-50" />
                    <span className="text-slate-400 font-tech text-xs uppercase tracking-widest text-center">Chromatic<br/>Mode</span>
                 </div>
            </div>
        );
    }

    const ding = currentScale.notes[0];
    const toneFields = currentScale.notes.slice(1);
    const detectedNoteString = tuningResult ? `${tuningResult.noteName}${tuningResult.octave}` : '';

    return (
      <div className={`relative w-full max-w-[360px] h-[360px] mx-auto my-4`}>
        {/* Center Ding */}
        <button
          onClick={() => onNoteClick(ding)}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full shadow-2xl z-10 flex flex-col items-center justify-center transition-all duration-200 border-2
            ${ detectedNoteString === `${ding.name}${ding.octave + globalOctaveShift}` 
               ? 'w-24 h-24 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)] bg-emerald-900/40' 
               : targetNote === ding 
                 ? 'w-20 h-20 border-amber-400/50 bg-slate-800'
                 : `w-20 h-20 ${theme === 'dark' ? 'border-slate-600 bg-gradient-to-br from-slate-800 to-black' : 'border-slate-300 bg-white'}`
            }
          `}
        >
           <span className={`text-xl font-bold font-tech ${targetNote === ding ? 'text-amber-400' : theme === 'dark' ? 'text-amber-100' : 'text-slate-700'}`}>
             {ding.name}<span className="text-xs ml-0.5">{ding.octave + globalOctaveShift}</span>
           </span>
        </button>

        {/* Tone Fields */}
        {toneFields.map((note, index) => {
          const angle = (index / toneFields.length) * 2 * Math.PI - Math.PI / 2;
          const radius = 42; 
          const left = 50 + radius * Math.cos(angle);
          const top = 50 + radius * Math.sin(angle);
          
          const adjustedOctave = note.octave + globalOctaveShift;
          const isDetected = detectedNoteString === `${note.name}${adjustedOctave}`;
          const isSelected = targetNote === note;

          return (
            <button
              key={`${note.name}-${note.octave}-${index}`}
              onClick={() => onNoteClick(note)}
              style={{ left: `${left}%`, top: `${top}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 border
                ${isDetected 
                  ? 'scale-125 border-emerald-400 bg-emerald-900/40 shadow-[0_0_20px_rgba(52,211,153,0.4)] z-30' 
                  : isSelected 
                    ? 'scale-110 border-amber-400/50 bg-slate-800 z-20' 
                    : `scale-100 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-50'}`
                }
              `}
            >
              <span className={`text-sm font-bold font-tech ${isDetected || isSelected ? 'text-white' : theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                {note.name}<span className="text-[10px]">{adjustedOctave}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <header className={`flex-none p-3 border-b z-30 flex flex-col gap-3 transition-colors ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
             <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Volume2 size={16} className="text-white" />
                    </div>
                    <h1 className={`text-lg font-tech font-bold hidden xs:block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>SpaceTuner</h1>
                </div>

                <div className="flex gap-2">
                  <button onClick={onToggleTheme} className={`p-2 rounded-full border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button 
                    onClick={onToggleChromatic}
                    className={`sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isChromatic ? 'bg-indigo-600 border-indigo-400 text-white' : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                  >
                      {isChromatic ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                      {isChromatic ? 'CHROMATIC' : 'SCALE'}
                  </button>
                </div>
             </div>

             <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                 <div className={`relative flex-1 sm:min-w-[200px] transition-opacity ${isChromatic ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <select 
                    value={currentScale.id}
                    onChange={(e) => onScaleChange(e.target.value)}
                    disabled={isChromatic}
                    className={`w-full border text-xs font-bold rounded-lg px-2 py-2 appearance-none focus:outline-none truncate pr-6 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
                    >
                    {allScales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronDown size={12} />
                    </div>
                </div>
                <button onClick={() => setShowBuilder(true)} disabled={isChromatic} className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700' : 'bg-white hover:bg-slate-50 text-amber-600 border-slate-300'} ${isChromatic ? 'opacity-30' : ''}`}>
                  <Plus size={16} />
                </button>
            </div>

            <div className="hidden sm:block">
                <button 
                  onClick={onToggleChromatic}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isChromatic ? 'bg-indigo-600 border-indigo-400 text-white' : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'}`}
                >
                    <Mic2 size={14} />
                    {isChromatic ? 'CHROMATIC' : 'AUTO'}
                </button>
             </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pb-1">
             {/* Reference Pitch */}
             <div className={`flex items-center rounded-lg p-1 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
                <span className="text-[10px] text-slate-500 uppercase px-2 font-bold">Ref</span>
                <button onClick={() => onReferencePitchChange(-1)} className="p-1 hover:opacity-70 rounded text-slate-400"><Minus size={12}/></button>
                <div className="relative group mx-1">
                    <input 
                       type="number" step="0.1" className={`w-16 bg-transparent text-center font-mono font-bold text-sm focus:outline-none appearance-none ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}
                       value={referencePitch}
                       onChange={(e) => onReferencePitchChange(parseFloat(e.target.value) - referencePitch)} 
                    />
                    <div className="text-[9px] text-center text-slate-500 -mt-1">Hz</div>
                </div>
                <button onClick={() => onReferencePitchChange(1)} className="p-1 hover:opacity-70 rounded text-slate-400"><Plus size={12}/></button>
                <button onClick={() => setShowPresets(!showPresets)} className={`ml-1 p-1 hover:text-amber-500 text-slate-500 border-l ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}><Settings size={12}/></button>

                {showPresets && (
                  <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)}></div>
                  <div className={`absolute top-28 left-4 sm:left-auto border rounded-xl shadow-2xl z-50 overflow-hidden w-48 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    {PITCH_PRESETS.map(preset => (
                       <button
                         key={preset.value}
                         onClick={() => { onReferencePitchChange(preset.value - referencePitch); setShowPresets(false); }}
                         className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center hover:bg-slate-500/10 ${referencePitch === preset.value ? 'text-amber-500 font-bold' : theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
                       >
                         <span>{preset.value} Hz</span>
                         <span className="opacity-50 font-mono text-[10px]">{preset.label}</span>
                       </button>
                    ))}
                  </div>
                  </>
                )}
             </div>

             {/* Octave Shift */}
             <div className={`flex items-center rounded-lg p-1 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
                <span className="text-[10px] text-slate-500 uppercase px-2 font-bold">Octave</span>
                <button onClick={() => onOctaveShiftChange(-1)} disabled={globalOctaveShift <= -3} className="p-1.5 hover:opacity-70 rounded text-slate-400 disabled:opacity-30"><ArrowDown size={14}/></button>
                <div className="w-8 text-center font-mono font-bold text-emerald-500 text-sm">
                    {globalOctaveShift > 0 ? '+' : ''}{globalOctaveShift}
                </div>
                <button onClick={() => onOctaveShiftChange(1)} disabled={globalOctaveShift >= 3} className="p-1.5 hover:opacity-70 rounded text-slate-400 disabled:opacity-30"><ArrowUp size={14}/></button>
             </div>
             
             {/* Play Button - Tone Reference */}
             {!isChromatic && (
                <button 
                  onClick={handlePlayToggle}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${isPlaying ? 'bg-amber-500 border-amber-400 text-white' : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-300 text-amber-600'}`}
                  title="Play Reference Tone (with Vibrato)"
                >
                    {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
             )}
          </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col pb-24">
         
         {/* Tuning Meter Section */}
         <div className="flex-none pt-6 pb-2 px-4 relative min-h-[340px] flex flex-col justify-center">
            {!audioStarted && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                 <button 
                   onClick={onStartAudio}
                   className={`group relative flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 shadow-2xl hover:scale-105 transition-all duration-300 z-30 ${theme === 'dark' ? 'bg-gradient-to-t from-slate-900 to-slate-800 border-slate-700 hover:border-amber-400' : 'bg-gradient-to-t from-slate-100 to-white border-slate-300 hover:border-amber-400'}`}
                 >
                    <div className="absolute inset-0 rounded-full border border-white/5 group-hover:animate-ping opacity-20"></div>
                    <Activity size={40} className="text-amber-400 mb-2" />
                    <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Tap to<br/>Tune</span>
                 </button>
              </div>
            )}
            
            <div className={`transition-all duration-500 ${audioStarted ? 'opacity-100' : 'opacity-20 blur-sm scale-95'}`}>
              <TunerMeter 
                cents={displayCents}
                frequency={displayFrequency}
                targetFrequency={displayTargetFreq}
                noteName={displayNoteName}
                rms={tuningResult?.rms || 0}
                theme={theme}
              />
            </div>
         </div>

         {/* Visualizer Section */}
         <div className={`flex-1 border-t rounded-t-3xl relative mt-4 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full border text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg z-10 whitespace-nowrap ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
               <Music2 size={12} /> {isChromatic ? 'CHROMATIC DETECT' : currentScale.name}
            </div>
            <div className="pt-8 pb-8">
               {renderPetals()}
               <p className="text-center text-slate-500 text-xs italic px-6 opacity-60">
                 {isChromatic ? "Detecting all semitones..." : currentScale.description}
               </p>
            </div>
         </div>
      </div>

      {/* Footer Oscilloscope */}
      <div className={`absolute bottom-0 left-0 right-0 h-16 border-t z-20 pointer-events-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
         <Oscilloscope 
            analyser={analyser} 
            isActive={audioStarted} 
            targetFrequency={displayTargetFreq}
            theme={theme}
         />
      </div>

      {showBuilder && (
        <CustomScaleBuilder 
          onSave={(s) => { onSaveCustomScale(s); setShowBuilder(false); }} 
          onClose={() => setShowBuilder(false)} 
        />
      )}
    </div>
  );
};

export default TunerInterface;