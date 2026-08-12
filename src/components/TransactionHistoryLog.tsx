import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, FamilyMember, FAMILY_MEMBERS, CATEGORIES, MEMBER_THEMES, MemberCustomConfig, getMemberTheme } from '../types';
import { formatINR, formatDateDisplay } from '../utils/formatters';
import { MemberAvatar } from './MemberAvatar';
import { 
  exportBackupJSON, 
  exportBackupPDF, 
  parseBackupJSON, 
  parseExpensesCSV, 
  parseBackupPDF, 
  parseExpensesPDF 
} from '../utils/exportImport';
import { 
  Search, 
  Trash2, 
  Edit, 
  Calendar, 
  Clock,
  Printer, 
  FileSpreadsheet,
  FileText,
  AlertCircle,
  X,
  Filter,
  RotateCcw,
  Check,
  ChevronDown,
  ShoppingCart,
  Zap,
  HeartPulse,
  Fuel,
  Home,
  Utensils,
  GraduationCap,
  ShoppingBag,
  Film,
  Package,
  Tag,
  CreditCard,
  Upload,
  Download,
  Database,
  Users,
  User
} from 'lucide-react';

const CATEGORY_UI_CONFIG: Record<string, {
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  border: string;
}> = {
  'Groceries': { Icon: ShoppingCart, bg: 'bg-emerald-100 dark:bg-emerald-950/80', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  'Grocery': { Icon: ShoppingCart, bg: 'bg-emerald-100 dark:bg-emerald-950/80', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  'EMI': { Icon: CreditCard, bg: 'bg-indigo-100 dark:bg-indigo-950/80', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  'Utilities': { Icon: Zap, bg: 'bg-amber-100 dark:bg-amber-950/80', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'Medical': { Icon: HeartPulse, bg: 'bg-rose-100 dark:bg-rose-950/80', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  'Fuel': { Icon: Fuel, bg: 'bg-blue-100 dark:bg-blue-950/80', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'Rent': { Icon: Home, bg: 'bg-indigo-100 dark:bg-indigo-950/80', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  'Dining': { Icon: Utensils, bg: 'bg-orange-100 dark:bg-orange-950/80', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  'Education': { Icon: GraduationCap, bg: 'bg-purple-100 dark:bg-purple-950/80', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'Shopping': { Icon: ShoppingBag, bg: 'bg-pink-100 dark:bg-pink-950/80', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
  'Entertainment': { Icon: Film, bg: 'bg-cyan-100 dark:bg-cyan-950/80', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  'Household': { Icon: Package, bg: 'bg-teal-100 dark:bg-teal-950/80', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  'Others': { Icon: Tag, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
};

import { Language, t, getCategoryLabel } from '../utils/translations';

interface TransactionHistoryLogProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  selectedMonth: string;
  language?: Language;
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
  onRestoreExpenses?: (restoredExpenses: Expense[]) => Promise<void> | void;
  onOpenExportImport?: () => void;
  activeMember?: string;
}

export const TransactionHistoryLog: React.FC<TransactionHistoryLogProps> = ({
  expenses,
  onEditExpense,
  onDeleteExpense,
  selectedMonth,
  language = 'en',
  familyMembers = FAMILY_MEMBERS,
  memberConfigs,
  onRestoreExpenses,
  onOpenExportImport,
  activeMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMemberTab, setActiveMemberTab] = useState<string>('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  // Backup Expenses JSON
  const handleBackupJsonLog = () => {
    const listToExport = filtered.length > 0 ? filtered : expenses;
    exportBackupJSON({ expenses: listToExport });
    setExportNotice(`Backup JSON file downloaded successfully! (${listToExport.length} entries)`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Backup Expenses PDF
  const handleBackupPdfLog = () => {
    const listToExport = filtered.length > 0 ? filtered : expenses;
    exportBackupPDF({ expenses: listToExport });
    setExportNotice(`Backup PDF document downloaded successfully! (${listToExport.length} entries)`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Restore Expenses from JSON / CSV / PDF File
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let restoredList: Expense[] = [];

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const backupRes = await parseBackupPDF(buffer);
        if (backupRes.success && backupRes.data?.expenses && backupRes.data.expenses.length > 0) {
          restoredList = backupRes.data.expenses;
        } else {
          const expRes = await parseExpensesPDF(buffer);
          if (expRes.validExpenses && expRes.validExpenses.length > 0) {
            restoredList = expRes.validExpenses as Expense[];
          }
        }
      } else if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const res = parseBackupJSON(text);
        if (res && res.success && res.data && Array.isArray(res.data.expenses) && res.data.expenses.length > 0) {
          restoredList = res.data.expenses;
        }
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const res = parseExpensesCSV(text);
        if (res && Array.isArray(res.validExpenses) && res.validExpenses.length > 0) {
          restoredList = res.validExpenses as Expense[];
        }
      }

      if (restoredList.length > 0) {
        if (onRestoreExpenses) {
          await onRestoreExpenses(restoredList);
        }
        setExportNotice(`Successfully restored ${restoredList.length} expenses into Expense Log!`);
        setTimeout(() => setExportNotice(null), 5000);
      } else {
        alert('No valid expense records were found in the selected file.');
      }
    } catch (err) {
      console.error('Error reading backup file:', err);
      alert('Failed to read or parse backup file. Please ensure it is a valid JSON, CSV, or PDF backup.');
    }

    if (e.target) e.target.value = '';
  };

  // Toggle Member selection
  const toggleMember = (member: string) => {
    setSelectedMembers(prev => 
      prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
    );
  };

  // Toggle Category selection
  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  // Reset all custom filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveMemberTab('all');
    setSelectedMembers([]);
    setSelectedCategories([]);
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = 
    searchTerm.trim() !== '' || 
    activeMemberTab !== 'all' ||
    selectedMembers.length > 0 || 
    selectedCategories.length > 0 || 
    startDate !== '' || 
    endDate !== '';

  // Filter expenses
  const filtered = expenses.filter((exp) => {
    // Dedicated Member Tab filter
    if (activeMemberTab !== 'all' && exp.paidBy !== activeMemberTab) {
      return false;
    }

    // Date Range Filter takes precedence over selectedMonth if specified
    if (startDate && exp.date && exp.date < startDate) {
      return false;
    }
    if (endDate && exp.date && exp.date > endDate) {
      return false;
    }
    
    // If no custom date range set, use selectedMonth filter
    if (!startDate && !endDate && selectedMonth && exp.date && !exp.date.startsWith(selectedMonth)) {
      return false;
    }

    // Multi-select Member filter
    if (selectedMembers.length > 0 && !selectedMembers.includes(exp.paidBy)) {
      return false;
    }

    // Multi-select Category filter
    if (selectedCategories.length > 0) {
      const expCatNorm = exp.category === 'Grocery' ? 'Groceries' : exp.category;
      const isMatch = selectedCategories.some(c => (c === 'Grocery' ? 'Groceries' : c) === expCatNorm);
      if (!isMatch) return false;
    }

    // Search term filter (notes, category, paidBy, amount, date)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      const matchMember = exp.paidBy.toLowerCase().includes(term);
      const catLabelTranslated = getCategoryLabel(exp.category, language).toLowerCase();
      const matchCat = exp.category.toLowerCase().includes(term) || catLabelTranslated.includes(term);
      const matchNotes = (exp.notes || '').toLowerCase().includes(term);
      const matchAmount = exp.amount.toString().includes(term);
      const matchDate = exp.date.includes(term);
      return matchMember || matchCat || matchNotes || matchAmount || matchDate;
    }

    return true;
  });

  const totalFilteredAmount = filtered.reduce((a, b) => a + (Number(b.amount) || 0), 0);

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('No expense records available to export for the current search or filters.');
      return;
    }

    const headers = ['Expense ID', 'Date', 'Paid By', 'Category', 'Amount (INR ₹)', 'Notes / Description'];
    const rows = filtered.map((e) => [
      `"${e.id || ''}"`,
      `"${e.date || ''}"`,
      `"${String(e.paidBy || '').replace(/"/g, '""')}"`,
      `"${String(e.category || '').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${String(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Family_Expenses_and_Savings_${selectedMonth || 'All'}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Downloaded CSV backup with ${filtered.length} expense ${filtered.length === 1 ? 'record' : 'records'}!`);
    setTimeout(() => {
      setExportNotice(null);
    }, 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      
      {/* Member-Specific Expense Log Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Member-Specific Expense Logs</span>
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {activeMemberTab === 'all' 
                ? 'Showing consolidated expense logs for all family members combined.' 
                : `Showing separate expense log exclusively for ${activeMemberTab}.`}
            </p>
          </div>
          {activeMemberTab !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveMemberTab('all')}
              className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Show All Members Log</span>
            </button>
          )}
        </div>

        {/* Member Tab Buttons Grid / Scroll */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
          {/* All Members Combined Tab */}
          <button
            type="button"
            onClick={() => setActiveMemberTab('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeMemberTab === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-400/50 dark:bg-indigo-600 dark:border-indigo-600'
                : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>All Members Combined</span>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black ${
              activeMemberTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {expenses.length} logs
            </span>
          </button>

          {/* Separate Individual Member Expense Log Tabs */}
          {familyMembers.map((m) => {
            const memberTheme = MEMBER_THEMES[m as FamilyMember];
            const isSelected = activeMemberTab === m;
            
            // Calculate total expenses and count specifically for this member
            const memberExps = expenses.filter(e => e.paidBy === m && (!selectedMonth || (e.date && e.date.startsWith(selectedMonth))));
            const memberTotalSpent = memberExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMemberTab(m)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? `${memberTheme?.badgeBg || 'bg-indigo-600'} ${memberTheme?.badgeText || 'text-white'} border-indigo-700 shadow-md ring-2 ring-indigo-400/60`
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <MemberAvatar member={m} memberConfigs={memberConfigs} size="xs" />
                <span className="font-black">{m}'s Log</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {memberExps.length} logs • {formatINR(memberTotalSpent)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Search & Filter Header Control Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        
        {/* Main Search Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Input Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchPlaceholder', language)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedCategories.includes('Groceries') || selectedCategories.includes('Grocery')) {
                  setSelectedCategories([]);
                } else {
                  setSelectedCategories(['Groceries', 'Grocery']);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                selectedCategories.includes('Groceries') || selectedCategories.includes('Grocery')
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>🛒 Groceries & Ration Only</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                isFilterPanelOpen || selectedMembers.length > 0 || selectedCategories.length > 0 || startDate || endDate
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>Filters</span>
              {(selectedMembers.length > 0 || selectedCategories.length > 0 || startDate || endDate) && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {selectedMembers.length + selectedCategories.length + (startDate ? 1 : 0) + (endDate ? 1 : 0)}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} />
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-extrabold border border-rose-200 transition-colors cursor-pointer"
                title="Reset all search and filter choices"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('resetFilters', language)}</span>
              </button>
            )}

            <button
              onClick={handleBackupJsonLog}
              title="Backup current expense log entries to JSON file"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-2xl text-xs font-extrabold border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Backup JSON</span>
            </button>

            <button
              onClick={handleBackupPdfLog}
              title="Backup current expense log entries to PDF document"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 rounded-2xl text-xs font-extrabold border border-purple-200 dark:border-purple-800 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Backup PDF</span>
            </button>

            <button
              onClick={() => restoreFileInputRef.current?.click()}
              title="Restore expense log entries from JSON, CSV, or PDF backup file"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 rounded-2xl text-xs font-extrabold border border-amber-200 dark:border-amber-800 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Restore Log</span>
            </button>

            <input
              type="file"
              ref={restoreFileInputRef}
              accept=".json,.csv,.pdf"
              onChange={handleRestoreFile}
              className="hidden"
            />

            <button
              onClick={handleExportCSV}
              title="Download filtered expense records as CSV spreadsheet for Excel / offline backup"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>{t('exportCsv', language)}</span>
            </button>

            <button
              onClick={handlePrint}
              title="Print transaction log"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold border border-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Export Success Notification Toast Banner */}
        {exportNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 flex items-center justify-between text-xs font-bold animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Collapsible Multi-Select Filter Panel */}
        {isFilterPanelOpen && (
          <div className="pt-3 border-t border-slate-100 space-y-4">
            
            {/* Date Range Picker */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Date Range Filter
                </span>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear dates
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Select Family Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Filter by Paid By (Multi-Select)
                </span>
                {selectedMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedMembers([])}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Filter ({selectedMembers.length})
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {familyMembers.map((m) => {
                  const isSelected = selectedMembers.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMember(m)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <MemberAvatar member={m} memberConfigs={memberConfigs} size="xs" />
                      <span>{m}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Multi-Select Categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Filter by Category (Multi-Select)
                </span>
                {selectedCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  const catConfig = CATEGORY_UI_CONFIG[cat.id] || CATEGORY_UI_CONFIG['Others'];
                  const CatIcon = catConfig.Icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : catConfig.text}`} />
                      <span>{getCategoryLabel(cat.id, language)}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Filter Summary Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 font-mono font-bold">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Showing {filtered.length} of {expenses.length} transaction entries</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 rounded-lg text-[10px] font-extrabold">
                Filters Active
              </span>
            )}
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 font-black">Subtotal: {formatINR(totalFilteredAmount)}</span>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((exp, index) => {
            const memberTheme = MEMBER_THEMES[exp.paidBy as FamilyMember];
            const catConfig = CATEGORY_UI_CONFIG[exp.category] || CATEGORY_UI_CONFIG['Others'];
            const CatIcon = catConfig.Icon;

            return (
              <motion.div
                key={`txn-log-${exp.id || 'no-id'}-${index}`}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{
                  duration: 0.22,
                  delay: Math.min(index * 0.03, 0.3),
                  ease: [0.25, 0.1, 0.25, 1.0],
                }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5">
                  {/* Visual Category Icon Badge with Member Avatar Overlay */}
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-2xs transition-transform group-hover:scale-105 ${catConfig.bg} ${catConfig.border} ${catConfig.text}`}>
                      <CatIcon className="w-5.5 h-5.5 stroke-[2.2]" />
                    </div>
                    {memberTheme && (
                      <div 
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-2xs ${memberTheme.avatarBg}`}
                        title={`Paid by ${exp.paidBy}`}
                      >
                        {memberTheme.initials}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <CatIcon className={`w-4 h-4 ${catConfig.text} hidden sm:inline-block`} />
                        <span>{getCategoryLabel(exp.category, language)}</span>
                      </span>
                      {memberTheme && (
                        <span className={`px-2.5 py-0.5 text-xs font-black rounded-full border flex items-center gap-1 ${memberTheme.badgeBg} ${memberTheme.badgeText}`}>
                          <span>{memberTheme.emoji}</span>
                          <span>Paid by {exp.paidBy}</span>
                        </span>
                      )}
                      {exp.notes && exp.notes.startsWith('[') && exp.notes.includes(']') && (
                        <span className="px-2 py-0.5 text-[11px] font-black rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <span>🛒</span>
                          <span>{exp.notes.slice(1, exp.notes.indexOf(']'))}</span>
                        </span>
                      )}
                    </div>

                    {exp.notes && (
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                        {exp.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-400 mt-1 font-mono font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateDisplay(exp.date)}
                      </span>
                      {exp.time && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {exp.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 font-mono block">
                      {formatINR(exp.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditExpense(exp)}
                      title="Edit expense"
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpenseToDelete(exp)}
                      disabled={deletingId === exp.id}
                      title="Delete expense"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-slate-100 rounded-2xl p-12 text-center space-y-3 shadow-xs"
          >
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-black text-slate-900">No Expenses Found</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
              No matching expense records found for the applied search criteria. Try clearing search filters or logging a new expense.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-extrabold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Custom Accessible Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Delete Expense Record?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span>{getCategoryLabel(expenseToDelete.category, language)} ({expenseToDelete.paidBy})</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-black">{formatINR(expenseToDelete.amount)}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                {expenseToDelete.notes || `Date: ${formatDateDisplay(expenseToDelete.date)}`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                disabled={deletingId === expenseToDelete.id}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
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
                disabled={deletingId === expenseToDelete.id}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {deletingId === expenseToDelete.id ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

