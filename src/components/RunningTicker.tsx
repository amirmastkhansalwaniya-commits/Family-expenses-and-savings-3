import React from 'react';
import { PiggyBank, Sparkles } from 'lucide-react';

interface RunningTickerProps {
  theme?: 'light' | 'dark';
}

export const RunningTicker: React.FC<RunningTickerProps> = ({ theme = 'light' }) => {
  const textContent = "थोड़ी बचत बढ़ाए धन का मान, वही दिलाए भविष्य को सुकून और सम्मान।     A small saving increases the value of wealth, which brings peace and respect to the future.";

  return (
    <div className={`w-full overflow-hidden border-t py-2 px-2 transition-colors duration-200 select-none shrink-0 z-30 ${
      theme === 'dark'
        ? 'bg-emerald-950/95 border-emerald-900 text-emerald-200'
        : 'bg-emerald-900 border-emerald-800 text-emerald-50 shadow-inner'
    }`}>
      <div className="flex items-center gap-2 max-w-full overflow-hidden">
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-800 dark:bg-emerald-900 rounded-full border border-emerald-600/60 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider text-emerald-100 shadow-2xs z-10">
          <PiggyBank className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          <span className="hidden sm:inline">Bachat Mantra</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </div>
        
        <div className="overflow-hidden relative w-full flex-1">
          <div className="animate-ticker whitespace-nowrap flex items-center gap-12 font-bold text-xs sm:text-sm tracking-wide">
            <span className="flex items-center gap-6 shrink-0">
              <span>{textContent}</span>
              <span className="text-amber-300 font-extrabold">✦</span>
            </span>
            <span className="flex items-center gap-6 shrink-0">
              <span>{textContent}</span>
              <span className="text-amber-300 font-extrabold">✦</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
