import React, { useState, useMemo } from 'react';
import { 
  Expense, 
  FamilyMember, 
  FAMILY_MEMBERS, 
  MemberCustomConfig, 
  MemberBankAmount,
  EmiPlan,
  getMemberTheme 
} from '../types';
import { 
  formatINR, 
  formatDateDisplay, 
  formatMonthName, 
  getCurrentMonthKey 
} from '../utils/formatters';
import { 
  groupExpensesByMonth, 
  exportExpensesToPDF,
  MonthExpenseGroup 
} from '../utils/exportImport';
import { MemberAvatar } from './MemberAvatar';
import { Language, t, getCategoryLabel } from '../utils/translations';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Layers, 
  Search, 
  TrendingUp, 
  User, 
  Clock, 
  ArrowRight, 
  Edit2, 
  Trash2, 
  Plus, 
  Sparkles,
  PieChart as PieChartIcon,
  Tag,
  Check,
  RotateCcw,
  CheckCircle2,
  FileText,
  X,
  AlertTriangle
} from 'lucide-react';

interface MonthWiseDataViewProps {
  expenses: Expense[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'transactions' | 'months' | 'sips' | 'emis' | 'debts') => void;
  onOpenAddExpense: () => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => Promise<void> | void;
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
  memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
  monthlyBudget?: number;
  language?: Language;
  theme?: 'light' | 'dark';
}

export const MonthWiseDataView: React.FC<MonthWiseDataViewProps> = ({
  expenses,
  selectedMonth,
  onMonthChange,
  onNavigateTab,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
  familyMembers = FAMILY_MEMBERS,
  memberConfigs = {},
  memberBankAmounts = {},
  monthlyBudget = 50000,
  language = 'en',
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const currentCalMonth = getCurrentMonthKey();

  // Active filter state: 'all' to show all months, or a specific month key like '2026-08'
  const [activeFilterMonth, setActiveFilterMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => {
    // Expand current selected month and the most recent month by default
    const initial: Record<string, boolean> = {};
    if (selectedMonth) initial[selectedMonth] = true;
    initial[currentCalMonth] = true;
    return initial;
  });
  const [customMonthInput, setCustomMonthInput] = useState<string>(selectedMonth || currentCalMonth);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // View mode switcher: 'months' for month-wise card accordion, 'all-transactions' for full transactions list
  const [viewMode, setViewMode] = useState<'months' | 'all-transactions'>('months');
  // Two-step inline delete confirmation tracker
  const [inlineConfirmId, setInlineConfirmId] = useState<string | null>(null);

  // Group all expenses chronologically by month using the helper
  const allMonthGroups = useMemo(() => {
    return groupExpensesByMonth(expenses);
  }, [expenses]);

  // Extract all distinct month keys
  const availableMonthKeys = useMemo(() => {
    const keys = allMonthGroups.map(g => g.monthKey);
    // Ensure selectedMonth and current month are in list if not already
    const set = new Set<string>(keys);
    if (selectedMonth && !set.has(selectedMonth)) set.add(selectedMonth);
    if (currentCalMonth && !set.has(currentCalMonth)) set.add(currentCalMonth);
    return Array.from(set).sort((a: string, b: string) => b.localeCompare(a));
  }, [allMonthGroups, selectedMonth, currentCalMonth]);

  // Filtered month groups based on activeFilterMonth & searchTerm
  const displayedMonthGroups = useMemo(() => {
    let list = allMonthGroups;

    if (activeFilterMonth !== 'all') {
      list = list.filter(g => g.monthKey === activeFilterMonth);
      // If selected month has no expenses yet, provide an empty group for it
      if (list.length === 0) {
        let label = activeFilterMonth;
        try {
          const [y, m] = activeFilterMonth.split('-');
          const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
          if (!isNaN(d.getTime())) {
            label = d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' });
          }
        } catch {}
        list = [{
          monthKey: activeFilterMonth,
          monthLabel: label,
          expenses: [],
          total: 0
        }];
      }
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      list = list.map(group => {
        const matched = group.expenses.filter(exp => {
          const matchMember = (exp.paidBy || '').toLowerCase().includes(term);
          const matchCategory = (exp.category || '').toLowerCase().includes(term);
          const matchNotes = (exp.notes || '').toLowerCase().includes(term);
          const matchAmount = String(exp.amount || '').includes(term);
          const matchDate = (exp.date || '').includes(term);
          return matchMember || matchCategory || matchNotes || matchAmount || matchDate;
        });
        return {
          ...group,
          expenses: matched,
          total: matched.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        };
      }).filter(group => group.expenses.length > 0 || group.monthLabel.toLowerCase().includes(term));
    }

    return list;
  }, [allMonthGroups, activeFilterMonth, searchTerm, language]);

  // Flat list of all transactions sorted by date descending (for 'all-transactions' view)
  const allFilteredTransactions = useMemo(() => {
    let list = [...expenses];
    if (activeFilterMonth !== 'all') {
      list = list.filter(e => e.date && e.date.startsWith(activeFilterMonth));
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(exp => {
        const matchMember = (exp.paidBy || '').toLowerCase().includes(term);
        const matchCategory = (exp.category || '').toLowerCase().includes(term);
        const matchNotes = (exp.notes || '').toLowerCase().includes(term);
        const matchAmount = String(exp.amount || '').includes(term);
        const matchDate = (exp.date || '').includes(term);
        return matchMember || matchCategory || matchNotes || matchAmount || matchDate;
      });
    }
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [expenses, activeFilterMonth, searchTerm]);

  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    availableMonthKeys.forEach(k => { allExpanded[k] = true; });
    setExpandedMonths(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedMonths({});
  };

  // Switch the app's global active month and navigate to Dashboard
  const handleSelectMonthForApp = (monthKey: string, navigateToDashboard: boolean = false) => {
    onMonthChange(monthKey);
    if (navigateToDashboard) {
      onNavigateTab('dashboard');
    }
  };

  // Download PDF statement for a specific month
  const handleDownloadMonthPDF = (monthKey: string, monthExpenses: Expense[]) => {
    const memberTotals: Record<string, { amount: number; count: number }> = {};
    familyMembers.forEach(m => {
      memberTotals[m] = { amount: 0, count: 0 };
    });

    monthExpenses.forEach(exp => {
      if (exp.paidBy) {
        if (!memberTotals[exp.paidBy]) {
          memberTotals[exp.paidBy] = { amount: 0, count: 0 };
        }
        memberTotals[exp.paidBy].amount += Number(exp.amount) || 0;
        memberTotals[exp.paidBy].count += 1;
      }
    });

    exportExpensesToPDF({
      expenses: monthExpenses,
      selectedMonth: monthKey,
      monthlyBudget,
      memberTotals: memberTotals as any,
      memberBankAmounts,
      language: language as Language
    });

    setDownloadSuccessNotice(`PDF Report downloaded for ${monthKey}!`);
    setTimeout(() => setDownloadSuccessNotice(null), 4000);
  };

  // Lifetime metrics
  const totalLifetimeAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Download Toast Notification */}
      {downloadSuccessNotice && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-700/80 flex items-center gap-2.5 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{downloadSuccessNotice}</span>
        </div>
      )}

      {/* Hero Banner Header */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs relative overflow-hidden transition-colors ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-br from-white via-indigo-50/50 to-white border-slate-200/80'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {language === 'hi' ? 'हर मंथ का डेटा (Month-by-Month Expenses)' : 'Month-by-Month Expenses & Analytics'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {allMonthGroups.length} {language === 'hi' ? 'महीने उपलब्ध' : 'Months Recorded'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-2xl">
              {language === 'hi'
                ? 'यहाँ हर महीने का डेटा अलग-अलग देखें। जिस भी मंथ का डेटा देखना हो, उसे चुनकर कुल खर्च, मेम्बर-वाइज़ विवरण, कैटेगरी और ट्रांजैक्शन की पूरी लिस्ट देखें या PDF डाउनलोड करें।'
                : 'View expenses for each month separately. Select any month to inspect its total expenses, member spending breakdown, categories, and complete transactions list or download monthly PDF.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ {language === 'hi' ? 'खर्च जोड़ें' : 'Log Expense'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className={`flex items-center gap-1.5 font-bold px-3.5 py-2 rounded-2xl text-xs border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </button>
          </div>
        </div>

        {/* Lifetime Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-100 shadow-2xs'}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {language === 'hi' ? 'कुल लाइफटाइम खर्च' : 'Lifetime Expenses'}
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white block mt-0.5">
              {formatINR(totalLifetimeAmount)}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-100 shadow-2xs'}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {language === 'hi' ? 'कुल एंट्रीज' : 'Total Entries'}
            </span>
            <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 block mt-0.5">
              {expenses.length}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-100 shadow-2xs'}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {language === 'hi' ? 'सक्रिय महीना (Active)' : 'Active App Month'}
            </span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate">
              {selectedMonth}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-100 shadow-2xs'}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {language === 'hi' ? 'पारिवारिक सदस्य' : 'Family Members'}
            </span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400 block mt-0.5">
              {familyMembers.length}
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Switcher: Month-Wise Breakdown vs All Transactions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <button
            type="button"
            onClick={() => setViewMode('months')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'months'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{language === 'hi' ? '📅 महीनेवार कार्ड्स (Month-Wise)' : 'Month-Wise Cards'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('all-transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'all-transactions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'hi' ? '📋 All Transactions (सभी ट्रांजैक्शंस)' : 'All Transactions'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              viewMode === 'all-transactions' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {allFilteredTransactions.length}
            </span>
          </button>
        </div>

        {viewMode === 'all-transactions' && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>{language === 'hi' ? 'कुल राशि:' : 'Filtered Total:'}</span>
            <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
              {formatINR(allFilteredTransactions.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
            </span>
          </div>
        )}
      </div>

      {/* Month Selection Bar & Filter Controls */}
      <div className={`p-4 rounded-2xl border shadow-xs space-y-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Quick Month Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'hi' ? 'महीना चुनें:' : 'Select Month:'}</span>
            </span>

            {/* "All Months" Pill */}
            <button
              type="button"
              onClick={() => setActiveFilterMonth('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeFilterMonth === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {language === 'hi' ? 'सभी महीने (All Months)' : 'All Months'}
            </button>

            {/* Individual Month Pills */}
            {availableMonthKeys.slice(0, 6).map((mKey) => {
              const isSelected = activeFilterMonth === mKey;
              const isCurrent = mKey === currentCalMonth;
              const isAppActive = mKey === selectedMonth;
              
              let displayLabel = mKey;
              try {
                const [y, m] = mKey.split('-');
                const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
                displayLabel = d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: '2-digit' });
              } catch {}

              return (
                <button
                  key={`pill-${mKey}`}
                  type="button"
                  onClick={() => {
                    setActiveFilterMonth(mKey);
                    // Also expand this month
                    setExpandedMonths(prev => ({ ...prev, [mKey]: true }));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{displayLabel}</span>
                  {isAppActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Active on Dashboard"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Expand / Collapse All & Search */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {language === 'hi' ? 'सभी खोलें' : 'Expand All'}
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {language === 'hi' ? 'सभी बंद करें' : 'Collapse All'}
            </button>
          </div>
        </div>

        {/* Search bar & Custom Month Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Search inside monthly expenses */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'खर्च, मेम्बर, कैटेगरी या नोट्स खोजें...' : 'Search within monthly expenses (member, notes, category, amount)...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Jump to Any Custom Month Picker */}
          <div className="flex items-center gap-1.5">
            <input
              type="month"
              value={customMonthInput}
              onChange={(e) => {
                const val = e.target.value;
                setCustomMonthInput(val);
                if (val) {
                  setActiveFilterMonth(val);
                  setExpandedMonths(prev => ({ ...prev, [val]: true }));
                }
              }}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-black font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              title="Jump to any month from calendar picker"
            />

            {activeFilterMonth !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveFilterMonth('all')}
                className={`p-2 rounded-xl border text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                }`}
                title="Reset to All Months"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'all-transactions' ? (
        <div className="space-y-3">
          {/* Header of All Transactions */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'सभी ट्रांजैक्शंस की सूची' : 'All Transactions List'}
                {activeFilterMonth !== 'all' ? ` (${activeFilterMonth})` : ' (सभी महीने / All Months)'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {allFilteredTransactions.length} entries
              </span>
            </div>

            <div className="text-xs font-mono font-black text-slate-700 dark:text-slate-300">
              {language === 'hi' ? 'कुल राशि:' : 'Subtotal:'} {formatINR(allFilteredTransactions.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
            </div>
          </div>

          {/* List of items */}
          {allFilteredTransactions.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                {language === 'hi' ? 'कोई ट्रांजैक्शन नहीं मिला' : 'No Transactions Found'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {language === 'hi'
                  ? 'चुने गए फ़िल्टर या महीने के लिए कोई ट्रांजैक्शन रिकॉर्ड मौजूद नहीं है।'
                  : 'No transaction records match the active filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allFilteredTransactions.map((exp, idx) => {
                const monthKey = exp.date ? exp.date.slice(0, 7) : 'Unknown';
                return (
                  <div
                    key={`all-tx-${exp.id || idx}`}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                      isDark 
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MemberAvatar member={exp.paidBy} memberConfigs={memberConfigs} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white truncate">
                            {exp.notes || `${exp.category} Expense`}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                            {getCategoryLabel(exp.category, language)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                            📅 {monthKey}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{exp.paidBy}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDateDisplay(exp.date)}
                          </span>
                          {exp.time && (
                            <span className="flex items-center gap-1 font-mono text-slate-400 hidden sm:inline-flex">
                              <Clock className="w-3 h-3" />
                              {exp.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <span className="font-black font-mono text-sm text-slate-900 dark:text-white">
                        {formatINR(exp.amount)}
                      </span>

                      {/* Actions with Two-Step Confirm */}
                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                        {onEditExpense && (
                          <button
                            type="button"
                            onClick={() => onEditExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit this expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDeleteExpense && (
                          inlineConfirmId === exp.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 p-1 px-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-[11px] shadow-xs animate-in fade-in">
                              <span className="font-bold text-rose-700 dark:text-rose-300 whitespace-nowrap hidden sm:inline">
                                {language === 'hi' ? 'डिलीट कन्फर्म करें?' : 'Confirm?'}
                              </span>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!onDeleteExpense) return;
                                  setDeletingId(exp.id);
                                  try {
                                    await onDeleteExpense(exp.id);
                                    setInlineConfirmId(null);
                                    setExpenseToDelete(null);
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setDeletingId(null);
                                  }
                                }}
                                disabled={deletingId === exp.id}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Yes, delete this transaction"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>{deletingId === exp.id ? (language === 'hi' ? 'हटाया जा रहा...' : 'Deleting...') : (language === 'hi' ? 'हाँ, हटाएं' : 'Yes')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInlineConfirmId(null);
                                  setExpenseToDelete(null);
                                }}
                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg cursor-pointer"
                                title="Cancel deletion"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInlineConfirmId(exp.id);
                                setExpenseToDelete(exp);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title={language === 'hi' ? 'खर्च डिलीट करें (पुष्टि का विकल्प आएगा)' : 'Delete this expense (confirmation required)'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Month-Wise Data Cards List */
        <div className="space-y-4">
        {displayedMonthGroups.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
              {language === 'hi' ? 'कोई मंथली रिकॉर्ड नहीं मिला' : 'No Monthly Records Found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {language === 'hi'
                ? 'आपके द्वारा खोजे गए फ़िल्टर या महीने के लिए कोई खर्च दर्ज नहीं है।'
                : 'No expenses match the current filter or search criteria for this period.'}
            </p>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ {language === 'hi' ? 'इस महीने में खर्च जोड़ें' : 'Log Expense For This Month'}</span>
            </button>
          </div>
        ) : (
          displayedMonthGroups.map((monthGroup) => {
            const isExpanded = !!expandedMonths[monthGroup.monthKey];
            const isAppSelectedMonth = monthGroup.monthKey === selectedMonth;
            const isCalendarCurrent = monthGroup.monthKey === currentCalMonth;

            // Member breakdown for this month
            const memberMap: Record<string, number> = {};
            const categoryMap: Record<string, number> = {};

            monthGroup.expenses.forEach(exp => {
              const m = exp.paidBy || 'Other';
              memberMap[m] = (memberMap[m] || 0) + (Number(exp.amount) || 0);

              const cat = exp.category === 'Grocery' ? 'Groceries' : (exp.category || 'Others');
              categoryMap[cat] = (categoryMap[cat] || 0) + (Number(exp.amount) || 0);
            });

            const sortedMembers = Object.entries(memberMap).sort((a, b) => b[1] - a[1]);
            const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

            return (
              <div
                key={`month-card-${monthGroup.monthKey}`}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isAppSelectedMonth
                    ? isDark
                      ? 'bg-slate-900 border-indigo-500/80 shadow-indigo-950/30 ring-1 ring-indigo-500/30'
                      : 'bg-white border-indigo-400 shadow-indigo-100/50 ring-1 ring-indigo-300'
                    : isDark
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Month Card Header Banner (Click to toggle expansion) */}
                <div
                  onClick={() => toggleMonthExpansion(monthGroup.monthKey)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                    isDark ? 'hover:bg-slate-850' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                      isAppSelectedMonth
                        ? 'bg-indigo-600 text-white'
                        : isDark
                          ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {monthGroup.monthLabel}
                        </h3>

                        {isAppSelectedMonth && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{language === 'hi' ? 'डैशबोर्ड एक्टिव' : 'Active on Dashboard'}</span>
                          </span>
                        )}

                        {isCalendarCurrent && !isAppSelectedMonth && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {language === 'hi' ? 'वर्तमान महीना' : 'Current Calendar Month'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        <span className="font-mono">{monthGroup.monthKey}</span>
                        <span>•</span>
                        <span>{monthGroup.expenses.length} {language === 'hi' ? 'ट्रांजैक्शंस' : 'transactions'}</span>
                        <span>•</span>
                        <span>{sortedMembers.length} {language === 'hi' ? 'मेम्बर्स' : 'members'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Subtotal & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        {language === 'hi' ? 'इस मंथ का कुल खर्च' : 'Month Total'}
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {formatINR(monthGroup.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Set as Dashboard Active Month Button */}
                      {!isAppSelectedMonth && (
                        <button
                          type="button"
                          onClick={() => handleSelectMonthForApp(monthGroup.monthKey, true)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-black rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1"
                          title="View this month on Dashboard"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{language === 'hi' ? 'डैशबोर्ड पर देखें' : 'View on Dashboard'}</span>
                        </button>
                      )}

                      {/* Download PDF for this specific month */}
                      <button
                        type="button"
                        onClick={() => handleDownloadMonthPDF(monthGroup.monthKey, monthGroup.expenses)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 transition-all cursor-pointer flex items-center gap-1"
                        title={`Download ${monthGroup.monthLabel} PDF Report`}
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-xs font-black hidden md:inline">PDF</span>
                      </button>

                      {/* Expand / Collapse Chevron */}
                      <button
                        type="button"
                        onClick={() => toggleMonthExpansion(monthGroup.monthKey)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse Month' : 'Expand Month'}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Month Details Section */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800/80">
                    
                    {/* Member Spending Breakdown in this month */}
                    <div className="space-y-2 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{language === 'hi' ? 'मेम्बर-वाइज़ खर्च' : 'Spending by Family Member'}</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {sortedMembers.length} {language === 'hi' ? 'सदस्यों ने खर्च किया' : 'contributing members'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                        {sortedMembers.map(([member, amt]) => {
                          const percent = monthGroup.total > 0 ? Math.round((amt / monthGroup.total) * 100) : 0;
                          const theme = getMemberTheme(member, memberConfigs);

                          return (
                            <div
                              key={`mem-${monthGroup.monthKey}-${member}`}
                              className={`p-2.5 rounded-2xl border transition-all ${
                                isDark 
                                  ? 'bg-slate-800/60 border-slate-700/60' 
                                  : 'bg-slate-50 border-slate-200/70'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MemberAvatar member={member} memberConfigs={memberConfigs} size="xs" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black truncate text-slate-900 dark:text-white">
                                    {member}
                                  </p>
                                  <p className="text-[11px] font-black font-mono text-red-600 dark:text-red-400">
                                    {formatINR(amt)}
                                  </p>
                                </div>
                              </div>

                              {/* Member share mini progress bar */}
                              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                <span>{percent}% share</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-0.5">
                                <div
                                  className={`h-full rounded-full ${theme.bg}`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category Breakdown in this month */}
                    {sortedCategories.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{language === 'hi' ? 'कैटेगरी के अनुसार विवरण' : 'Top Categories in Month'}</span>
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {sortedCategories.map(([cat, amt]) => {
                            const catPercent = monthGroup.total > 0 ? Math.round((amt / monthGroup.total) * 100) : 0;
                            return (
                              <div
                                key={`cat-${monthGroup.monthKey}-${cat}`}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                                }`}
                              >
                                <span className="font-extrabold">{getCategoryLabel(cat, language)}:</span>
                                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{formatINR(amt)}</span>
                                <span className="text-[10px] text-slate-400">({catPercent}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Detailed Transactions List for this Month */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{language === 'hi' ? 'इस महीने के सभी ट्रांजैक्शंस' : 'All Transactions in Month'} ({monthGroup.expenses.length})</span>
                        </span>

                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                          Subtotal: {formatINR(monthGroup.total)}
                        </span>
                      </div>

                      {monthGroup.expenses.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl">
                          {language === 'hi' ? 'इस महीने में कोई खर्च दर्ज नहीं है।' : 'No expenses logged for this month.'}
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                          {monthGroup.expenses.map((exp, expIdx) => {
                            const memTheme = getMemberTheme(exp.paidBy, memberConfigs);
                            return (
                              <div
                                key={`tx-${exp.id || expIdx}`}
                                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                  isDark 
                                    ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-700' 
                                    : 'bg-slate-50/80 border-slate-200/70 hover:bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <MemberAvatar member={exp.paidBy} memberConfigs={memberConfigs} size="sm" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-black text-slate-900 dark:text-white truncate">
                                        {exp.notes || `${exp.category} Expense`}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                                        {getCategoryLabel(exp.category, language)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                      <span className="font-bold text-slate-700 dark:text-slate-300">{exp.paidBy}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 font-mono">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {formatDateDisplay(exp.date)}
                                      </span>
                                      {exp.time && (
                                        <span className="flex items-center gap-1 font-mono text-slate-400 hidden sm:inline-flex">
                                          <Clock className="w-3 h-3" />
                                          {exp.time}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-black font-mono text-sm text-slate-900 dark:text-white">
                                    {formatINR(exp.amount)}
                                  </span>

                                  {/* Quick Action buttons */}
                                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                                    {onEditExpense && (
                                      <button
                                        type="button"
                                        onClick={() => onEditExpense(exp)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                        title="Edit this expense"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {onDeleteExpense && (
                                      inlineConfirmId === exp.id ? (
                                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 p-1 px-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-[11px] shadow-xs animate-in fade-in">
                                          <span className="font-bold text-rose-700 dark:text-rose-300 whitespace-nowrap hidden sm:inline">
                                            {language === 'hi' ? 'डिलीट कन्फर्म करें?' : 'Confirm?'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (!onDeleteExpense) return;
                                              setDeletingId(exp.id);
                                              try {
                                                await onDeleteExpense(exp.id);
                                                setInlineConfirmId(null);
                                                setExpenseToDelete(null);
                                              } catch (err) {
                                                console.error(err);
                                              } finally {
                                                setDeletingId(null);
                                              }
                                            }}
                                            disabled={deletingId === exp.id}
                                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                                            title="Yes, delete this transaction"
                                          >
                                            <Check className="w-3 h-3 stroke-[3]" />
                                            <span>{deletingId === exp.id ? (language === 'hi' ? 'हटाया जा रहा...' : 'Deleting...') : (language === 'hi' ? 'हाँ, हटाएं' : 'Yes')}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setInlineConfirmId(null);
                                              setExpenseToDelete(null);
                                            }}
                                            className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg cursor-pointer"
                                            title="Cancel deletion"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setInlineConfirmId(exp.id);
                                            setExpenseToDelete(exp);
                                          }}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                          title={language === 'hi' ? 'खर्च डिलीट करें (पुष्टि का विकल्प आएगा)' : 'Delete this expense (confirmation required)'}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer for this Month */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {language === 'hi' ? 'इस महीने में' : 'Summary:'} <strong>{monthGroup.expenses.length}</strong> {language === 'hi' ? 'ट्रांजैक्शंस, कुल' : 'transactions, total'} <strong>{formatINR(monthGroup.total)}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectMonthForApp(monthGroup.monthKey, true)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'इस महीने को डैशबोर्ड पर खोलें' : 'Open in Dashboard'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadMonthPDF(monthGroup.monthKey, monthGroup.expenses)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'मंथली PDF' : 'Download PDF'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {language === 'hi' ? 'खर्च डिलीट करने की पुष्टि करें' : 'Confirm Expense Deletion'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'hi' ? 'क्या आप वाकई इस ट्रांजैक्शन को हटाना चाहते हैं?' : 'Are you sure you want to permanently delete this?'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Expense Record Details Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {getCategoryLabel(expenseToDelete.category, language)}
                  </span>
                  <span>({expenseToDelete.paidBy})</span>
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-black text-sm">
                  {formatINR(expenseToDelete.amount)}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-xs truncate font-medium">
                {expenseToDelete.notes || `${expenseToDelete.category} Expense`}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span>📅 {formatDateDisplay(expenseToDelete.date)}</span>
                {expenseToDelete.time && <span>⏰ {expenseToDelete.time}</span>}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {language === 'hi' 
                  ? 'यह ट्रांजैक्शन रिकॉर्ड डेटाबेस से हटा दिया जाएगा और यह क्रिया वापस नहीं ली जा सकेगी।' 
                  : 'This expense will be permanently deleted from the database.'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                disabled={deletingId === expenseToDelete.id}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={deletingId === expenseToDelete.id}
                onClick={async () => {
                  if (!onDeleteExpense || !expenseToDelete) return;
                  setDeletingId(expenseToDelete.id);
                  try {
                    await onDeleteExpense(expenseToDelete.id);
                    setExpenseToDelete(null);
                  } catch (err) {
                    console.error('Failed to delete expense:', err);
                  } finally {
                    setDeletingId(null);
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deletingId === expenseToDelete.id
                    ? (language === 'hi' ? 'हटाया जा रहा है...' : 'Deleting...')
                    : (language === 'hi' ? 'हाँ, डिलीट करें (Confirm)' : 'Yes, Delete')}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
