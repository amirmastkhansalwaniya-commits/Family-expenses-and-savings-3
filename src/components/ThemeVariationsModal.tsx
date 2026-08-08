import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles, X, Sun, Moon, Search, Layers, RefreshCw } from 'lucide-react';
import { APP_VARIATIONS, AppVariation, applyVariation } from '../utils/themeVariations';
import { Language } from '../utils/translations';

interface ThemeVariationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVariationId: string;
  onSelectVariation: (variationId: string) => void;
  language?: Language;
}

export const ThemeVariationsModal: React.FC<ThemeVariationsModalProps> = ({
  isOpen,
  onClose,
  currentVariationId,
  onSelectVariation,
  language = 'en',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', 'Light', 'Dark', 'Classical', 'Warm', 'Tech', 'Luxury', 'Vibrant'];

  const filteredVariations = APP_VARIATIONS.filter((v) => {
    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : selectedCategory === 'Light'
        ? v.mode === 'light'
        : selectedCategory === 'Dark'
        ? v.mode === 'dark'
        : v.category === selectedCategory;

    const matchesSearch =
      searchQuery.trim() === '' ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.nameHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleApply = (id: string) => {
    applyVariation(id);
    onSelectVariation(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in touch-pan-y"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Palette className="w-5 h-5 text-indigo-600 dark:text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'hi' ? 'ऐप डिज़ाइन थीम्स (20 वैरायटी)' : 'App Theme Variations (20 Styles)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                  20 Available
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'अपनी पसंद का कोई भी 15-20 डिज़ाइन बदलें, भविष्य में कभी भी स्विच करें!'
                  : 'Switch between 20 premium visual themes anytime. Instant real-time update.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'थीम खोजें...' : 'Search variations...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Variations Grid */}
        <div className="p-5 overflow-y-auto flex-1 overscroll-contain touch-pan-y">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVariations.map((item) => {
              const isActive = item.id === currentVariationId;

              return (
                <div
                  key={item.id}
                  onClick={() => handleApply(item.id)}
                  className={`group relative rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                    isActive
                      ? 'border-indigo-600 dark:border-amber-400 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-slate-600 shadow-xs'
                  }`}
                >
                  {/* Active Indicator Badge */}
                  {isActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-indigo-600 dark:bg-amber-400 text-white dark:text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>ACTIVE</span>
                    </div>
                  )}

                  <div>
                    {/* Visual Color Preview Swatch */}
                    <div
                      className="w-full h-16 rounded-xl border border-black/10 overflow-hidden mb-3.5 p-2 flex flex-col justify-between shadow-inner relative"
                      style={{ backgroundColor: item.previewColors.bg, color: item.previewColors.ink }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-80" style={{ fontFamily: item.fontHeading }}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: item.previewColors.accent }}
                            title="Accent Color"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: item.previewColors.secondary }}
                            title="Secondary Color"
                          />
                        </div>
                      </div>

                      {/* Mock UI Strip */}
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <div
                          className="px-2 py-1 rounded-md text-[9px] font-bold border"
                          style={{
                            backgroundColor: item.previewColors.card,
                            borderColor: item.previewColors.ink + '20',
                            color: item.previewColors.ink,
                          }}
                        >
                          ₹5,400 Spent
                        </div>
                        <div
                          className="px-2 py-1 rounded-md text-[9px] font-black text-white"
                          style={{ backgroundColor: item.previewColors.accent }}
                        >
                          + ADD
                        </div>
                      </div>
                    </div>

                    {/* Meta & Title */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'hi' ? item.nameHi : item.name}
                      </span>
                      {item.mode === 'dark' ? (
                        <Moon className="w-3 h-3 text-indigo-400 shrink-0" />
                      ) : (
                        <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer Tags & Select Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(item.id);
                      }}
                      className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}
                    >
                      {isActive ? 'Applied' : 'Select Variation'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredVariations.length === 0 && (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'कोई वैरायटी नहीं मिली' : 'No variations found matching your search'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-black text-indigo-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              {language === 'hi'
                ? 'कुल 20 वैरायटी मौजूद हैं। किसी को भी चुनें!'
                : '20 Total Design Variations Available • Instant Switching'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
