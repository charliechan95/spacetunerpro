import { NOTE_NAMES } from '../constants';

// --- Pitch Detection Logic ---

/**
 * Converts a frequency to the nearest 12-TET Note
 */
export const getNoteFromFrequency = (frequency: number, referencePitch: number) => {
  // Formula: NoteNum = 12 * log2(Freq / Ref) + 69 (A4 is 69)
  // This correctly scales for any reference pitch (e.g. 432Hz)
  const noteNum = 12 * Math.log2(frequency / referencePitch);
  const roundedNote = Math.round(noteNum) + 69; 
  
  const octave = Math.floor(roundedNote / 12) - 1;
  
  // Handle negative indices correctly for JS modulo operator
  const noteIndex = ((roundedNote % 12) + 12) % 12;
  const noteName = NOTE_NAMES[noteIndex];

  // Calculate cents off based on the NEAREST chromatic note (Equal Temperament)
  const targetFrequency = referencePitch * Math.pow(2, (roundedNote - 69) / 12);
  const cents = 1200 * Math.log2(frequency / targetFrequency);

  return {
    noteName,
    octave,
    cents,
    targetFrequency,
    frequency
  };
};

export const getCentsDifference = (frequency: number, targetFrequency: number): number => {
  if (targetFrequency === 0) return 0;
  return 1200 * Math.log2(frequency / targetFrequency);
};

export const getTargetFrequency = (noteName: string, octave: number, referencePitch: number): number => {
  const noteIndex = NOTE_NAMES.indexOf(noteName);
  // MIDI number calculation: (octave + 1) * 12 + noteIndex
  const midiNumber = (octave + 1) * 12 + noteIndex;
  // Frequency: Ref * 2^((midi - 69) / 12)
  return referencePitch * Math.pow(2, (midiNumber - 69) / 12);
};

export const calculateRMS = (buffer: Float32Array): number => {
  let sum = 0;
  // Optimization: Sample every 4th point for RMS is usually sufficient for UI
  for (let i = 0; i < buffer.length; i += 4) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / (buffer.length / 4));
};

/**
 * YIN Pitch Detection Algorithm
 * Superior accuracy for low notes and complex harmonics compared to standard autocorrelation.
 */
export const detectPitch = (buffer: Float32Array, sampleRate: number): { frequency: number, clarity: number } => {
  const bufferSize = buffer.length;
  const tauMax = Math.floor(bufferSize / 2); 
  const integrationWindow = Math.floor(bufferSize / 2);

  // 1. RMS Check to skip silence
  let rms = 0;
  for (let i = 0; i < bufferSize; i += 4) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / (bufferSize / 4));
  
  if (rms < 0.01) return { frequency: -1, clarity: 0 };

  const yinBuffer = new Float32Array(tauMax);

  // 2. Difference Function
  for (let tau = 0; tau < tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < integrationWindow; i++) { 
       const delta = buffer[i] - buffer[i + tau];
       sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // 3. Cumulative Mean Normalized Difference Function (CMNDF)
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < tauMax; tau++) {
    runningSum += yinBuffer[tau];
    if (runningSum === 0) {
      yinBuffer[tau] = 1;
    } else {
      yinBuffer[tau] *= tau / runningSum;
    }
  }

  // 4. Absolute Threshold
  const threshold = 0.15; 
  let bestTau = -1;
  
  for (let tau = 2; tau < tauMax; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < tauMax && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      bestTau = tau;
      break;
    }
  }

  // Fallback: If no match below threshold, find global minimum
  if (bestTau === -1) {
      let minVal = 100;
      for (let tau = 2; tau < tauMax; tau++) {
          if (yinBuffer[tau] < minVal) {
              minVal = yinBuffer[tau];
              bestTau = tau;
          }
      }
      if (minVal > 0.45) { // Threshold for acceptable clarity
          return { frequency: -1, clarity: 0 };
      }
      bestTau = minVal < 1.0 ? bestTau : -1;
  }

  if (bestTau === -1) return { frequency: -1, clarity: 0 };

  // 5. Parabolic Interpolation
  let finalTau = bestTau;
  if (bestTau > 0 && bestTau < tauMax - 1) {
      const s0 = yinBuffer[bestTau - 1];
      const s1 = yinBuffer[bestTau];
      const s2 = yinBuffer[bestTau + 1];
      
      const denominator = 2 * (2 * s1 - s2 - s0);
      if (Math.abs(denominator) > 0.00001) {
         const adjustment = (s2 - s0) / denominator;
         finalTau += adjustment;
      }
  }

  const frequency = sampleRate / finalTau;
  const clarity = 1 - Math.min(1, Math.max(0, yinBuffer[bestTau])); 

  return { frequency, clarity };
};

// --- Note Smoothing ---
export class NoteSmoother {
  private buffer: number[] = [];
  private size: number;
  private emaValue: number | null = null;
  private alpha: number = 0.3; // EMA factor (0.3 = moderate smoothing)

  constructor(size: number = 5) {
    this.size = size;
  }

  add(frequency: number) {
    this.buffer.push(frequency);
    if (this.buffer.length > this.size) {
        this.buffer.shift();
    }

    const sorted = [...this.buffer].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    if (this.emaValue === null || Math.abs(median - this.emaValue) / this.emaValue > 0.05) {
        this.emaValue = median;
        this.buffer = [frequency]; 
    } else {
        this.emaValue = this.emaValue * (1 - this.alpha) + median * this.alpha;
    }
  }

  getSmoothed(): number {
    return this.emaValue || -1;
  }
  
  reset() {
    this.buffer = [];
    this.emaValue = null;
  }
}

// --- Live API Audio Utilities ---

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function convertFloat32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
): Promise<AudioBuffer> {
    // Manually decode PCM16 to AudioBuffer
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export function downsampleBuffer(buffer: Float32Array, sampleRate: number, targetSampleRate: number): Float32Array {
  const ratio = sampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const leftIndex = Math.floor(srcIndex);
    const rightIndex = Math.min(leftIndex + 1, buffer.length - 1);
    const frac = srcIndex - leftIndex;
    result[i] = buffer[leftIndex] * (1 - frac) + buffer[rightIndex] * frac;
  }
  
  return result;
}
