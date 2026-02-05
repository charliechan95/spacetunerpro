export interface NoteDefinition {
  name: string;
  octave: number;
  frequency?: number; // Calculated based on reference pitch
}

export interface ScaleDefinition {
  id: string;
  name: string;
  notes: NoteDefinition[];
  description?: string;
}

export interface AudioConfig {
  referencePitch: number; // e.g., 440, 432
  noiseThreshold: number; // RMS threshold
}

export interface TuningResult {
  detectedFrequency: number;
  closestNote: string; // e.g., "D3"
  noteName: string;    // e.g., "D"
  octave: number;      // e.g., 3
  centsOff: number;
  status: 'perfect' | 'close' | 'far' | 'searching';
  rms: number;         // Current volume/amplitude
}

export interface InstrumentProfile {
  id: string;
  name: string;
  scaleId: string;
  customReferencePitch?: number;
}