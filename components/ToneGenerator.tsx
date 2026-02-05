
import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Minus, Plus, Activity, Waves, Zap, Triangle } from 'lucide-react';
import { AudioSynth } from '../utils/audioSynth';
import { NOTE_NAMES } from '../constants';

interface Props {
  theme: 'dark' | 'light';
  synth: AudioSynth;
}

const ToneGenerator: React.FC<Props> = ({ theme, synth }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [octave, setOctave] = useState(4);
  const [volume, setVolume] = useState(0.5);

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-800';
  const accentColor = 'text-amber-500';

  // Stop on unmount
  useEffect(() => {
      return () => {
          synth.stopContinuous();
      };
  }, [synth]);

  const togglePlay = () => {
    if (isPlaying) {
        synth.stopContinuous();
        setIsPlaying(false);
    } else {
        synth.playContinuous(frequency, waveform, volume);
        setIsPlaying(true);
    }
  };

  const updateFrequency = (newFreq: number) => {
      const clamped = Math.max(20, Math.min(20000, newFreq));
      setFrequency(clamped);
      if (isPlaying) {
          synth.setFrequency(clamped);
      }
  };

  const updateWaveform = (type: OscillatorType) => {
      setWaveform(type);
      if (isPlaying) {
          synth.setType(type);
      }
  };
  
  const playNote = (noteIndex: number) => {
      // Calc freq relative to A4=440 (Standard)
      // Note index 0 = C. A is index 9.
      // MIDI for C4 is 60. A4 is 69.
      // formula: 440 * 2^((midi - 69)/12)
      
      const midi = (octave + 1) * 12 + noteIndex;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      
      // Update frequency state and synth
      const roundedFreq = parseFloat(freq.toFixed(2));
      updateFrequency(roundedFreq);
      
      if (!isPlaying) {
          synth.playContinuous(roundedFreq, waveform, volume);
          setIsPlaying(true);
      }
  };

  return (
    <div className={`h-full flex flex-col items-center p-6 ${bgColor} overflow-y-auto`}>
      
      <div className="max-w-md w-full space-y-8 pb-24">
          {/* Header */}
          <div className="text-center space-y-2">
              <h2 className={`text-2xl font-tech font-bold ${textColor}`}>Tone Generator</h2>
              <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pure Frequency Synthesis</p>
          </div>

          {/* Main Display & Controls */}
          <div className={`p-8 rounded-3xl border shadow-xl flex flex-col items-center gap-6 relative overflow-hidden ${cardBg} ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              
              {/* Background Decoration */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-purple-600 ${isPlaying ? 'animate-pulse' : ''}`}></div>

              {/* Frequency Display */}
              <div className="flex flex-col items-center z-10">
                  <div className="flex items-baseline gap-2">
                      <input 
                        type="number" 
                        value={frequency}
                        onChange={(e) => updateFrequency(parseFloat(e.target.value))}
                        className={`text-6xl font-mono font-bold bg-transparent text-center w-64 focus:outline-none focus:border-b-2 border-amber-500/50 ${textColor}`}
                      />
                      <span className={`text-xl font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Hz</span>
                  </div>
                  <div className={`text-xs font-mono mt-2 ${isPlaying ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {isPlaying ? 'SIGNAL ACTIVE' : 'SIGNAL OFF'}
                  </div>
              </div>

              {/* Fine Tune Controls */}
              <div className="flex items-center gap-4">
                  <button onClick={() => updateFrequency(frequency - 1)} className={`p-3 rounded-xl border transition-all ${isDark ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
                      <Minus size={20} />
                  </button>
                  
                  {/* Play Button */}
                  <button 
                    onClick={togglePlay}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 ${
                        isPlaying 
                        ? 'bg-amber-500 border-amber-400 text-white shadow-amber-500/30 scale-105' 
                        : isDark ? 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                      {isPlaying ? <Square size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                  </button>

                  <button onClick={() => updateFrequency(frequency + 1)} className={`p-3 rounded-xl border transition-all ${isDark ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
                      <Plus size={20} />
                  </button>
              </div>

              {/* Slider */}
              <div className="w-full px-4">
                  <input 
                    type="range" 
                    min="20" 
                    max="1000" 
                    step="1"
                    value={frequency}
                    onChange={(e) => updateFrequency(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                      <span>20Hz</span>
                      <span>1000Hz</span>
                  </div>
              </div>
          </div>

          {/* Waveform Selector */}
          <div className="grid grid-cols-4 gap-3">
              {[
                  { type: 'sine', icon: <Activity size={24} />, label: 'Sine' },
                  { type: 'triangle', icon: <Triangle size={24} />, label: 'Tri' },
                  { type: 'square', icon: <Square size={24} />, label: 'Sqr' },
                  { type: 'sawtooth', icon: <Waves size={24} />, label: 'Saw' },
              ].map((w) => (
                  <button
                    key={w.type}
                    onClick={() => updateWaveform(w.type as OscillatorType)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        waveform === w.type
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : `${cardBg} ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`
                    }`}
                  >
                      {w.icon}
                      <span className="text-[10px] uppercase font-bold mt-2">{w.label}</span>
                  </button>
              ))}
          </div>

          {/* Quick Notes Grid */}
          <div className={`p-6 rounded-3xl border ${cardBg} ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
               <div className="flex justify-between items-center mb-4">
                   <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Note Presets</h3>
                   <div className="flex items-center gap-2 bg-slate-500/10 rounded-lg p-1">
                       <button onClick={() => setOctave(Math.max(0, octave - 1))} className={`p-1 rounded hover:bg-white/10 ${textColor}`}><Minus size={14}/></button>
                       <span className={`text-xs font-mono font-bold w-12 text-center ${textColor}`}>OCT {octave}</span>
                       <button onClick={() => setOctave(Math.min(8, octave + 1))} className={`p-1 rounded hover:bg-white/10 ${textColor}`}><Plus size={14}/></button>
                   </div>
               </div>
               
               <div className="grid grid-cols-4 gap-2">
                   {NOTE_NAMES.map((note, idx) => (
                       <button
                         key={note}
                         onClick={() => playNote(idx)}
                         className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                             // Check if frequency matches approx (within 0.1)
                             Math.abs(frequency - (440 * Math.pow(2, ((octave + 1) * 12 + idx - 69) / 12))) < 0.1
                             ? 'bg-amber-500 border-amber-400 text-slate-900'
                             : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                         }`}
                       >
                           {note}{octave}
                       </button>
                   ))}
               </div>
          </div>

      </div>
    </div>
  );
};

export default ToneGenerator;
