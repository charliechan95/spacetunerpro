import React, { useEffect, useRef } from 'react';

interface OscilloscopeProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  targetFrequency?: number;
  theme?: 'dark' | 'light';
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({ analyser, isActive, targetFrequency, theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyser.frequencyBinCount; 
    const timeData = new Uint8Array(analyser.fftSize); 
    const freqData = new Uint8Array(bufferLength);

    const isDark = theme === 'dark';
    
    // Theme Colors
    const bgColor = isDark ? 'rgba(2, 6, 23, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    const spectrumBaseHue = isDark ? 200 : 210; // Blue-ish
    const waveformColor = isDark ? '#38bdf8' : '#0ea5e9'; // Sky blue / Sky 500
    const waveShadowColor = isDark ? '#38bdf8' : 'transparent';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const targetSineColor = isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)'; // Amber

    const draw = () => {
      if (!isActive) {
        // Draw static line if inactive
        ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = gridColor;
        ctx.beginPath();
        ctx.moveTo(0, rect.height/2);
        ctx.lineTo(rect.width, rect.height/2);
        ctx.stroke();
        return;
      }
      
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // 1. Clear with heavy fade for trail effect
      ctx.fillStyle = bgColor; 
      ctx.fillRect(0, 0, rect.width, rect.height);

      // 2. Draw Frequency Spectrum (Background Bars)
      const barWidth = (rect.width / bufferLength) * 2.5; 
      let barX = 0;
      
      // Limit frequency drawing to lower half (most musical content)
      const visibleBins = Math.floor(bufferLength * 0.6); 
      
      for (let i = 0; i < visibleBins; i += 4) { 
        const percent = freqData[i] / 255;
        const barHeight = percent * rect.height * 0.8;
        
        // Dynamic Color based on frequency height
        const hue = spectrumBaseHue + (percent * 120); 
        const saturation = isDark ? '80%' : '60%';
        const lightness = isDark ? '60%' : '50%';
        const alpha = 0.1 + percent * 0.4;

        ctx.fillStyle = `hsla(${hue}, ${saturation}, ${lightness}, ${alpha})`;
        
        ctx.beginPath();
        ctx.roundRect(barX, rect.height - barHeight, barWidth * 3, barHeight, 4);
        ctx.fill();

        barX += barWidth * 4;
      }

      // 3. Draw Time Domain Waveform (Foreground Line)
      ctx.lineWidth = 2;
      ctx.shadowBlur = isDark ? 8 : 0;
      ctx.shadowColor = waveShadowColor;
      ctx.strokeStyle = waveformColor;
      
      ctx.beginPath();
      const sliceWidth = rect.width / analyser.fftSize;
      let x = 0;
      const step = 4; // Downsample
      
      for (let i = 0; i < analyser.fftSize; i += step) {
        const v = timeData[i] / 128.0;
        const y = (v * rect.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Bezier curve for smoother look could be here, but straight line with high sample rate is fine
          ctx.lineTo(x, y);
        }

        x += sliceWidth * step;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Draw Ideal Sine Wave Overlay (if targetFrequency exists)
      if (targetFrequency) {
         ctx.lineWidth = 1;
         ctx.strokeStyle = targetSineColor;
         ctx.beginPath();
         
         const audioCtxSampleRate = analyser.context.sampleRate;
         const cyclesToShow = 4;
         const pointsToDraw = 400; 
         const samplesPerCycle = audioCtxSampleRate / targetFrequency;
         const totalSamples = samplesPerCycle * cyclesToShow;
         const drawStepWidth = rect.width / pointsToDraw;

         x = 0;
         for (let i = 0; i < pointsToDraw; i++) {
            const sampleIndex = (i / pointsToDraw) * totalSamples;
            const t = sampleIndex / audioCtxSampleRate; 
            const sineVal = Math.sin(2 * Math.PI * targetFrequency * t);
            
            const y = (rect.height / 2) + (sineVal * (rect.height / 4)); 

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            x += drawStepWidth;
         }
         ctx.stroke();
      }
      
      // Center Line
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, rect.height/2);
      ctx.lineTo(rect.width, rect.height/2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, isActive, targetFrequency, theme]);

  return (
    <div className={`relative w-full h-40 border-t shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block"
        />
        <div className={`absolute bottom-2 right-2 text-[10px] font-mono pointer-events-none ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            FREQ VISUALIZER
        </div>
    </div>
  );
};

export default Oscilloscope;