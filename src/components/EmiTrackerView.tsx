import React, { useState } from 'react';
import { EmiPlan, FamilyMember, FAMILY_MEMBERS, CATEGORIES, CategoryId, MEMBER_THEMES, MemberCustomConfig, getMemberTheme } from '../types';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { 
  CreditCard, 
  Plus, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Trash2, 
  Edit3, 
  X, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ShieldAlert,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Language, t, getCategoryLabel } from '../utils/translations';
import { MemberAvatar } from './MemberAvatar';

interface EmiTrackerViewProps {
  emis: EmiPlan[];
  onSaveEmi: (emiData: Omit<EmiPlan, 'id'>, id?: string) => Promise<void>;
  onDeleteEmi: (emiId: string) => Promise<void>;
  onRecordPayment: (emi: EmiPlan, monthKey: string) => Promise<void>;
  selectedMonth: string;
  activeMember: FamilyMember;
  language?: Language;
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
}

export const EmiTrackerView: React.FC<EmiTrackerViewProps> = ({
  emis,
  onSaveEmi,
  onDeleteEmi,
  onRecordPayment,
  selectedMonth,
  activeMember,
  language = 'en',
  familyMembers = FAMILY_MEMBERS,
  memberConfigs,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmi, setEditingEmi] = useState<EmiPlan | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [deletingEmi, setDeletingEmi] = useState<EmiPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // EMI Calculator state
  const [calcAmount, setCalcAmount] = useState<string>('100000');
  const [calcRate, setCalcRate] = useState<string>('10'); // 10% annual
  const [calcTenure, setCalcTenure] = useState<string>('12'); // 12 months
  const [showCalc, setShowCalc] = useState<boolean>(false);

  // Form Modal State
  const [formTitle, setFormTitle] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formEmiAmount, setFormEmiAmount] = useState('');
  const [formTenureMonths, setFormTenureMonths] = useState('12');
  const [formPaidMonths, setFormPaidMonths] = useState('0');
  const [formStartMonth, setFormStartMonth] = useState(selectedMonth);
  const [formPaidBy, setFormPaidBy] = useState<FamilyMember>(activeMember);
  const [formCategory, setFormCategory] = useState<CategoryId>('EMI');
  const [formInterestRate, setFormInterestRate] = useState('0');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open modal for new EMI
  const handleOpenAddModal = (presetTitle?: string, presetAmount?: number, presetEmi?: number, presetTenure?: number) => {
    setEditingEmi(null);
    setFormTitle(presetTitle || '');
    setFormTotalAmount(presetAmount ? presetAmount.toString() : '');
    setFormEmiAmount(presetEmi ? presetEmi.toString() : '');
    setFormTenureMonths(presetTenure ? presetTenure.toString() : '12');
    setFormPaidMonths('0');
    setFormStartMonth(selectedMonth);
    setFormPaidBy(activeMember);
    setFormCategory('EMI');
    setFormInterestRate('0');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing EMI
  const handleOpenEditModal = (emi: EmiPlan) => {
    setEditingEmi(emi);
    setFormTitle(emi.title);
    setFormTotalAmount(emi.totalAmount.toString());
    setFormEmiAmount(emi.emiAmount.toString());
    setFormTenureMonths(emi.tenureMonths.toString());
    setFormPaidMonths(emi.paidMonths.toString());
    setFormStartMonth(emi.startMonth);
    setFormPaidBy(emi.paidBy);
    setFormCategory(emi.category);
    setFormInterestRate((emi.interestRate || 0).toString());
    setFormNotes(emi.notes || '');
    setIsModalOpen(true);
  };

  // Calculate EMI in form
  const handleAutoCalculateFormEmi = () => {
    const P = parseFloat(formTotalAmount);
    const N = parseInt(formTenureMonths, 10);
    const annualRate = parseFloat(formInterestRate) || 0;

    if (P > 0 && N > 0) {
      if (annualRate === 0) {
        setFormEmiAmount((P / N).toFixed(0));
      } else {
        const r = annualRate / (12 * 100);
        const emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
        setFormEmiAmount(Math.round(emi).toString());
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const totalAmt = parseFloat(formTotalAmount) || 0;
    const emiAmt = parseFloat(formEmiAmount) || 0;
    const tenure = parseInt(formTenureMonths, 10) || 1;
    const paid = parseInt(formPaidMonths, 10) || 0;

    setIsSubmitting(true);
    try {
      await onSaveEmi({
        title: formTitle.trim(),
        totalAmount: totalAmt,
        emiAmount: emiAmt,
        tenureMonths: tenure,
        paidMonths: paid,
        startMonth: formStartMonth,
        paidBy: formPaidBy,
        category: formCategory,
        interestRate: parseFloat(formInterestRate) || 0,
        notes: formNotes.trim(),
        status: paid >= tenure ? 'completed' : (editingEmi?.status || 'active'),
        addedByMember: activeMember,
        paymentHistory: editingEmi?.paymentHistory || [],
      }, editingEmi?.id);

      setIsModalOpen(false);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Payment
  const handleRecord = async (emi: EmiPlan) => {
    setRecordingId(emi.id);
    try {
      await onRecordPayment(emi, selectedMonth);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#10b981', '#f59e0b']
      });
    } catch (err) {
      console.error(err);
    } finally {
      setRecordingId(null);
    }
  };

  // Calculate stats
  const activeEmis = emis.filter(e => e.status === 'active');
  const totalMonthlyBurden = activeEmis.reduce((sum, e) => sum + e.emiAmount, 0);
  
  const totalRemainingBalance = activeEmis.reduce((sum, e) => {
    const remainingMonths = Math.max(0, e.tenureMonths - e.paidMonths);
    return sum + (remainingMonths * e.emiAmount);
  }, 0);

  // EMI Calculator values
  const P = parseFloat(calcAmount) || 0;
  const R = (parseFloat(calcRate) || 0) / (12 * 100);
  const N = parseInt(calcTenure, 10) || 12;

  let calculatedEmi = 0;
  if (P > 0 && N > 0) {
    if (R === 0) {
      calculatedEmi = P / N;
    } else {
      calculatedEmi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    }
  }
  const totalPayable = calculatedEmi * N;
  const totalInterest = Math.max(0, totalPayable - P);

  // Filtered List
  const filteredEmis = emis.filter(e => {
    if (filterStatus === 'active') return e.status === 'active';
    if (filterStatus === 'completed') return e.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('emiTrackerTitle', language)}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              ₹ INR
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t('Track family loans, credit card EMIs, gadget installments & auto-record monthly payments', language)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCalc(!showCalc)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
              showCalc 
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{showCalc ? t('Hide Calculator', language) : t('EMI Calculator', language)}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('addEmiPlan', language)}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Monthly EMI Burden */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              Active Monthly EMI
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {formatINR(totalMonthlyBurden)}
            </div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
              {activeEmis.length} Active {activeEmis.length === 1 ? 'EMI plan' : 'EMI plans'} running
            </p>
          </div>
        </div>

        {/* Remaining Outstanding Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              Outstanding Loan Balance
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {formatINR(totalRemainingBalance)}
            </div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
              Total remaining principal across all active plans
            </p>
          </div>
        </div>

        {/* Selected Month EMI Payment Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              Status for {selectedMonth}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {(() => {
              const paidForThisMonth = activeEmis.filter(e => (e.paymentHistory || []).includes(selectedMonth));
              const isAllPaid = activeEmis.length > 0 && paidForThisMonth.length === activeEmis.length;
              return (
                <div>
                  <div className={`text-xl font-black ${isAllPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {paidForThisMonth.length} / {activeEmis.length} Recorded
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                    {isAllPaid ? 'All active EMIs paid for this month!' : `${activeEmis.length - paidForThisMonth.length} EMI payments pending for ${selectedMonth}`}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Completed EMIs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              Completed EMIs
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {emis.filter(e => e.status === 'completed').length} Plans
            </div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              Fully paid & settled loans
            </p>
          </div>
        </div>

      </div>

      {/* Interactive EMI Calculator Widget */}
      {showCalc && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/20 animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-black">Smart Loan & Monthly EMI Calculator</h3>
            </div>
            <button
              onClick={() => setShowCalc(false)}
              className="text-slate-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Loan / Purchase Amount (₹)
              </label>
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-base font-black font-mono text-white focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={calcRate}
                onChange={(e) => setCalcRate(e.target.value)}
                placeholder="0 for No-Cost EMI"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-base font-black font-mono text-white focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Tenure (Months)
              </label>
              <input
                type="number"
                value={calcTenure}
                onChange={(e) => setCalcTenure(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-base font-black font-mono text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Calculator Output */}
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-4 text-center md:text-left">
              <div>
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase">Monthly EMI</span>
                <span className="text-xl font-black font-mono text-indigo-300">{formatINR(Math.round(calculatedEmi))}</span>
              </div>
              <div>
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase">Total Interest</span>
                <span className="text-xl font-black font-mono text-amber-300">{formatINR(Math.round(totalInterest))}</span>
              </div>
              <div>
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase">Total Payable</span>
                <span className="text-xl font-black font-mono text-emerald-300">{formatINR(Math.round(totalPayable))}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal('New Calculated EMI', P, Math.round(calculatedEmi), N)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-indigo-900/50 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Plan with this EMI</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Active EMIs ({emis.filter(e => e.status === 'active').length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Completed ({emis.filter(e => e.status === 'completed').length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Plans ({emis.length})
            </button>
          </div>

          <div className="text-xs font-extrabold text-slate-400 dark:text-slate-400 font-mono">
            Selected Month for Payment: <span className="text-slate-900 dark:text-white font-black">{selectedMonth}</span>
          </div>

        </div>

        {/* EMI Cards Grid */}
        {filteredEmis.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
              No {filterStatus === 'all' ? '' : filterStatus} EMI plans found
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm mx-auto">
              Add your smartphone, car loan, home appliance or gadget EMI to keep family expenses synced in real-time.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="mt-4 px-5 py-2.5 bg-indigo-600 text-white font-extrabold text-xs rounded-2xl shadow-md hover:bg-indigo-700 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add First EMI Plan</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmis.map((emi) => {
              const memberTheme = MEMBER_THEMES[emi.paidBy];
              const progressPercent = Math.min(100, Math.round((emi.paidMonths / emi.tenureMonths) * 100));
              const remainingMonths = Math.max(0, emi.tenureMonths - emi.paidMonths);
              const remainingAmount = remainingMonths * emi.emiAmount;
              const isPaidForSelectedMonth = (emi.paymentHistory || []).includes(selectedMonth);

              return (
                <div
                  key={emi.id}
                  className={`border rounded-3xl p-5 transition-all shadow-2xs flex flex-col justify-between space-y-4 ${
                    emi.status === 'completed'
                      ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {/* Top Bar: Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                          {emi.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {getCategoryLabel(emi.category, language)}
                          </span>
                          {memberTheme && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${memberTheme.badgeBg} ${memberTheme.badgeText}`}>
                              {memberTheme.emoji} {emi.paidBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(emi)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        title="Edit EMI Plan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingEmi(emi)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                        title="Delete EMI Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Monthly EMI
                      </span>
                      <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {formatINR(emi.emiAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Remaining Principal
                      </span>
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                        {formatINR(remainingAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Tenure */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                      <span>{emi.paidMonths} of {emi.tenureMonths} Months Paid</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          emi.status === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-0.5">
                      <span>Start: {emi.startMonth}</span>
                      <span>Total Loan: {formatINR(emi.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {emi.notes && (
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      💡 {emi.notes}
                    </p>
                  )}

                  {/* Payment Button for Selected Month */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {emi.status === 'completed' ? (
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Loan Fully Settled & Completed!</span>
                      </div>
                    ) : isPaidForSelectedMonth ? (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 w-full justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Recorded Payment for {selectedMonth}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={recordingId === emi.id}
                        onClick={() => handleRecord(emi)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {recordingId === emi.id 
                            ? 'Syncing Expense...' 
                            : `Record ₹${emi.emiAmount} Payment for ${selectedMonth}`}
                        </span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Add / Edit EMI Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transition-all">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {editingEmi ? 'Edit EMI Plan' : 'Add New Monthly EMI Plan'}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Auto-schedules monthly installments across family devices
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                  EMI Title / Purchase Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Home Loan (SBI), iPhone 15 Pro, Bike EMI"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              {/* Total Amount & Interest Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                    Total Principal Amount (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="120000"
                    value={formTotalAmount}
                    onChange={(e) => setFormTotalAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                    Tenure (Months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="12"
                    value={formTenureMonths}
                    onChange={(e) => setFormTenureMonths(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              {/* Monthly EMI Amount & Auto-calculate button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Monthly EMI Amount (₹) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalculateFormEmi}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>Auto-calculate</span>
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="10000"
                  value={formEmiAmount}
                  onChange={(e) => setFormEmiAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-base font-black font-mono text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              {/* Paid By & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                    Paying Member *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {familyMembers.map((m) => {
                      const isSelected = formPaidBy === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFormPaidBy(m as FamilyMember)}
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

                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CategoryId)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{getCategoryLabel(c.id, language)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Month & Already Paid Months */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                    Start Month (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    value={formStartMonth}
                    onChange={(e) => setFormStartMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                    Months Already Paid
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formPaidMonths}
                    onChange={(e) => setFormPaidMonths(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                  Notes / Bank / Loan Ref ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Credit Card EMI, Loan Acc #9872"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-extrabold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : editingEmi ? 'Update EMI Plan' : 'Save EMI Plan'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 transition-all">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete EMI Plan</h3>
                <p className="text-xs font-semibold text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <span className="font-extrabold text-slate-900 dark:text-white">"{deletingEmi.title}"</span>? All history and commitment details for this EMI plan will be removed.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingEmi(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDeleteEmi(deletingEmi.id);
                  } catch (err) {
                    console.error('Delete EMI error:', err);
                  } finally {
                    setIsDeleting(false);
                    setDeletingEmi(null);
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-200 dark:shadow-none transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete EMI Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
