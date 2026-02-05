
export class AudioSynth {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Continuous Tone State
  private continuousOsc: OscillatorNode | null = null;
  private continuousGain: GainNode | null = null;

  constructor() {
    // Lazy init
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playTone(frequency: number, type: 'sine' | 'triangle' = 'triangle') {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stop(); // Stop any existing tone

    this.osc = this.ctx.createOscillator();
    this.lfo = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();

    // LFO for Vibrato
    // 5Hz rate, moderate depth
    this.lfo.frequency.value = 5; 
    this.lfo.type = 'sine';
    
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.value = 3; // +/- 3Hz vibrato
    this.lfo.connect(lfoDepth);
    lfoDepth.connect(this.osc.frequency);

    // Main Oscillator
    this.osc.type = type;
    this.osc.frequency.value = frequency;

    // Envelope
    this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.1); // Attack
    this.gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.5); // Decay/Sustain

    // Connections
    this.osc.connect(this.gain);
    this.gain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.osc.start();
    this.lfo.start();
  }

  stop() {
    if (this.gain && this.ctx) {
      // Release
      const now = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      const oldOsc = this.osc;
      const oldLfo = this.lfo;
      
      setTimeout(() => {
        oldOsc?.stop();
        oldLfo?.stop();
        oldOsc?.disconnect();
        oldLfo?.disconnect();
      }, 250);
    }
  }

  // --- Continuous Tone Generator Methods ---

  playContinuous(frequency: number, type: OscillatorType = 'sine', volume: number = 0.5) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    // If already playing, just update parameters to avoid clicks
    if (this.continuousOsc && this.continuousGain) {
        this.continuousOsc.frequency.setTargetAtTime(frequency, this.ctx.currentTime, 0.05);
        this.continuousOsc.type = type;
        this.continuousGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
        return;
    }

    this.continuousOsc = this.ctx.createOscillator();
    this.continuousGain = this.ctx.createGain();

    this.continuousOsc.type = type;
    this.continuousOsc.frequency.value = frequency;
    
    this.continuousGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.continuousGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.1);

    this.continuousOsc.connect(this.continuousGain);
    this.continuousGain.connect(this.ctx.destination);

    this.continuousOsc.start();
  }

  stopContinuous() {
    if (this.continuousGain && this.ctx) {
       const now = this.ctx.currentTime;
       this.continuousGain.gain.cancelScheduledValues(now);
       this.continuousGain.gain.setValueAtTime(this.continuousGain.gain.value, now);
       this.continuousGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
       
       const oldOsc = this.continuousOsc;
       // Disconnect after release
       setTimeout(() => {
           if (oldOsc === this.continuousOsc) {
               oldOsc?.stop();
               oldOsc?.disconnect();
               this.continuousOsc = null;
               this.continuousGain = null;
           }
       }, 150);
    }
  }
  
  setFrequency(freq: number) {
      if (this.continuousOsc && this.ctx) {
          this.continuousOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
      }
  }

  setType(type: OscillatorType) {
      if (this.continuousOsc) {
          this.continuousOsc.type = type;
      }
  }
}
