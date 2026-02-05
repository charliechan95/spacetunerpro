import React from 'react';

interface TunerMeterProps {
  cents: number;
  frequency: number;
  targetFrequency: number;
  noteName: string;
  rms: number;
  theme: 'dark' | 'light';
}

const TunerMeter: React.FC<TunerMeterProps> = ({ cents, frequency, targetFrequency, noteName, rms, theme }) => {
  const displayCents = Math.max(-50, Math.min(50, cents));
  const rotation = (displayCents / 50) * 45; 

  let statusColor = 'text-rose-500'; 
  let needleColor = '#f43f5e';
  let statusText = 'OUT OF TUNE';
  let isLocked = false;
  
  const absCents = Math.abs(cents);
  if (absCents <= 5) {
    statusColor = 'text-emerald-500';
    needleColor = '#10b981';
    statusText = 'PERFECT';
    isLocked = true;
  } else if (absCents <= 20) {
    statusColor = 'text-amber-500';
    needleColor = '#f59e0b';
    statusText = cents > 0 ? 'SHARP' : 'FLAT';
  } else {
    statusText = cents > 0 ? 'TOO SHARP' : 'TOO FLAT';
  }

  const deltaHz = frequency - targetFrequency;
  const deltaSign = deltaHz > 0 ? '+' : '';
  const showDelta = frequency > 20 && targetFrequency > 20;

  const sustainPercent = Math.min(100, Math.max(0, rms * 400)); 
  const dampingColor = sustainPercent > 50 ? 'bg-emerald-400' : sustainPercent > 20 ? 'bg-amber-400' : 'bg-slate-500';

  const renderTicks = () => {
    const ticks = [];
    for (let i = -50; i <= 50; i += 2) {
      const isMajor = i % 10 === 0;
      const isMiddle = i === 0;
      const h = isMiddle ? 15 : isMajor ? 10 : 5;
      const w = isMiddle ? 3 : isMajor ? 2 : 1;
      const tickColor = isMiddle ? '#f59e0b' : theme === 'dark' ? '#475569' : '#cbd5e1';
      const angle = (i / 50) * 45;
      
      ticks.push(
        <div
          key={i}
          className="absolute origin-bottom bottom-0 left-1/2"
          style={{
            height: '100%',
            width: '2px',
            transform: `translateX(-50%) rotate(${angle}deg)`,
          }}
        >
          <div style={{ width: `${w}px`, height: `${h}%`, backgroundColor: tickColor, margin: '0 auto' }} />
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className="relative w-full max-w-[320px] aspect-[4/3] flex flex-col items-center justify-end mx-auto transition-transform duration-300">
      
      {/* Background Glow when Locked */}
      <div className={`absolute inset-0 rounded-t-full blur-3xl transition-opacity duration-500 ${isLocked ? 'bg-emerald-500/20 opacity-100' : 'opacity-0'}`}></div>

      {/* Gauge Background */}
      <div className="absolute top-0 w-full h-full overflow-hidden">
        <div className={`w-full h-[200%] rounded-[50%] border-t-[20px] absolute top-0 left-0 box-border ${theme === 'dark' ? 'border-slate-800 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)]' : 'border-slate-200'}`} />
      </div>

      <div className="absolute top-[10%] w-[80%] h-[80%] opacity-80">
         {renderTicks()}
      </div>

      {/* Digital Readout */}
      <div className="absolute top-[35%] flex flex-col items-center z-10">
        <div className={`text-7xl font-tech font-bold tracking-tighter ${statusColor} drop-shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-colors duration-200`}>
          {noteName}
        </div>
        <div className={`text-xs font-bold tracking-[0.2em] mt-2 ${statusColor} ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200'} px-3 py-1 rounded border shadow-sm`}>
          {statusText}
        </div>
        {showDelta && (
           <div className={`mt-2 font-mono text-xs ${Math.abs(deltaHz) < 0.5 ? 'text-emerald-500 font-bold' : 'text-slate-500'}`}>
              {deltaSign}{deltaHz.toFixed(2)} Hz
           </div>
        )}
      </div>

      {/* Needle */}
      <div 
        className="absolute bottom-0 left-1/2 w-1.5 h-[85%] origin-bottom transition-transform duration-200 ease-out z-20"
        style={{ 
          transform: `translateX(-50%) rotate(${rotation}deg)`,
        }}
      >
        <div className="w-full h-full rounded-t-full shadow-lg relative" style={{ backgroundColor: needleColor }}>
           {/* Needle Glare */}
           <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20"></div>
        </div>
      </div>
      
      <div className={`absolute bottom-[-10px] w-8 h-8 rounded-full border-4 z-30 shadow-xl ${theme === 'dark' ? 'bg-slate-700 border-slate-900' : 'bg-slate-300 border-white'}`} />

      {/* Stats */}
      <div className={`absolute bottom-2 left-0 text-left p-1.5 rounded backdrop-blur-sm border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200'}`}>
         <div className="text-[9px] uppercase text-slate-500 tracking-wider">Target</div>
         <div className={`text-lg font-mono leading-none ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{targetFrequency.toFixed(2)}</div>
      </div>

      <div className={`absolute bottom-2 right-0 text-right p-1.5 rounded backdrop-blur-sm border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200'}`}>
         <div className="text-[9px] uppercase text-slate-500 tracking-wider">Detected</div>
         <div className="text-lg font-mono text-amber-500 leading-none">{frequency.toFixed(2)}</div>
      </div>

      {/* Cents Pill */}
      <div className={`absolute bottom-[20%] right-[20%] px-2 py-1 rounded border font-mono text-sm shadow-lg ${statusColor} ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'}`}>
         {cents > 0 ? '+' : ''}{cents.toFixed(1)}¢
      </div>

      {/* Sustain Bar */}
      <div className="absolute bottom-[20%] left-[20%] w-24 flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity">
         <div className={`w-full h-1 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
         <div className={`w-1.5 h-20 rounded-full overflow-hidden border relative mt-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300'}`}>
             <div 
                className={`absolute bottom-0 left-0 w-full transition-all duration-75 ease-out ${dampingColor}`}
                style={{ height: `${sustainPercent}%` }}
             ></div>
         </div>
      </div>
    </div>
  );
};

export default TunerMeter;
