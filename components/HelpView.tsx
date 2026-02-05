import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Music, Hammer, Mic, Info } from 'lucide-react';

interface HelpViewProps {
  theme: 'dark' | 'light';
}

const HelpView: React.FC<HelpViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const textColor = isDark ? 'text-slate-200' : 'text-slate-800';
  const headingColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`h-full w-full overflow-y-auto ${bgColor} transition-colors duration-300`}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-6">
        
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <BookOpen className="text-amber-500" size={32} />
          </div>
          <h2 className={`text-2xl font-tech font-bold ${headingColor} mb-2`}>Tuning Guide</h2>
          <p className={`${subText} text-sm`}>Master your instrument with precision.</p>
        </div>

        <Section 
          title="Quick Start" 
          icon={<Mic size={20} className="text-emerald-500" />}
          isOpen={true}
          theme={theme}
        >
          <ul className={`list-disc list-inside space-y-2 text-sm ${textColor}`}>
            <li><strong>Enable Microphone:</strong> Allow browser permissions when prompted.</li>
            <li><strong>Select Scale:</strong> Choose your instrument's scale from the top dropdown or create a custom one.</li>
            <li><strong>Tuning:</strong> Tap a note petal or use 'Auto' (Chromatic) mode. Strike your instrument clearly.</li>
            <li><strong>Reference Pitch:</strong> Standard is 440Hz. Use 432Hz for healing/meditative instruments.</li>
          </ul>
        </Section>

        <Section 
          title="Understanding the Interface" 
          icon={<Info size={20} className="text-blue-500" />}
          theme={theme}
        >
          <div className={`space-y-3 text-sm ${textColor}`}>
            <p><strong className={headingColor}>The Meter:</strong> The needle shows pitch accuracy. Green means you are within 5 cents (perfect). Amber/Red means you are sharp or flat.</p>
            <p><strong className={headingColor}>Cents (¢):</strong> A semitone is 100 cents. Precise tuning usually aims for +/- 0 to 5 cents.</p>
            <p><strong className={headingColor}>Delta Hz:</strong> The exact frequency difference. e.g., +2.5Hz means the note is vibrating 2.5 times too fast per second.</p>
          </div>
        </Section>

        <Section 
          title="Handpan Tuning Basics" 
          icon={<Hammer size={20} className="text-amber-500" />}
          theme={theme}
        >
          <div className={`space-y-3 text-sm ${textColor}`}>
            <p>Handpans rely on compressive and expansive stress in the steel.</p>
            <div className={`p-3 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <h4 className={`font-bold ${headingColor} mb-1`}>Fundamental Note</h4>
              <p>To <strong>lower</strong> pitch: Hammer the specific tone field ring (boundary) to expand it.</p>
              <p className="mt-1">To <strong>raise</strong> pitch: Hammer the center of the tone field (dimple area) to compress it.</p>
            </div>
            <p className={`text-xs italic ${subText}`}>Note: This requires a specialized hammer and significant experience. Consult the AI Assistant for technique specifics.</p>
          </div>
        </Section>

        <Section 
          title="Tongue Drum Tuning" 
          icon={<Music size={20} className="text-purple-500" />}
          theme={theme}
        >
          <div className={`space-y-3 text-sm ${textColor}`}>
            <p>Tongue drums (steel tongue) are easier to tune non-destructively.</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Lower Pitch (Flatten):</strong> Add weight to the tip of the tongue. Use strong magnets (neodymium) or beeswax. Moving the weight to the tip lowers the pitch more.</li>
              <li><strong>Raise Pitch (Sharpen):</strong> Remove material from the tip of the tongue (filing) or make the tongue shorter by cutting the slit deeper (irreversible).</li>
            </ul>
          </div>
        </Section>

      </div>
    </div>
  );
};

const Section: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode, isOpen?: boolean, theme: 'dark'|'light' }> = ({ title, icon, children, isOpen: defaultOpen = false, theme }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const cardHover = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50';
  const titleColor = isDark ? 'text-slate-200' : 'text-slate-800';

  return (
    <div className={`${cardBg} border rounded-xl overflow-hidden transition-all duration-200`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 ${cardHover} transition-colors`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className={`font-bold ${titleColor}`}>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className={`p-4 pt-0 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpView;