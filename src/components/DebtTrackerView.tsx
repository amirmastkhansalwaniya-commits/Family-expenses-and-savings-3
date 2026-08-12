import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  HandCoins, 
  Calendar, 
  User, 
  DollarSign, 
  AlertCircle, 
  Check, 
  Loader2,
  Clock,
  Building2,
  PieChart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { DebtRecord, FamilyMember, getMemberTheme } from '../types';
import { MemberAvatar } from './MemberAvatar';
import { formatINR } from '../utils/formatters';
import { Language, t } from '../utils/translations';

interface DebtTrackerViewProps {
  debts: DebtRecord[];
  familyMembers: string[];
  activeMember: FamilyMember;
  memberConfigs?: Record<string, any>;
  theme: 'light' | 'dark';
  language: Language;
  onSaveDebt: (debtData: Omit<DebtRecord, 'id'>, debtId?: string) => Promise<void>;
  onDeleteDebt: (debtId: string) => Promise<void>;
  onLogDebtPayment: (debtId: string, paymentAmount: number) => Promise<void>;
}

export const DebtTrackerView: React.FC<DebtTrackerViewProps> = ({
  debts = [],
  familyMembers,
  activeMember,
  memberConfigs,
  theme,
  language,
  onSaveDebt,
  onDeleteDebt,
  onLogDebtPayment,
}) => {
  const isDark = theme === 'dark';

  // Time & Date format helpers
  const format12HourTime = (time24?: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    if (hStr === undefined || mStr === undefined) return time24;
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return time24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${mStr} ${ampm}`;
  };

  const getCurrentDateStr = () => new Date().toISOString().slice(0, 10);
  const getCurrentTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Filters & Search state
  const [filterType, setFilterType] = useState<'all' | 'borrowed' | 'given' | 'settled'>('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'startDate' | 'amount' | 'remainingAmount'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'borrowed' | 'given'>('borrowed');
  const [personName, setPersonName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [paidBy, setPaidBy] = useState<FamilyMember>(activeMember);
  const [startDate, setStartDate] = useState(getCurrentDateStr());
  const [startTime, setStartTime] = useState(getCurrentTimeStr());
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bankImpact, setBankImpact] = useState<'increase' | 'decrease' | 'none'>('increase');
  const [isSaving, setIsSaving] = useState(false);

  // Repayment Modal state
  const [repaymentModalDebt, setRepaymentModalDebt] = useState<DebtRecord | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);

  // Delete Modal state
  const [deletingDebt, setDeletingDebt] = useState<DebtRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered and sorted debts list
  const filteredDebts = debts
    .filter((debt) => {
      // Type / Status filter
      if (filterType === 'borrowed' && (debt.type !== 'borrowed' || debt.status === 'settled')) return false;
      if (filterType === 'given' && (debt.type !== 'given' || debt.status === 'settled')) return false;
      if (filterType === 'settled' && debt.status !== 'settled') return false;

      // Member filter
      if (selectedMemberFilter !== 'all' && debt.paidBy !== selectedMemberFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = debt.title.toLowerCase().includes(q);
        const matchPerson = debt.personName.toLowerCase().includes(q);
        const matchNotes = (debt.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPerson && !matchNotes) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'dueDate') {
        const timeA = a.dueDate ? new Date(`${a.dueDate}T${a.dueTime || '23:59'}`).getTime() : 9999999999999;
        const timeB = b.dueDate ? new Date(`${b.dueDate}T${b.dueTime || '23:59'}`).getTime() : 9999999999999;
        comparison = timeA - timeB;
      } else if (sortBy === 'startDate') {
        const timeA = a.startDate ? new Date(`${a.startDate}T${a.time || '00:00'}`).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.startDate ? new Date(`${b.startDate}T${b.time || '00:00'}`).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        comparison = timeA - timeB;
      } else if (sortBy === 'amount') {
        comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
      } else if (sortBy === 'remainingAmount') {
        comparison = (a.remainingAmount || 0) - (b.remainingAmount || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // KPI Calculations
  const activeDebts = debts.filter((d) => d.status === 'active');
  const totalBorrowedPending = activeDebts
    .filter((d) => d.type === 'borrowed')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalLentPending = activeDebts
    .filter((d) => d.type === 'given')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const netDebt = totalBorrowedPending - totalLentPending;

  // Open modal for new or editing debt
  const handleOpenModal = (debtToEdit?: DebtRecord) => {
    if (debtToEdit) {
      setEditingDebt(debtToEdit);
      setTitle(debtToEdit.title);
      setType(debtToEdit.type);
      setPersonName(debtToEdit.personName);
      setTotalAmount(debtToEdit.totalAmount.toString());
      setRemainingAmount(debtToEdit.remainingAmount.toString());
      setPaidBy(debtToEdit.paidBy);
      setStartDate(debtToEdit.startDate || getCurrentDateStr());
      setStartTime(debtToEdit.time || getCurrentTimeStr());
      setDueDate(debtToEdit.dueDate || '');
      setDueTime(debtToEdit.dueTime || '');
      setNotes(debtToEdit.notes || '');
      setBankImpact(debtToEdit.type === 'given' ? 'decrease' : 'increase');
    } else {
      setEditingDebt(null);
      setTitle('');
      setType('borrowed');
      setPersonName('');
      setTotalAmount('');
      setRemainingAmount('');
      setPaidBy(activeMember || familyMembers[0] || 'Amir Khan');
      setStartDate(getCurrentDateStr());
      setStartTime(getCurrentTimeStr());
      setDueDate('');
      setDueTime('');
      setNotes('');
      setBankImpact('increase');
    }
    setIsAddModalOpen(true);
  };

  // Submit Add/Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !personName.trim()) return;

    const totAmt = parseFloat(totalAmount) || 0;
    const remAmt = remainingAmount !== '' ? parseFloat(remainingAmount) : totAmt;

    setIsSaving(true);
    try {
      await onSaveDebt(
        {
          title: title.trim(),
          type,
          personName: personName.trim(),
          totalAmount: totAmt,
          remainingAmount: Math.max(0, remAmt),
          paidBy,
          startDate: startDate || undefined,
          time: startTime || undefined,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          notes: notes.trim(),
          status: remAmt <= 0 ? 'settled' : 'active',
          addedByMember: activeMember,
          bankImpact,
        } as any,
        editingDebt?.id
      );

      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error saving debt record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingDebt) return;
    setIsDeleting(true);
    try {
      await onDeleteDebt(deletingDebt.id);
      setDeletingDebt(null);
    } catch (err) {
      console.error('Error deleting debt record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Quick Settlement Toggle
  const handleToggleSettled = async (debt: DebtRecord) => {
    const isSettling = debt.status !== 'settled';
    try {
      await onSaveDebt(
        {
          ...debt,
          status: isSettling ? 'settled' : 'active',
          remainingAmount: isSettling ? 0 : debt.totalAmount,
        },
        debt.id
      );
    } catch (err) {
      console.error('Error updating debt status:', err);
    }
  };

  // Submit Repayment
  const handleOpenRepaymentModal = (debt: DebtRecord) => {
    setRepaymentModalDebt(debt);
    setRepaymentAmount('');
  };

  const handleConfirmRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repaymentModalDebt) return;

    const amt = parseFloat(repaymentAmount);
    if (!amt || amt <= 0) return;

    setIsLoggingPayment(true);
    try {
      await onLogDebtPayment(repaymentModalDebt.id, amt);
      setRepaymentModalDebt(null);
      setRepaymentAmount('');
    } catch (err) {
      console.error('Error logging repayment:', err);
    } finally {
      setIsLoggingPayment(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-rose-500/20">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('tabDebts', language)}
              </h2>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Track borrowed loans, personal dues, hand loans & money lent to others
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('addDebtRecord', language)}</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Total Borrowed (You Owe) */}
        <div className={`p-5 rounded-3xl border relative overflow-hidden transition-all shadow-2xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
              Borrowed (Money You Owe)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
            {formatINR(totalBorrowedPending)}
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Liabilities to pay back to lenders/banks
          </p>
        </div>

        {/* Card 2: Total Lent (Owed to You) */}
        <div className={`p-5 rounded-3xl border relative overflow-hidden transition-all shadow-2xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
              Lent (Money Receivable)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatINR(totalLentPending)}
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Money to collect from friends/relatives
          </p>
        </div>

        {/* Card 3: Net Debt Position */}
        <div className={`p-5 rounded-3xl border relative overflow-hidden transition-all shadow-2xs sm:col-span-2 lg:col-span-1 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
              Net Household Debt Position
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${
            netDebt > 0
              ? 'text-rose-600 dark:text-rose-400'
              : netDebt < 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-700 dark:text-slate-300'
          }`}>
            {formatINR(Math.abs(netDebt))}
            <span className="text-xs font-bold text-slate-400 ml-1.5">
              {netDebt > 0 ? '(Net Owed)' : netDebt < 0 ? '(Net Receivable)' : '(Balanced)'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            {activeDebts.length} active debt entries recorded
          </p>
        </div>

      </div>

      {/* Filters Bar & Search */}
      <div className={`p-4 rounded-3xl border space-y-3 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-100 shadow-2xs'
      }`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full lg:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({debts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('borrowed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'borrowed'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Borrowed (I Owe)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('given')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'given'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Lent (Owed to Me)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('settled')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'settled'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Settled / Paid
            </button>
          </div>

          {/* Search, Member & Sort Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2.5 w-full lg:w-auto">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search debt title or person..."
                className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Member Dropdown Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedMemberFilter}
                onChange={(e) => setSelectedMemberFilter(e.target.value)}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-extrabold border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="all">All Family Members</option>
                {familyMembers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="flex items-center gap-1 text-xs font-extrabold text-slate-500 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sort:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'startDate' | 'amount' | 'remainingAmount')}
                className={`flex-1 sm:w-auto px-3.5 py-2 rounded-xl text-xs font-extrabold border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="dueDate">Due Date</option>
                <option value="startDate">Taken / Lent Date</option>
                <option value="amount">Total Amount</option>
                <option value="remainingAmount">Remaining Amount</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending Order (Click to reverse)' : 'Descending Order (Click to reverse)'}
                className={`px-2.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                {sortOrder === 'asc' ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-black uppercase text-indigo-500">
                    <ArrowUp className="w-3.5 h-3.5" /> ASC
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[10px] font-black uppercase text-indigo-500">
                    <ArrowDown className="w-3.5 h-3.5" /> DESC
                  </span>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Itemized Debt Cards List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className={`text-center py-12 rounded-3xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-2xs'
          } space-y-3`}>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center font-black">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-sm font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                No debt records found
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || filterType !== 'all' || selectedMemberFilter !== 'all'
                  ? 'Try clearing your filters or search terms.'
                  : 'Click "Add Debt Entry" to start recording hand loans, borrowed money or receivables.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl cursor-pointer hover:bg-indigo-700 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Debt Entry</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDebts.map((debt) => {
              const isSettled = debt.status === 'settled' || debt.remainingAmount <= 0;
              const isBorrowed = debt.type === 'borrowed';
              const memberTheme = getMemberTheme(debt.paidBy, memberConfigs);
              const progressPercent = debt.totalAmount > 0
                ? Math.min(100, Math.round(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100))
                : 100;

              return (
                <div
                  key={debt.id}
                  className={`p-5 rounded-3xl border transition-all duration-200 relative flex flex-col justify-between ${
                    isSettled
                      ? isDark
                        ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                        : 'bg-slate-50 border-slate-200/80 opacity-80'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-100 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-3">
                    
                    {/* Header line: Title & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {debt.title}
                          </h3>
                          
                          {/* Type Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isBorrowed
                              ? 'bg-rose-100/80 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-emerald-100/80 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          }`}>
                            {isBorrowed ? 'I Owe' : 'Owed to Me'}
                          </span>

                          {/* Settled Badge */}
                          {isSettled && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              Settled
                            </span>
                          )}
                        </div>

                        {/* Person Name */}
                        <p className={`text-xs font-extrabold mt-1 flex items-center gap-1.5 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{isBorrowed ? 'Lender:' : 'Borrower:'} <strong>{debt.personName}</strong></span>
                        </p>
                      </div>

                      {/* Remaining Amount */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Remaining
                        </span>
                        <span className={`text-lg font-black font-mono tracking-tight ${
                          isSettled
                            ? 'text-slate-400 line-through'
                            : isBorrowed
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {formatINR(debt.remainingAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Total vs Remaining Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Total: {formatINR(debt.totalAmount)}</span>
                        <span>{progressPercent}% Repaid</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isSettled
                              ? 'bg-slate-400'
                              : isBorrowed
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta Details: Dates, Times & Responsible Member */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      
                      {/* Responsible Member Tag */}
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${memberTheme.badgeBg} ${memberTheme.badgeText}`}>
                          {memberTheme.emoji} {debt.paidBy}
                        </span>
                      </div>

                      {/* Date & Time Badges */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {(debt.startDate || debt.time) && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            <span>
                              {debt.startDate || ''}
                              {debt.time ? ` @ ${format12HourTime(debt.time)}` : ''}
                            </span>
                          </div>
                        )}

                        {(debt.dueDate || debt.dueTime) && (
                          <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>
                              Due: {debt.dueDate || ''}
                              {debt.dueTime ? ` @ ${format12HourTime(debt.dueTime)}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes if present */}
                    {debt.notes && (
                      <p className={`text-xs italic p-2 rounded-xl ${
                        isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-50 text-slate-500'
                      }`}>
                        "{debt.notes}"
                      </p>
                    )}

                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    
                    {/* Log Repayment Button */}
                    {!isSettled ? (
                      <button
                        type="button"
                        onClick={() => handleOpenRepaymentModal(debt)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs active:scale-95 cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <HandCoins className="w-3.5 h-3.5" />
                        <span>Log Repayment</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleSettled(debt)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-300 cursor-pointer transition-all"
                      >
                        Reopen Debt
                      </button>
                    )}

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-1">
                      
                      {/* Toggle Settle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSettled(debt)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSettled
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isSettled ? 'Mark Active' : 'Mark Fully Settled'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenModal(debt)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        title="Edit Debt Entry"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setDeletingDebt(debt)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        title="Delete Debt Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT DEBT ENTRY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black">
                  <HandCoins className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base">
                  {editingDebt ? 'Edit Debt Entry' : 'Add New Debt Entry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Debt Category Type *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setType('borrowed');
                      setBankImpact('increase');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'borrowed'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Borrowed (I Owe)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('given');
                      setBankImpact('decrease');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'given'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Lent (Owed to Me)</span>
                  </button>
                </div>
              </div>

              {/* Debt Title */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Title / Reason *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hand loan for shop repair, Personal loan from uncle"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  {type === 'borrowed' ? 'Lender / Person Name *' : 'Borrower / Person Name *'}
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma, HDFC Bank, Cousin"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              {/* Total Amount & Remaining Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Total Amount ₹ *
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => {
                      setTotalAmount(e.target.value);
                      if (!editingDebt) setRemainingAmount(e.target.value);
                    }}
                    placeholder="e.g. 50000"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    min="0"
                    step="any"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Remaining Pending ₹
                  </label>
                  <input
                    type="number"
                    value={remainingAmount}
                    onChange={(e) => setRemainingAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    min="0"
                    step="any"
                  />
                </div>
              </div>

              {/* Responsible Member */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Responsible Member
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {familyMembers.map((m) => {
                    const isSelected = paidBy === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaidBy(m as FamilyMember)}
                        className={`flex items-center gap-2 p-2 rounded-2xl border text-left text-xs font-black transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-slate-800 border-2 border-emerald-600 text-slate-900 dark:text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <MemberAvatar member={m} memberConfigs={memberConfigs} size="xs" isActive={isSelected} />
                        <span className="truncate">{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Borrowed / Lent Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    {type === 'borrowed' ? 'Borrowed Date *' : 'Lent Date *'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Target Due Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Due Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Notes / Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details, bank UPI info or agreement notes"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Bank Account Impact */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Bank Account Impact
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setBankImpact('increase')}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      bankImpact === 'increase'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    + Increase Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankImpact('decrease')}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      bankImpact === 'decrease'
                        ? 'bg-rose-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    - Decrease Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankImpact('none')}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      bankImpact === 'none'
                        ? 'bg-slate-700 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    No Change
                  </button>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingDebt ? 'Update Entry' : 'Save Debt Entry'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: LOG REPAYMENT MODAL */}
      {repaymentModalDebt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-3xl max-w-sm w-full p-6 shadow-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-base">Log Repayment</h3>
              </div>
              <button
                type="button"
                onClick={() => setRepaymentModalDebt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs">
              <p className="font-black text-slate-900 dark:text-white">{repaymentModalDebt.title}</p>
              <p className="text-slate-500">
                Person: <strong>{repaymentModalDebt.personName}</strong>
              </p>
              <p className="text-slate-500 font-mono">
                Current Pending: <strong className="text-rose-600 dark:text-rose-400">{formatINR(repaymentModalDebt.remainingAmount)}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmRepayment} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Repayment Amount ₹ *
                </label>
                <input
                  type="number"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder={`e.g. ${Math.min(5000, repaymentModalDebt.remainingAmount)}`}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  min="1"
                  step="any"
                  max={repaymentModalDebt.remainingAmount}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRepaymentModalDebt(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingPayment}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                >
                  {isLoggingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      {deletingDebt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-3xl max-w-sm w-full p-6 shadow-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base">Delete Debt Record?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="font-bold text-slate-900 dark:text-white">"{deletingDebt.title}"</strong> ({deletingDebt.personName})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingDebt(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
