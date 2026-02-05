import { ScaleDefinition } from './types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const PITCH_PRESETS = [
  { value: 432, label: '432 Hz', desc: 'Verdi / Healing' },
  { value: 440, label: '440 Hz', desc: 'Standard ISO16' },
  { value: 442, label: '442 Hz', desc: 'Orchestral' },
  { value: 444, label: '444 Hz', desc: 'Scientific' },
  { value: 415, label: '415 Hz', desc: 'Baroque' },
];

export const DEFAULT_SCALES: ScaleDefinition[] = [
  {
    id: 'd-kurd',
    name: 'D Kurd',
    description: 'Minor scale, very popular for Handpans.',
    notes: [
      { name: 'D', octave: 3 }, // Ding
      { name: 'A', octave: 3 },
      { name: 'A#', octave: 3 }, // Bb
      { name: 'C', octave: 4 },
      { name: 'D', octave: 4 },
      { name: 'E', octave: 4 },
      { name: 'F', octave: 4 },
      { name: 'G', octave: 4 },
      { name: 'A', octave: 4 },
    ]
  },
  {
    id: 'c-celtic',
    name: 'C Celtic Minor',
    description: 'Mysterious and open sound.',
    notes: [
      { name: 'C', octave: 3 }, // Ding
      { name: 'G', octave: 3 },
      { name: 'A#', octave: 3 },
      { name: 'C', octave: 4 },
      { name: 'D', octave: 4 },
      { name: 'E', octave: 4 }, // Technically Eb in true Celtic usually, but variations exist. Sticking to standard request.
      { name: 'F', octave: 4 },
      { name: 'G', octave: 4 },
    ]
  },
  {
    id: 'a-hijaz',
    name: 'A Hijaz',
    description: 'Middle eastern flavor, Phrygian dominant.',
    notes: [
      { name: 'A', octave: 3 }, // Ding
      { name: 'E', octave: 4 },
      { name: 'F', octave: 4 },
      { name: 'G#', octave: 4 },
      { name: 'A', octave: 4 },
      { name: 'B', octave: 4 },
      { name: 'C', octave: 5 },
      { name: 'E', octave: 5 },
    ]
  },
  {
    id: 'f-integral',
    name: 'F Integral',
    description: 'Hexatonic minor scale.',
    notes: [
      { name: 'F', octave: 3 },
      { name: 'C', octave: 4 },
      { name: 'C#', octave: 4 },
      { name: 'D#', octave: 4 },
      { name: 'F', octave: 4 },
      { name: 'G', octave: 4 },
      { name: 'G#', octave: 4 },
      { name: 'C', octave: 5 },
    ]
  },
  {
    id: 'e-amara',
    name: 'E Amara',
    description: 'Celtic Minor variation in E.',
    notes: [
      { name: 'E', octave: 3 },
      { name: 'B', octave: 3 },
      { name: 'D', octave: 4 },
      { name: 'E', octave: 4 },
      { name: 'F#', octave: 4 },
      { name: 'G', octave: 4 },
      { name: 'A', octave: 4 },
      { name: 'B', octave: 4 },
    ]
  }
];

export const COLORS = {
  background: 'bg-slate-900',
  petalDefault: 'bg-gradient-to-br from-slate-700 to-slate-800',
  petalActive: 'bg-gradient-to-br from-amber-500/20 to-purple-600/20 border-amber-400',
  textMain: 'text-slate-100',
  textMuted: 'text-slate-400',
  accent: 'text-amber-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-rose-400',
};