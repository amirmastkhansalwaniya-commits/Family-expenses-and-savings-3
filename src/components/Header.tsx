import React, { useState, useRef, useEffect } from 'react';
import { FamilyMember, FAMILY_MEMBERS, MemberCustomConfig } from '../types';
import { Plus, Layers, History, CreditCard, Settings, TrendingUp, HandCoins, ChevronDown } from 'lucide-react';
import { Language, t } from '../utils/translations';
import { AppLogo } from './AppLogo';
import { MemberAvatar } from './MemberAvatar';
import { 
  AppBrandingSettings, 
  getHeaderTitle, 
  getHeaderColorClass, 
  getHeaderFontStyle 
} from '../utils/appBranding';

interface HeaderProps {
  activeMember: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
  activeTab: 'dashboard' | 'transactions' | 'sips' | 'emis' | 'debts' | 'android-guide';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'sips' | 'emis' | 'debts' | 'android-guide') => void;
  onOpenAddExpense: () => void;
  isSyncing: boolean;
  totalExpensesCount: number;
  theme: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenThemeVariations?: () => void;
  onOpenTypography?: () => void;
  activeEmisCount?: number;
  activeSipsCount?: number;
  activeDebtsCount?: number;
  language: Language;
  onSelectLanguage?: (lang: Language) => void;
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
  onOpenSettings?: () => void;
  brandingSettings?: AppBrandingSettings;
}

export const Header: React.FC<HeaderProps> = ({
  activeMember,
  onSelectMember,
  activeTab,
  setActiveTab,
  onOpenAddExpense,
  isSyncing,
  totalExpensesCount,
  theme,
  activeEmisCount,
  activeSipsCount,
  activeDebtsCount,
  language,
  familyMembers = FAMILY_MEMBERS,
  memberConfigs,
  onOpenSettings,
  brandingSettings,
}) => {
  const isDark = theme === 'dark';

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const customTitle = getHeaderTitle(brandingSettings, t('appName', language));
  const fontStyle = getHeaderFontStyle(brandingSettings);
  const colorClass = getHeaderColorClass(brandingSettings, isDark);

  return (
    <header className={`border-b sticky top-0 z-30 transition-colors duration-200 shadow-xs ${
      isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3">
          
          {/* Logo & Sync Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <AppLogo size={50} brandingSettings={brandingSettings} />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 
                    className={`text-xl sm:text-2xl font-black tracking-tight ${colorClass}`}
                    style={fontStyle ? { fontFamily: fontStyle } : undefined}
                  >
                    {customTitle}
                  </h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border shadow-sm transform -rotate-1 ${
                    isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {t('currencyTag', language)}
                  </span>
                </div>
                <div className={`flex items-center space-x-2 text-xs font-semibold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
                    {isSyncing ? t('syncing', language) : t('realtimeSync', language)}
                  </span>
                  <span>•</span>
                  <span>{totalExpensesCount} {t('entries', language)}</span>
                </div>
              </div>
            </div>

            {/* Mobile Actions: Add Expense */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ {t('addInr', language)}</span>
              </button>
            </div>
          </div>

          {/* Active Member Selector & Primary Desktop Actions */}
          <div className="flex flex-wrap items-center gap-2.5 justify-between md:justify-end">
            
            {/* Active Device Profile Selector */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className={`flex items-center gap-2 border rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 transition-all cursor-pointer shadow-2xs ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-750'
                    : 'bg-slate-50 border-slate-200/80 text-slate-900 hover:bg-slate-100'
                }`}
                title="Click to switch active member profile"
              >
                <MemberAvatar member={activeMember} memberConfigs={memberConfigs} size="xs" isActive={true} />
                <span className="text-xs sm:text-sm font-black truncate max-w-[110px] sm:max-w-none">
                  {activeMember}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border p-2 z-50 animate-fade-in ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white shadow-slate-950' : 'bg-white border-slate-200 text-slate-900 shadow-slate-200'
                }`}>
                  <div className="px-2.5 py-1.5 mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span>{t('activeMember', language)}</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Green = Active
                    </span>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
                    {familyMembers.map((m) => {
                      const isActive = activeMember === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            onSelectMember(m as FamilyMember);
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            isActive
                              ? isDark
                                ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-800'
                                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : isDark
                                ? 'hover:bg-slate-700/80 text-slate-200'
                                : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MemberAvatar member={m} memberConfigs={memberConfigs} size="sm" isActive={isActive} />
                            <span className="truncate">{m}</span>
                          </div>
                          {isActive ? (
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">Switch</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center space-x-2 overflow-x-auto no-scrollbar border-t py-2.5 text-xs sm:text-sm font-bold ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? isDark
                  ? 'bg-indigo-950/80 text-indigo-300 font-extrabold border border-indigo-800/80'
                  : 'bg-indigo-50 text-indigo-700 font-extrabold shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('tabDashboard', language)}</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'transactions'
                ? isDark
                  ? 'bg-indigo-950/80 text-indigo-300 font-extrabold border border-indigo-800/80'
                  : 'bg-indigo-50 text-indigo-700 font-extrabold shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t('tabTransactions', language)}</span>
          </button>

          <button
            onClick={() => setActiveTab('sips')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sips'
                ? isDark
                  ? 'bg-emerald-950/80 text-emerald-300 font-extrabold border border-emerald-800/80'
                  : 'bg-emerald-50 text-emerald-700 font-extrabold shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="flex items-center gap-1.5">
              {t('tabSips', language)}
              {typeof activeSipsCount === 'number' && activeSipsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-mono font-black">
                  {activeSipsCount}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('emis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'emis'
                ? isDark
                  ? 'bg-indigo-950/80 text-indigo-300 font-extrabold border border-indigo-800/80'
                  : 'bg-indigo-50 text-indigo-700 font-extrabold shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <span className="flex items-center gap-1.5">
              {t('tabEmis', language)}
              {typeof activeEmisCount === 'number' && activeEmisCount > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-mono font-black">
                  {activeEmisCount}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'debts'
                ? isDark
                  ? 'bg-rose-950/80 text-rose-300 font-extrabold border border-rose-800/80'
                  : 'bg-rose-50 text-rose-700 font-extrabold shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <HandCoins className="w-4 h-4 text-rose-500" />
            <span className="flex items-center gap-1.5">
              {t('tabDebts', language)}
              {typeof activeDebtsCount === 'number' && activeDebtsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-mono font-black">
                  {activeDebtsCount}
                </span>
              )}
            </span>
          </button>

          {/* Settings Button placed on the navigation tab bar */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ml-auto border shadow-2xs active:scale-95 ${
                isDark
                  ? 'bg-indigo-950/90 text-indigo-300 border-indigo-800/80 hover:bg-indigo-900/90'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Open App Settings & Preferences"
            >
              <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-extrabold">{language === 'hi' ? 'सेटिंग्स' : 'Settings'}</span>
            </button>
          )}
          </div>
      </div>
    </header>
  );
};
