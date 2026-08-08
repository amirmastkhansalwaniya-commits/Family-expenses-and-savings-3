import React, { useState, useMemo } from 'react';
import { 
  SipPlan, 
  FamilyMember, 
  FAMILY_MEMBERS, 
  ADMIN_MEMBER, 
  MemberCustomConfig, 
  getMemberTheme,
  SIP_FUND_CATEGORIES
} from '../types';
import { formatINR, formatINRCompact, formatMonthName, getCurrentMonthKey } from '../utils/formatters';
import { Language, t, translateMemberName, translateCategoryLabel } from '../utils/translations';
import { MemberAvatar } from './MemberAvatar';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  Calculator, 
  Plus, 
  CheckCircle2, 
  PauseCircle, 
  Play, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ShieldCheck, 
  Target, 
  Calendar, 
  Coins, 
  PiggyBank, 
  Layers, 
  Clock, 
  ChevronRight, 
  Info,
  DollarSign,
  UserCheck,
  Check
} from 'lucide-react';

interface SipTrackerViewProps {
  sips: SipPlan[];
  onAddSip: (sip: Omit<SipPlan, 'id'>) => Promise<void>;
  onUpdateSip: (id: string, updates: Partial<SipPlan>) => Promise<void>;
  onDeleteSip: (id: string) => Promise<void>;
  onLogSipPayment: (sip: SipPlan, month: string) => Promise<void>;
  selectedMonth: string;
  familyMembers?: string[];
  activeMember: FamilyMember;
  memberConfigs?: Record<string, MemberCustomConfig>;
  language?: Language;
  theme?: 'light' | 'dark';
}

// Helper calculation formulas for SIP
export function calculateSipFutureValue(
  monthlyAmount: number,
  annualRatePct: number,
  tenureYears: number,
  stepUpPct: number = 0
): { totalInvested: number; estimatedValue: number; wealthGain: number } {
  const months = tenureYears * 12;
  const monthlyRate = annualRatePct / 12 / 100;

  if (stepUpPct <= 0) {
    if (monthlyRate === 0) {
      const invested = monthlyAmount * months;
      return { totalInvested: invested, estimatedValue: invested, wealthGain: 0 };
    }
    const totalInvested = monthlyAmount * months;
    // FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    const estimatedValue = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const wealthGain = Math.max(0, estimatedValue - totalInvested);
    return {
      totalInvested: Math.round(totalInvested),
      estimatedValue: Math.round(estimatedValue),
      wealthGain: Math.round(wealthGain)
    };
  } else {
    // Step-up SIP iteration
    let currentMonthly = monthlyAmount;
    let accumulatedValue = 0;
    let totalInvested = 0;

    for (let m = 1; m <= months; m++) {
      totalInvested += currentMonthly;
      accumulatedValue = (accumulatedValue + currentMonthly) * (1 + monthlyRate);

      // Increase monthly SIP by stepUpPct every 12 months
      if (m % 12 === 0) {
        currentMonthly = currentMonthly * (1 + stepUpPct / 100);
      }
    }

    const wealthGain = Math.max(0, accumulatedValue - totalInvested);
    return {
      totalInvested: Math.round(totalInvested),
      estimatedValue: Math.round(accumulatedValue),
      wealthGain: Math.round(wealthGain)
    };
  }
}

export const SipTrackerView: React.FC<SipTrackerViewProps> = ({
  sips,
  onAddSip,
  onUpdateSip,
  onDeleteSip,
  onLogSipPayment,
  selectedMonth,
  familyMembers = FAMILY_MEMBERS,
  activeMember,
  memberConfigs,
  theme = 'light',
  language = 'en',
}) => {
  const isDark = theme === 'dark';

  // Sub-tab: 'trackers' | 'calculator'
  const [viewTab, setViewTab] = useState<'trackers' | 'calculator'>('trackers');

  // Modal State for New / Edit / Delete SIP Plan
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSip, setEditingSip] = useState<SipPlan | null>(null);
  const [deletingSip, setDeletingSip] = useState<SipPlan | null>(null);

  // Filter State for Trackers List
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('active');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  // Form State for Add / Edit Modal
  const [formTitle, setFormTitle] = useState<string>('');
  const [formMonthlyAmount, setFormMonthlyAmount] = useState<number>(5000);
  const [formRate, setFormRate] = useState<number>(12);
  const [formTenure, setFormTenure] = useState<number>(10);
  const [formPaidBy, setFormPaidBy] = useState<FamilyMember>(activeMember || familyMembers[0] || 'Amir Khan');
  const [formCategory, setFormCategory] = useState<string>('Mutual Funds (Equity)');
  const [formGoal, setFormGoal] = useState<string>('Wealth Generation');
  const [formStartMonth, setFormStartMonth] = useState<string>(getCurrentMonthKey());
  const [formCompletedMonths, setFormCompletedMonths] = useState<number>(1);
  const [formStepUp, setFormStepUp] = useState<number>(10);
  const [formNotes, setFormNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // SIP Calculator State
  const [calcMonthly, setCalcMonthly] = useState<number>(10000);
  const [calcRate, setCalcRate] = useState<number>(12);
  const [calcTenure, setCalcTenure] = useState<number>(15);
  const [calcStepUp, setCalcStepUp] = useState<number>(0);

  // Calculate Calculator Results
  const calcResult = useMemo(() => {
    return calculateSipFutureValue(calcMonthly, calcRate, calcTenure, calcStepUp);
  }, [calcMonthly, calcRate, calcTenure, calcStepUp]);

  // Year-by-Year Schedule for Calculator
  const calcSchedule = useMemo(() => {
    const schedule = [];
    let currentMonthly = calcMonthly;
    let runningInvested = 0;
    let runningValue = 0;
    const monthlyRate = calcRate / 12 / 100;

    for (let yr = 1; yr <= calcTenure; yr++) {
      let yearlyInvested = 0;
      for (let m = 1; m <= 12; m++) {
        yearlyInvested += currentMonthly;
        runningInvested += currentMonthly;
        runningValue = (runningValue + currentMonthly) * (1 + monthlyRate);
      }
      if (calcStepUp > 0) {
        currentMonthly = currentMonthly * (1 + calcStepUp / 100);
      }
      schedule.push({
        year: `Year ${yr}`,
        yearlyInvested: Math.round(yearlyInvested),
        totalInvested: Math.round(runningInvested),
        estimatedValue: Math.round(runningValue),
        wealthGain: Math.round(Math.max(0, runningValue - runningInvested))
      });
    }
    return schedule;
  }, [calcMonthly, calcRate, calcTenure, calcStepUp]);

  // Portfolio Totals across Active Tracked SIPs
  const activeSipsList = useMemo(() => {
    return sips.filter((s) => s.status === 'active' || s.status === undefined);
  }, [sips]);

  const portfolioMetrics = useMemo(() => {
    let totalMonthlyCommitment = 0;
    let totalInvestedSoFar = 0;
    let totalEstimatedValue = 0;

    activeSipsList.forEach((sip) => {
      totalMonthlyCommitment += sip.monthlyAmount || 0;
      const completed = sip.completedMonths || 0;
      const calc = calculateSipFutureValue(
        sip.monthlyAmount || 0,
        sip.expectedRateOfReturn || 12,
        Math.max(1, Math.ceil(completed / 12)),
        sip.stepUpPercentage || 0
      );
      totalInvestedSoFar += (sip.monthlyAmount || 0) * completed;
      totalEstimatedValue += calc.estimatedValue;
    });

    const totalWealthGain = Math.max(0, totalEstimatedValue - totalInvestedSoFar);
    const returnGainPct = totalInvestedSoFar > 0 ? (totalWealthGain / totalInvestedSoFar) * 100 : 0;

    return {
      totalMonthlyCommitment,
      totalInvestedSoFar,
      totalEstimatedValue,
      totalWealthGain,
      returnGainPct
    };
  }, [activeSipsList]);

  // Filtered SIP list for display
  const filteredSips = useMemo(() => {
    return sips.filter((s) => {
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchMember = memberFilter === 'all' || s.paidBy === memberFilter;
      return matchStatus && matchMember;
    });
  }, [sips, statusFilter, memberFilter]);

  // Handle Open Add Modal
  const handleOpenAddModal = (initialCalcData?: { monthly: number; rate: number; tenure: number; stepUp: number }) => {
    setEditingSip(null);
    if (initialCalcData) {
      setFormTitle('My SIP Investment');
      setFormMonthlyAmount(initialCalcData.monthly);
      setFormRate(initialCalcData.rate);
      setFormTenure(initialCalcData.tenure);
      setFormStepUp(initialCalcData.stepUp);
    } else {
      setFormTitle('');
      setFormMonthlyAmount(5000);
      setFormRate(12);
      setFormTenure(10);
      setFormStepUp(10);
    }
    setFormPaidBy(activeMember || familyMembers[0] || 'Amir Khan');
    setFormCategory('Mutual Funds (Equity)');
    setFormGoal('Wealth Generation');
    setFormStartMonth(getCurrentMonthKey());
    setFormCompletedMonths(1);
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Handle Edit
  const handleEditSip = (sip: SipPlan) => {
    setEditingSip(sip);
    setFormTitle(sip.title);
    setFormMonthlyAmount(sip.monthlyAmount);
    setFormRate(sip.expectedRateOfReturn || 12);
    setFormTenure(sip.tenureYears || 10);
    setFormPaidBy(sip.paidBy);
    setFormCategory(sip.fundCategory || 'Mutual Funds (Equity)');
    setFormGoal(sip.goalName || 'Wealth Generation');
    setFormStartMonth(sip.startMonth || getCurrentMonthKey());
    setFormCompletedMonths(sip.completedMonths || 0);
    setFormStepUp(sip.stepUpPercentage || 0);
    setFormNotes(sip.notes || '');
    setIsModalOpen(true);
  };

  // Handle Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter a valid SIP / Fund title.');
      return;
    }
    if (formMonthlyAmount <= 0) {
      alert('Monthly SIP amount must be greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadData: Omit<SipPlan, 'id'> = {
        title: formTitle.trim(),
        monthlyAmount: Number(formMonthlyAmount),
        expectedRateOfReturn: Number(formRate),
        tenureYears: Number(formTenure),
        startMonth: formStartMonth,
        completedMonths: Number(formCompletedMonths),
        paidBy: formPaidBy,
        fundCategory: formCategory,
        goalName: formGoal,
        notes: formNotes.trim(),
        status: editingSip ? editingSip.status : 'active',
        stepUpPercentage: Number(formStepUp),
        createdAt: editingSip?.createdAt || new Date().toISOString(),
        addedByMember: activeMember,
        paymentHistory: editingSip?.paymentHistory || [selectedMonth],
      };

      if (editingSip) {
        await onUpdateSip(editingSip.id, payloadData);
      } else {
        await onAddSip(payloadData);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving SIP:', err);
      alert('Failed to save SIP. Please check connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Colors for Donut chart
  const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 3D Modern Top Hero Header */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/60 text-white'
          : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 border-indigo-800 text-white'
      }`}>
        {/* Background Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Wealth & Investment Tracking
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-[11px] font-mono font-bold">
                Compound Wealth Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{t('sipTitle', language)}</span>
              <TrendingUp className="w-7 h-7 text-emerald-400 stroke-[2.5]" />
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl mt-1 font-medium">
              {t('sipSubtitle', language)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Toggle View Tabs */}
            <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setViewTab('trackers')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  viewTab === 'trackers'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-[1.02]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{t('Active Plans', language)} ({sips.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('calculator')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  viewTab === 'calculator'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-[1.02]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>{t('sipCalculator', language)}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-emerald-400"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3]" />
              <span>{t('newSipPlan', language)}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-6 pt-6 border-t border-indigo-800/60">
          
          {/* Card 1: Monthly Commitment */}
          <div className="bg-slate-800/60 backdrop-blur-md border border-indigo-700/40 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
              <span>Monthly SIP Commit</span>
              <Coins className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-white">
              {formatINR(portfolioMetrics.totalMonthlyCommitment)}
            </p>
            <p className="text-[10px] text-indigo-300/80 font-medium">
              Across {activeSipsList.length} active SIP plans
            </p>
          </div>

          {/* Card 2: Total Invested So Far */}
          <div className="bg-slate-800/60 backdrop-blur-md border border-indigo-700/40 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
              <span>Total Invested So Far</span>
              <PiggyBank className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-amber-300">
              {formatINR(portfolioMetrics.totalInvestedSoFar)}
            </p>
            <p className="text-[10px] text-slate-300 font-medium">
              Actual principal logged to date
            </p>
          </div>

          {/* Card 3: Total Estimated Wealth / Savings */}
          <div className="bg-slate-800/60 backdrop-blur-md border border-indigo-700/40 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
              <span>Total Savings / Value</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
              {formatINR(portfolioMetrics.totalEstimatedValue)}
            </p>
            <p className="text-[10px] text-emerald-200/80 font-medium">
              Estimated accumulated savings value
            </p>
          </div>

          {/* Card 4: Est. Returns & Profit % */}
          <div className="bg-slate-800/60 backdrop-blur-md border border-indigo-700/40 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-indigo-200 text-[11px] font-extrabold uppercase tracking-wider">
              <span>Total Wealth Gain</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md text-[10px] font-mono font-bold">
                +{portfolioMetrics.returnGainPct.toFixed(1)}%
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-white">
              {formatINR(portfolioMetrics.totalWealthGain)}
            </p>
            <p className="text-[10px] text-indigo-300/80 font-medium">
              Pure compound returns earned
            </p>
          </div>

        </div>
      </div>

      {/* VIEW TAB 1: MY SIP TRACKERS */}
      {viewTab === 'trackers' && (
        <div className="space-y-6">
          
          {/* Filters & Actions Bar */}
          <div className={`p-4 rounded-3xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">Status:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  statusFilter === 'active'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Active Plans ({sips.filter(s => s.status === 'active' || !s.status).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('paused')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  statusFilter === 'paused'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Paused ({sips.filter(s => s.status === 'paused').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Completed ({sips.filter(s => s.status === 'completed').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-700 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All ({sips.length})
              </button>
            </div>

            {/* Member Filter Dropdown */}
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-500">Member:</span>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border focus:outline-none cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="all">All Family Members</option>
                {familyMembers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SIP Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSips.map((sip) => {
              const themeConfig = getMemberTheme(sip.paidBy, memberConfigs);
              const totalTenureMonths = (sip.tenureYears || 10) * 12;
              const completedMonths = sip.completedMonths || 0;
              const progressPct = Math.min(100, Math.round((completedMonths / totalTenureMonths) * 100));

              // Compute future value projection for this single SIP
              const proj = calculateSipFutureValue(
                sip.monthlyAmount,
                sip.expectedRateOfReturn || 12,
                sip.tenureYears || 10,
                sip.stepUpPercentage || 0
              );

              const currentInvested = sip.monthlyAmount * completedMonths;
              const currentVal = calculateSipFutureValue(
                sip.monthlyAmount,
                sip.expectedRateOfReturn || 12,
                Math.max(1, Math.ceil(completedMonths / 12)),
                sip.stepUpPercentage || 0
              ).estimatedValue;

              const isLoggedThisMonth = sip.paymentHistory?.includes(selectedMonth);

              return (
                <div
                  key={sip.id}
                  className={`rounded-3xl border p-5 sm:p-6 transition-all duration-300 hover:shadow-xl relative flex flex-col justify-between space-y-4 ${
                    isDark 
                      ? 'bg-slate-900/90 border-slate-800 text-slate-100 hover:border-indigo-800' 
                      : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-200 shadow-xs'
                  }`}
                >
                  {/* Top Bar: Title & Member Avatar */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {sip.fundCategory || 'Mutual Funds'}
                          </span>
                          {sip.goalName && (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                              <Target className="w-3 h-3 text-amber-500" />
                              {sip.goalName}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            sip.status === 'paused' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : sip.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          }`}>
                            {sip.status || 'Active'}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                          {sip.title}
                        </h3>
                      </div>

                      {/* Member Badge */}
                      <div className="flex items-center gap-2 shrink-0 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                        <MemberAvatar member={sip.paidBy} customConfigs={memberConfigs} size="sm" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 pr-1">
                          {sip.paidBy}
                        </span>
                      </div>
                    </div>

                    {/* Rates & Monthly Amount Bar */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 mt-4 text-center">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Monthly SIP</span>
                        <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                          {formatINR(sip.monthlyAmount)}
                        </span>
                      </div>
                      <div className="border-x border-slate-200/60 dark:border-slate-700">
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Rate of Return</span>
                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {sip.expectedRateOfReturn || 12}% p.a.
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Tenure</span>
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-slate-100">
                          {sip.tenureYears || 10} Yrs
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Installments */}
                    <div className="space-y-1.5 mt-4">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="text-slate-500 dark:text-slate-400">
                          Installments: {completedMonths} / {totalTenureMonths} months
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                          {progressPct}% Progress
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Values Grid: Invested So Far vs Projected Wealth */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 font-extrabold block text-[10px] uppercase">Invested So Far:</span>
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white block">
                          {formatINR(currentInvested)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-extrabold block text-[10px] uppercase">Est. Target Wealth ({sip.tenureYears}y):</span>
                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                          {formatINR(proj.estimatedValue)}
                        </span>
                      </div>
                    </div>

                    {sip.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl italic">
                        "{sip.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                    
                    {/* Log Payment for Selected Month Button */}
                    <button
                      type="button"
                      onClick={() => onLogSipPayment(sip, selectedMonth)}
                      disabled={isLoggedThisMonth}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        isLoggedThisMonth
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95'
                      }`}
                      title={isLoggedThisMonth ? `Already logged for ${formatMonthName(selectedMonth)}` : `Log ₹${sip.monthlyAmount} expense for ${formatMonthName(selectedMonth)}`}
                    >
                      {isLoggedThisMonth ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Logged for {formatMonthName(selectedMonth)}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Log {formatMonthName(selectedMonth)} SIP (₹{sip.monthlyAmount})</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = sip.status === 'paused' ? 'active' : 'paused';
                          onUpdateSip(sip.id, { status: nextStatus });
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          sip.status === 'paused'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                        title={sip.status === 'paused' ? 'Resume SIP Plan' : 'Pause SIP Plan'}
                      >
                        {sip.status === 'paused' ? <Play className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditSip(sip)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
                        title="Edit SIP Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingSip(sip)}
                        className="p-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer"
                        title="Delete SIP Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}

            {filteredSips.length === 0 && (
              <div className="col-span-full bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  No SIP Plans Found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Start tracking your Mutual Funds, Index Funds, or Gold SIPs to monitor your rate of return, invested principal, and future savings goals!
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add First SIP Plan</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW TAB 2: INTERACTIVE SIP CALCULATOR */}
      {viewTab === 'calculator' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Inputs Controls Card */}
            <div className={`lg:col-span-5 p-6 rounded-3xl border shadow-sm space-y-6 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
            }`}>
              <div className="flex items-center gap-2.5 border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    SIP Investment Calculator
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Adjust variables to project total investment & future wealth
                  </p>
                </div>
              </div>

              {/* Input 1: Monthly Investment (₹) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Monthly SIP Amount:
                  </label>
                  <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {formatINR(calcMonthly)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="200000"
                  step="500"
                  value={calcMonthly}
                  onChange={(e) => setCalcMonthly(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>₹500/mo</span>
                  <span>₹1,00,000/mo</span>
                  <span>₹2,00,000/mo</span>
                </div>
              </div>

              {/* Input 2: Expected Rate of Return (% p.a.) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Expected Rate of Return (ROI % p.a.):
                  </label>
                  <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {calcRate}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>1% (FD/Savings)</span>
                  <span>12% (Equity Index)</span>
                  <span>30% (High Growth)</span>
                </div>
              </div>

              {/* Input 3: Investment Tenure (Years) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Investment Period (Tenure):
                  </label>
                  <span className="text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {calcTenure} Years ({calcTenure * 12} Months)
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 Yr</span>
                  <span>15 Yrs</span>
                  <span>40 Yrs</span>
                </div>
              </div>

              {/* Input 4: Annual Step-up Rate (%) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <span>Annual Step-up Increment (%):</span>
                    <span className="text-[10px] text-amber-500 font-mono font-normal">(Optional)</span>
                  </label>
                  <span className="text-sm font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    {calcStepUp}% Yearly
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={calcStepUp}
                  onChange={(e) => setCalcStepUp(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[10px] text-slate-400">
                  Increases your monthly SIP contribution by {calcStepUp}% at the end of every year.
                </p>
              </div>

              {/* Save directly as Tracked SIP Button */}
              <button
                type="button"
                onClick={() => handleOpenAddModal({ monthly: calcMonthly, rate: calcRate, tenure: calcTenure, stepUp: calcStepUp })}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/30 active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add This Calculator Setup into Active SIP Trackers</span>
              </button>
            </div>

            {/* Right Output Results & Breakdown Chart */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Output Metric Badges */}
              <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Projected Investment Breakdown</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">{calcTenure} Years Horizon</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  
                  {/* Total Invested */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Invested</span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white block mt-0.5">
                      {formatINR(calcResult.totalInvested)}
                    </span>
                  </div>

                  {/* Est. Wealth Gain */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">Est. Wealth Gain</span>
                    <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-300 block mt-0.5">
                      +{formatINR(calcResult.wealthGain)}
                    </span>
                  </div>

                  {/* Total Savings / Future Value */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400 block">Total Future Value</span>
                    <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-300 block mt-0.5">
                      {formatINR(calcResult.estimatedValue)}
                    </span>
                  </div>

                </div>

                {/* Donut Chart: Invested vs Wealth Gain */}
                <div className="h-64 w-full relative flex items-center justify-center pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Total Invested Principal', value: calcResult.totalInvested, color: '#6366f1' },
                          { name: 'Estimated Compound Profit', value: calcResult.wealthGain, color: '#10b981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell key="cell-0" fill="#6366f1" stroke="#fff" strokeWidth={2} />
                        <Cell key="cell-1" fill="#10b981" stroke="#fff" strokeWidth={2} />
                      </Pie>
                      <Tooltip 
                        formatter={(val: number) => formatINR(val)} 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Savings</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {formatINRCompact(calcResult.estimatedValue)}
                    </span>
                  </div>
                </div>

                {/* Legend bar */}
                <div className="flex items-center justify-center gap-6 text-xs font-black pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span>Invested ({Math.round((calcResult.totalInvested / Math.max(1, calcResult.estimatedValue)) * 100)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Wealth Gain ({Math.round((calcResult.wealthGain / Math.max(1, calcResult.estimatedValue)) * 100)}%)</span>
                  </div>
                </div>

              </div>

              {/* Schedule Growth Table */}
              <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Year-by-Year Growth Schedule Table
                </h3>

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className={`sticky top-0 font-extrabold border-b ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      <tr>
                        <th className="p-3">Year</th>
                        <th className="p-3">Total Invested</th>
                        <th className="p-3">Wealth Gain</th>
                        <th className="p-3 text-right">Portfolio Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {calcSchedule.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-sans font-bold">{row.year}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{formatINR(row.totalInvested)}</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400">+{formatINR(row.wealthGain)}</td>
                          <td className="p-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                            {formatINR(row.estimatedValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODAL: ADD / EDIT SIP PLAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingSip ? 'Edit Tracked SIP Plan' : 'Add New SIP Plan'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set up monthly investment details, return expectations & goals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs font-extrabold">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Fund / Investment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Parag Parikh Flexi Cap Fund / Nifty 50 Index"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={`w-full p-3 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Monthly Amount & Expected Return Rate Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Monthly SIP Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="500"
                    value={formMonthlyAmount}
                    onChange={(e) => setFormMonthlyAmount(Number(e.target.value))}
                    className={`w-full p-3 rounded-2xl border text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Expected Rate (% p.a.) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={formRate}
                    onChange={(e) => setFormRate(Number(e.target.value))}
                    className={`w-full p-3 rounded-2xl border text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Tenure Years & Completed Installments */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Tenure Duration (Years) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={formTenure}
                    onChange={(e) => setFormTenure(Number(e.target.value))}
                    className={`w-full p-3 rounded-2xl border text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Completed Installments
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCompletedMonths}
                    onChange={(e) => setFormCompletedMonths(Number(e.target.value))}
                    className={`w-full p-3 rounded-2xl border text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Fund Category & Goal Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Fund Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full p-3 rounded-2xl border text-xs font-bold focus:outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {SIP_FUND_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Goal / Purpose
                  </label>
                  <select
                    value={formGoal}
                    onChange={(e) => setFormGoal(e.target.value)}
                    className={`w-full p-3 rounded-2xl border text-xs font-bold focus:outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Wealth Generation">Wealth Generation</option>
                    <option value="Retirement Fund">Retirement Fund</option>
                    <option value="Child Higher Education">Child Higher Education</option>
                    <option value="Home Down Payment">Home Down Payment</option>
                    <option value="Emergency Corpus">Emergency Corpus</option>
                    <option value="Tax Saving (ELSS)">Tax Saving (ELSS)</option>
                  </select>
                </div>
              </div>

              {/* Member Paid By & Step Up % */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs font-bold">
                    Paid By Member
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
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

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Annual Step-Up %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formStepUp}
                    onChange={(e) => setFormStepUp(Number(e.target.value))}
                    className={`w-full p-3 rounded-2xl border text-sm font-bold font-mono focus:outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Notes / Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Folio number, Auto-debit date 10th of every month"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className={`w-full p-3 rounded-2xl border text-xs font-bold focus:outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Submit button */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {isSubmitting ? 'Saving...' : editingSip ? 'Update SIP Plan' : 'Save SIP Tracker'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE SIP CONFIRMATION MODAL */}
      {deletingSip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-3xl max-w-sm w-full p-6 shadow-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base">Delete SIP Tracker?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="font-bold text-slate-900 dark:text-white">"{deletingSip.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingSip(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSip(deletingSip.id);
                  setDeletingSip(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete SIP</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
