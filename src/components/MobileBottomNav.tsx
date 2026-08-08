import React from 'react';
import { Layers, History, CreditCard, Smartphone, Plus, TrendingUp, HandCoins } from 'lucide-react';
import { Language, t } from '../utils/translations';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'transactions' | 'sips' | 'emis' | 'debts' | 'android-guide';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'sips' | 'emis' | 'debts' | 'android-guide') => void;
  onOpenAddExpense: () => void;
  theme: 'light' | 'dark';
  language: Language;
  activeEmisCount?: number;
  activeSipsCount?: number;
  activeDebtsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddExpense,
  theme,
  language,
  activeEmisCount = 0,
  activeSipsCount = 0,
  activeDebtsCount = 0,
}) => {
  const isDark = theme === 'dark';

  return (
    <nav className={`w-full border-t backdrop-blur-lg px-2 py-1.5 transition-colors duration-200 ${
      isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900 shadow-lg'
    }`}>
      <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center relative">
        
        {/* Dashboard Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer w-full ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">{t('tabDashboard', language)}</span>
        </button>

        {/* SIP Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('sips')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative w-full ${
            activeTab === 'sips'
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            {activeSipsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeSipsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{t('tabSips', language)}</span>
        </button>

        {/* Floating Quick Action (+) Button */}
        <div className="-mt-8 flex justify-center items-center">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/50 border-4 border-white dark:border-slate-900 cursor-pointer transition-all hover:scale-105"
            title="Log Expense / SIP Investment"
          >
            <Plus className="w-9 h-9 sm:w-10 sm:h-10 stroke-[3]" />
          </button>
        </div>

        {/* EMIs Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('emis')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative w-full ${
            activeTab === 'emis'
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <CreditCard className="w-5 h-5" />
            {activeEmisCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[9px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeEmisCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{t('tabEmis', language)}</span>
        </button>

        {/* Debts Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('debts')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative w-full ${
            activeTab === 'debts'
              ? 'text-rose-600 dark:text-rose-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <HandCoins className="w-5 h-5 text-rose-500" />
            {activeDebtsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeDebtsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">{t('tabDebts', language)}</span>
        </button>

      </div>
    </nav>
  );
};

