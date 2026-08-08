import React, { useState, useEffect } from 'react';
import { Type, X, Check, RotateCcw, Sparkles, Baseline } from 'lucide-react';
import {
  TypographySettings,
  LetterWeightOption,
  LetterCaseOption,
  LetterSpacingOption,
  LetterFontOption,
  getSavedTypographySettings,
  applyTypographySettings,
  DEFAULT_TYPOGRAPHY_SETTINGS,
} from '../utils/typographySettings';
import { Language } from '../utils/translations';

interface TypographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

const WEIGHT_OPTIONS: { id: LetterWeightOption; label: string; sample: string; badge: string }[] = [
  { id: 'default', label: 'Theme Default', sample: 'Aa Bb Cc (Default)', badge: 'Auto' },
  { id: 'thin', label: '100 - Thin (Very Light)', sample: 'Aa Bb Cc (Thin 100)', badge: '100' },
  { id: 'extra-light', label: '200 - Extra Light', sample: 'Aa Bb Cc (Extra Light 200)', badge: '200' },
  { id: 'light', label: '300 - Light', sample: 'Aa Bb Cc (Light 300)', badge: '300' },
  { id: 'normal', label: '400 - Regular / Normal', sample: 'Aa Bb Cc (Regular 400)', badge: '400' },
  { id: 'medium', label: '500 - Medium', sample: 'Aa Bb Cc (Medium 500)', badge: '500' },
  { id: 'semibold', label: '600 - Semi Bold', sample: 'Aa Bb Cc (SemiBold 600)', badge: '600' },
  { id: 'bold', label: '700 - Bold (Strong)', sample: 'Aa Bb Cc (Bold 700)', badge: '700' },
  { id: 'extrabold', label: '800 - Extra Bold', sample: 'Aa Bb Cc (ExtraBold 800)', badge: '800' },
  { id: 'black', label: '900 - Ultra Black / Heavy', sample: 'Aa Bb Cc (Heavy Black 900)', badge: '900' },
];

const CASE_OPTIONS: { id: LetterCaseOption; label: string; sample: string }[] = [
  { id: 'default', label: 'Original Mixed Case', sample: 'Family Expense Tracker' },
  { id: 'uppercase', label: 'ALL UPPERCASE', sample: 'FAMILY EXPENSE TRACKER' },
  { id: 'lowercase', label: 'all lowercase', sample: 'family expense tracker' },
  { id: 'capitalize', label: 'Capitalize Words', sample: 'Family Expense Tracker' },
];

const SPACING_OPTIONS: { id: LetterSpacingOption; label: string; sample: string }[] = [
  { id: 'default', label: 'Default Spacing', sample: 'INR ₹ 50,000' },
  { id: 'tight', label: 'Tight / Compact', sample: 'INR ₹ 50,000' },
  { id: 'normal', label: 'Normal Standard', sample: 'INR ₹ 50,000' },
  { id: 'wide', label: 'Wide Spaced', sample: 'INR ₹ 50,000' },
  { id: 'extrawide', label: 'Extra Wide Tracking', sample: 'INR ₹ 50,000' },
];

const FONT_OPTIONS: { id: LetterFontOption; label: string; family: string; sample: string }[] = [
  { id: 'default', label: 'Theme Default Font', family: 'Inherit', sample: 'Default Theme Typography' },
  { id: 'inter', label: 'Inter (Clean Modern Sans)', family: 'Inter, sans-serif', sample: 'Clean Modern Interface' },
  { id: 'garamond', label: 'Cormorant Garamond (Classic Serif)', family: 'Cormorant Garamond, serif', sample: 'Executive Editorial Style' },
  { id: 'mono', label: 'JetBrains Mono (Tech Code)', family: 'JetBrains Mono, monospace', sample: '0123456789 Monospace' },
  { id: 'gaegu', label: 'Gaegu (Playful Hand)', family: 'Gaegu, cursive', sample: 'Handwritten Casual Note' },
  { id: 'syne', label: 'Syne (Geometric Display)', family: 'Syne, sans-serif', sample: 'Bold Modern Geometric' },
];

export const TypographyModal: React.FC<TypographyModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
}) => {
  const [settings, setSettings] = useState<TypographySettings>(getSavedTypographySettings());

  useEffect(() => {
    if (isOpen) {
      setSettings(getSavedTypographySettings());
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (updated: Partial<TypographySettings>) => {
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    applyTypographySettings(newSettings);
  };

  const handleReset = () => {
    setSettings(DEFAULT_TYPOGRAPHY_SETTINGS);
    applyTypographySettings(DEFAULT_TYPOGRAPHY_SETTINGS);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in touch-pan-y"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md font-black text-lg">
              Aa
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'hi' ? 'ऐप अक्षर एवं फॉन्ट स्टाइल' : 'App Letters & Typography Settings'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Bold & Thin Options
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'सभी अक्षरों को बोल्ड, थिन (पतला), अपरकेस या कस्टम स्पेसिंग में सेट करें'
                  : 'Customize letter weights (Bold, Thin, Light, Black), casing & letter spacing across the app.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 overscroll-contain touch-pan-y">
          
          {/* Section 1: Letter Weight (Bold vs Thin Options) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-600" />
                <span>1. Letter Weight (Thickness: Thin to Ultra Bold)</span>
              </label>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                Current: {WEIGHT_OPTIONS.find((w) => w.id === settings.letterWeight)?.label || 'Default'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WEIGHT_OPTIONS.map((opt) => {
                const isSelected = settings.letterWeight === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdate({ letterWeight: opt.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-extrabold truncate">{opt.label}</span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <p
                      className="text-[11px] opacity-90 truncate mt-0.5"
                      style={{
                        fontWeight:
                          opt.id === 'thin'
                            ? 100
                            : opt.id === 'extra-light'
                            ? 200
                            : opt.id === 'light'
                            ? 300
                            : opt.id === 'normal'
                            ? 400
                            : opt.id === 'medium'
                            ? 500
                            : opt.id === 'semibold'
                            ? 600
                            : opt.id === 'bold'
                            ? 700
                            : opt.id === 'extrabold'
                            ? 800
                            : opt.id === 'black'
                            ? 900
                            : 'inherit',
                      }}
                    >
                      {opt.sample}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Letter Case & Transform */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Baseline className="w-4 h-4 text-indigo-600" />
                <span>2. Letter Case & Capitalization Types</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CASE_OPTIONS.map((opt) => {
                const isSelected = settings.letterCase === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdate({ letterCase: opt.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400 font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-xs block font-bold mb-1">{opt.label}</span>
                    <span
                      className="text-[11px] block text-slate-500 dark:text-slate-400 truncate"
                      style={{
                        textTransform:
                          opt.id === 'uppercase'
                            ? 'uppercase'
                            : opt.id === 'lowercase'
                            ? 'lowercase'
                            : opt.id === 'capitalize'
                            ? 'capitalize'
                            : 'none',
                      }}
                    >
                      {opt.sample}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Letter Spacing */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-600" />
                <span>3. Letter Spacing (Tracking Width)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SPACING_OPTIONS.map((opt) => {
                const isSelected = settings.letterSpacing === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdate({ letterSpacing: opt.id })}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400 font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-[11px] block font-extrabold truncate">{opt.label}</span>
                    <span
                      className="text-[10px] block opacity-80 truncate"
                      style={{
                        letterSpacing:
                          opt.id === 'tight'
                            ? '-0.04em'
                            : opt.id === 'wide'
                            ? '0.06em'
                            : opt.id === 'extrawide'
                            ? '0.12em'
                            : 'normal',
                      }}
                    >
                      {opt.sample}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Font Family / Types */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>4. Global Font Family (Letter Style Types)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {FONT_OPTIONS.map((opt) => {
                const isSelected = settings.letterFont === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdate({ letterFont: opt.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-xs block font-bold mb-1">{opt.label}</span>
                    <span className="text-[11px] block opacity-90 truncate" style={{ fontFamily: opt.family }}>
                      {opt.sample}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
