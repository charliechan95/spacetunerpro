import React, { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Extended duration to show off the logo animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600); // Wait for fade out
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050b14] transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 animate-in zoom-in-50 duration-700 ease-out">
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl animate-pulse"></div>
        
        {/* Main Logo SVG */}
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <defs>
                <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <radialGradient id="dingGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#020617" />
                </radialGradient>
                <path id="curveTop" d="M 60,200 A 140,140 0 0,1 340,200" />
                <path id="curveBottom" d="M 70,200 A 130,130 0 0,0 330,200" />
            </defs>

            {/* Outer Rings */}
            <circle cx="200" cy="200" r="190" fill="#020617" stroke="#0ea5e9" strokeWidth="2" className="animate-[spin_10s_linear_infinite]" strokeDasharray="20 10" opacity="0.3" />
            <circle cx="200" cy="200" r="180" fill="none" stroke="#0ea5e9" strokeWidth="4" className="shadow-[0_0_20px_#0ea5e9]" />
            <circle cx="200" cy="200" r="176" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.8" />

            {/* Text on Path */}
            <text width="400">
                <textPath href="#curveTop" startOffset="50%" textAnchor="middle" className="fill-slate-100 font-tech font-bold text-[32px] tracking-[0.2em]" style={{ textShadow: '0 0 10px rgba(34,211,238,0.8)' }}>
                    HANDPAN
                </textPath>
            </text>

            {/* Central Handpan Illustration */}
            <g transform="translate(0, 20)">
                {/* Back/Bottom of Pan */}
                <ellipse cx="200" cy="220" rx="130" ry="70" fill="#0f172a" />
                
                {/* Top Shell */}
                <ellipse cx="200" cy="205" rx="130" ry="70" fill="url(#metalGradient)" stroke="#38bdf8" strokeWidth="2" />
                
                {/* Ding (Center Note) */}
                <ellipse cx="200" cy="190" rx="40" ry="15" fill="url(#dingGradient)" stroke="#22d3ee" strokeWidth="2">
                   <animate attributeName="stroke-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                </ellipse>
                
                {/* Side Notes */}
                <ellipse cx="130" cy="215" rx="25" ry="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" opacity="0.6" transform="rotate(-15 130 215)" />
                <ellipse cx="270" cy="215" rx="25" ry="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" opacity="0.6" transform="rotate(15 270 215)" />
                <ellipse cx="160" cy="245" rx="20" ry="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" opacity="0.4" />
                <ellipse cx="240" cy="245" rx="20" ry="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" opacity="0.4" />
            </g>

            {/* Sound Waves (Top) */}
            <g className="animate-pulse">
                <path d="M 120,130 Q 200,80 280,130" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                <path d="M 140,145 Q 200,110 260,145" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
                <path d="M 160,160 Q 200,140 240,160" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
            </g>

            {/* Bottom Text */}
            <text x="200" y="320" textAnchor="middle" className="fill-cyan-400 font-tech font-bold text-[24px] tracking-widest" style={{ textShadow: '0 0 10px rgba(34,211,238,0.5)' }}>
                PRO TUNER
            </text>
            <text x="200" y="345" textAnchor="middle" className="fill-slate-400 font-tech text-[12px] tracking-[0.5em]">
                APP
            </text>

            {/* Decoration Ticks */}
            <g stroke="#0ea5e9" strokeWidth="2">
                <line x1="40" y1="200" x2="60" y2="200" />
                <line x1="340" y1="200" x2="360" y2="200" />
                <line x1="200" y1="40" x2="200" y2="60" />
                <line x1="200" y1="360" x2="200" y2="380" />
            </g>
        </svg>
      </div>
      
      {/* Loading Bar */}
      <div className="mt-12 w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[loading_1.5s_ease-in-out_infinite] opacity-75"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
