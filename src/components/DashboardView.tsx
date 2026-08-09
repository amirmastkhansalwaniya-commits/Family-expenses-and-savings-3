import React, { useState, useEffect } from 'react';
import { Expense, FamilyMember, FAMILY_MEMBERS, CATEGORIES, MEMBER_THEMES, EmiPlan, MemberBankAmount, ADMIN_MEMBER, MemberCustomConfig, getMemberTheme, CategoryId } from '../types';
import { formatINR, formatINRCompact, formatDateDisplay, formatMonthName, getCurrentMonthKey } from '../utils/formatters';
import { MemberAvatar } from './MemberAvatar';
import { PieChartSection } from './PieChartSection';
import { 
  Wallet, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Plus, 
  Edit3, 
  UserCheck, 
  AlertCircle,
  Calendar,
  Clock,
  Pencil,
  CheckCircle,
  Sparkles,
  Target,
  PiggyBank,
  Check,
  Award,
  FileText,
  Printer,
  Download,
  X,
  FileCheck,
  AlertTriangle,
  Bell,
  CreditCard,
  Loader2,
  Landmark,
  ArrowRight,
  RotateCcw,
  History,
  Edit2,
  Lock,
  ShieldAlert,
  ShoppingCart,
  Home,
  Sliders,
  Calculator,
  Users,
  Trash2,
  ArrowRightLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const MEMBER_HEX_COLORS: Record<FamilyMember, string> = {
  'Amir Khan': '#2563eb',
  'Angrej Singh': '#10b981',
  'Kajal': '#ec4899',
  'Shahnaz': '#f97316',
  'Sonam': '#a855f7',
};

const getLast6Months = (targetMonthStr: string) => {
  const parts = targetMonthStr.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || (new Date().getMonth() + 1);
  const targetDate = new Date(year, month - 1, 1);

  const result: { yearMonth: string; label: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(targetDate.getFullYear(), targetDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${y}-${m}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    result.push({ yearMonth, label });
  }

  return result;
};

// Custom Tooltip for Recharts Line Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 shadow-xl text-xs space-y-1.5 font-sans">
        <p className="font-extrabold border-b border-slate-800 pb-1 text-slate-300">
          Month: <span className="text-white">{label}</span>
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-mono">
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {formatINR(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

import { Language, t, getCategoryLabel, translateMemberName } from '../utils/translations';

interface DashboardViewProps {
  expenses: Expense[];
  monthlyBudget: number;
  onUpdateBudget: (newBudget: number) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onOpenAddExpense: () => void;
  onSaveExpense?: (expenseData: Omit<Expense, 'id'>) => Promise<void> | void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => Promise<void> | void;
  activeMember: FamilyMember;
  emis?: EmiPlan[];
  onSaveEmi?: (emiData: Omit<EmiPlan, 'id'>, id?: string) => Promise<void> | void;
  onDeleteEmi?: (emiId: string) => Promise<void> | void;
  memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
  onUpdateBankAmount?: (member: FamilyMember, updates: Partial<MemberBankAmount>) => Promise<void> | void;
  onOpenBankTransfer?: () => void;
  onNavigateTab?: (tab: 'dashboard' | 'transactions' | 'emis' | 'android-guide') => void;
  onSelectMember?: (member: FamilyMember) => void;
  language?: Language;
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
  onOpenManageMembers?: () => void;
  isPdfModalOpen?: boolean;
  setIsPdfModalOpen?: (open: boolean) => void;
}

function oklchToRgbStr(oklchStr: string): string {
  try {
    const cleaned = oklchStr.replace(/\s+/g, ' ').trim();
    const match = cleaned.match(/oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i);
    if (!match) return '#334155';

    let l = parseFloat(match[1]);
    if (match[1].endsWith('%')) l /= 100;

    let c = parseFloat(match[2]);
    if (match[2].endsWith('%')) c /= 100;

    let h = parseFloat(match[3]);

    let a = match[4] ? parseFloat(match[4]) : 1;
    if (match[4] && match[4].endsWith('%')) a /= 100;

    const hRad = (h * Math.PI) / 180;
    const aLab = c * Math.cos(hRad);
    const bLab = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
    const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
    const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;

    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;

    let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    let b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

    const gamma = (x: number) => {
      x = Math.max(0, Math.min(1, x));
      return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    };

    const r255 = Math.round(gamma(r) * 255);
    const g255 = Math.round(gamma(g) * 255);
    const b255 = Math.round(gamma(b) * 255);

    if (a < 1) {
      return `rgba(${r255}, ${g255}, ${b255}, ${a})`;
    }
    return `rgb(${r255}, ${g255}, ${b255})`;
  } catch {
    return '#334155';
  }
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  monthlyBudget,
  onUpdateBudget,
  selectedMonth,
  onMonthChange,
  onOpenAddExpense,
  onSaveExpense,
  onEditExpense,
  onDeleteExpense,
  activeMember,
  emis = [],
  onSaveEmi,
  onDeleteEmi,
  memberBankAmounts,
  onUpdateBankAmount,
  onOpenBankTransfer,
  onNavigateTab,
  onSelectMember,
  language = 'en',
  familyMembers = FAMILY_MEMBERS,
  memberConfigs,
  onOpenManageMembers,
  isPdfModalOpen: externalIsPdfModalOpen,
  setIsPdfModalOpen: externalSetIsPdfModalOpen,
}) => {
  const isAdmin = activeMember === ADMIN_MEMBER;
  const [adminNoticeModalOpen, setAdminNoticeModalOpen] = useState(false);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState(monthlyBudget.toString());

  // Edit Budget Modal states
  const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
  const [editBudgetAmount, setEditBudgetAmount] = useState<string>(monthlyBudget.toString());
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Remaining Budget / All Bank Balances Modal state
  const [isEditAllBankBalancesModalOpen, setIsEditAllBankBalancesModalOpen] = useState(false);

  const [chartMode, setChartMode] = useState<'total' | 'members'>('total');
  const [internalIsPdfModalOpen, setInternalIsPdfModalOpen] = useState(false);
  const isPdfModalOpen = externalIsPdfModalOpen ?? internalIsPdfModalOpen;
  const setIsPdfModalOpen = externalSetIsPdfModalOpen ?? setInternalIsPdfModalOpen;
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [dismissedAlertMonth, setDismissedAlertMonth] = useState<string | null>(null);
  const [viewingHistoryMember, setViewingHistoryMember] = useState<FamilyMember | null>(null);

  // Custom Family Total Expenses Overrides per month (stored in localStorage)
  const [familyTotalOverrides, setFamilyTotalOverrides] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('family_custom_total_spent_overrides');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const handleSaveFamilyTotalOverride = (monthKey: string, newTotal: number) => {
    const updated = { ...familyTotalOverrides, [monthKey]: newTotal };
    setFamilyTotalOverrides(updated);
    localStorage.setItem('family_custom_total_spent_overrides', JSON.stringify(updated));
  };

  const handleResetFamilyTotalOverride = (monthKey: string) => {
    const updated = { ...familyTotalOverrides };
    delete updated[monthKey];
    setFamilyTotalOverrides(updated);
    localStorage.setItem('family_custom_total_spent_overrides', JSON.stringify(updated));
  };

  // Change Total Family Expenses Modal State
  const [isEditTotalExpensesModalOpen, setIsEditTotalExpensesModalOpen] = useState(false);
  const [activeTotalEditTab, setActiveTotalEditTab] = useState<'monthly' | 'override' | 'adjust' | 'list'>('monthly');
  const [inputFamilyTotalAmount, setInputFamilyTotalAmount] = useState<string>('');

  // Adjustment entry form state
  const [adjAmount, setAdjAmount] = useState<string>('');
  const [adjType, setAdjType] = useState<'add' | 'subtract'>('add');
  const [adjCategory, setAdjCategory] = useState<CategoryId>('Others');
  const [adjPaidBy, setAdjPaidBy] = useState<FamilyMember>(activeMember || 'Amir Khan');
  const [adjNotes, setAdjNotes] = useState<string>('Family total expense adjustment');
  const [totalEditSuccessMsg, setTotalEditSuccessMsg] = useState<string | null>(null);

  // Quick edit inline amount for expense item
  const [quickEditingExpenseId, setQuickEditingExpenseId] = useState<string | null>(null);
  const [quickEditingAmount, setQuickEditingAmount] = useState<string>('');
  const [dashGroceryBoxSize, setDashGroceryBoxSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Dashboard Bank Amount Modify Modal State
  const [editingDashBankMember, setEditingDashBankMember] = useState<FamilyMember | null>(null);
  const [dashBankAmount, setDashBankAmount] = useState<string>('0');
  const [dashBankName, setDashBankName] = useState<string>('');
  const [dashUpiId, setDashUpiId] = useState<string>('');
  const [dashNotes, setDashNotes] = useState<string>('');
  const [dashStatus, setDashStatus] = useState<'pending' | 'received' | 'partially_settled'>('pending');
  const [dashBankError, setDashBankError] = useState<string | null>(null);

  // Dashboard Total Spent Modify Modal State
  const [editingTotalSpentDashMember, setEditingTotalSpentDashMember] = useState<FamilyMember | null>(null);
  const [inputTotalSpentDashAmount, setInputTotalSpentDashAmount] = useState<string>('0');

  // Dashboard Month Spent Modify Modal State
  const [editingMonthSpentDashMember, setEditingMonthSpentDashMember] = useState<FamilyMember | null>(null);
  const [inputMonthSpentDashAmount, setInputMonthSpentDashAmount] = useState<string>('0');

  const handleOpenDashBankModal = (m: FamilyMember) => {
    const current = memberBankAmounts?.[m];
    const currentAmt = current?.pendingBankAmount || 0;
    setEditingDashBankMember(m);
    setDashBankAmount(currentAmt.toString());
    setDashBankName(current?.bankName || 'SBI / GPay');
    setDashUpiId(current?.upiId || '');
    setDashNotes(current?.notes || '');
    setDashStatus(current?.status || 'pending');
    setDashBankError(null);
  };

  const handleOpenTotalSpentDashModal = (m: FamilyMember, currentTotalSpent: number) => {
    setEditingTotalSpentDashMember(m);
    setInputTotalSpentDashAmount(currentTotalSpent.toString());
  };

  const handleSaveTotalSpentDash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTotalSpentDashMember || !onUpdateBankAmount) return;

    const parsed = parseFloat(inputTotalSpentDashAmount);
    const customOverride = isNaN(parsed) ? undefined : parsed;

    await onUpdateBankAmount(editingTotalSpentDashMember, {
      customTotalSpentOverride: customOverride,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingTotalSpentDashMember(null);
  };

  const handleResetTotalSpentDash = async () => {
    if (!editingTotalSpentDashMember || !onUpdateBankAmount) return;

    await onUpdateBankAmount(editingTotalSpentDashMember, {
      customTotalSpentOverride: undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingTotalSpentDashMember(null);
  };

  const handleOpenMonthSpentDashModal = (m: FamilyMember, currentMonthSpent: number) => {
    setEditingMonthSpentDashMember(m);
    setInputMonthSpentDashAmount(currentMonthSpent.toString());
  };

  const handleSaveMonthSpentDash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonthSpentDashMember || !onUpdateBankAmount) return;

    const parsed = parseFloat(inputMonthSpentDashAmount);
    const customOverride = isNaN(parsed) ? undefined : parsed;

    await onUpdateBankAmount(editingMonthSpentDashMember, {
      customMonthSpentOverride: customOverride,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingMonthSpentDashMember(null);
  };

  const handleResetMonthSpentDash = async () => {
    if (!editingMonthSpentDashMember || !onUpdateBankAmount) return;

    await onUpdateBankAmount(editingMonthSpentDashMember, {
      customMonthSpentOverride: undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingMonthSpentDashMember(null);
  };

  const handleSaveDashBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDashBankMember || !onUpdateBankAmount) return;

    const currentBankAmt = memberBankAmounts?.[editingDashBankMember]?.pendingBankAmount || 0;
    const amt = Math.max(0, parseFloat(dashBankAmount) || 0);

    if (amt < currentBankAmt) {
      setDashBankError(`Bank account balance can only be increased (must be at least ₹${currentBankAmt.toLocaleString('en-IN')})`);
      return;
    }

    await onUpdateBankAmount(editingDashBankMember, {
      pendingBankAmount: amt,
      bankName: dashBankName.trim() || 'Bank Transfer',
      upiId: dashUpiId.trim(),
      notes: dashNotes.trim(),
      status: dashStatus,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingDashBankMember(null);
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('monthly-pdf-report-document');
    if (!element) return;

    setIsDownloadingPdf(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Family_Expense_Summary_${selectedMonth}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          onclone: (clonedDoc: Document) => {
            // Replace oklch(...) in all <style> tags of clonedDoc
            clonedDoc.querySelectorAll('style').forEach((styleTag) => {
              if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
                styleTag.textContent = styleTag.textContent.replace(/oklch\([\s\S]*?\)/gi, (m) => oklchToRgbStr(m));
              }
            });

            // Replace oklch(...) in inline style attributes of clonedDoc
            clonedDoc.querySelectorAll('[style]').forEach((el) => {
              const styleAttr = el.getAttribute('style');
              if (styleAttr && styleAttr.includes('oklch')) {
                el.setAttribute('style', styleAttr.replace(/oklch\([\s\S]*?\)/gi, (m) => oklchToRgbStr(m)));
              }
            });
          }
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await (html2pdf as any)().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to generate PDF via html2pdf:', err);
      // Fallback: trigger browser print dialog
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Savings Goal State (persisted in localStorage for durability across sessions)
  const [savingsTitle, setSavingsTitle] = useState<string>(() => {
    return localStorage.getItem('family_savings_goal_title') || 'Family Vacation & Emergency Fund';
  });
  const [savingsTarget, setSavingsTarget] = useState<number>(() => {
    const val = localStorage.getItem('family_savings_goal_target');
    return val ? parseFloat(val) : 100000;
  });
  const [savingsCurrent, setSavingsCurrent] = useState<number>(() => {
    const val = localStorage.getItem('family_savings_goal_current');
    return val ? parseFloat(val) : 38500;
  });

  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [editTitleInput, setEditTitleInput] = useState<string>(savingsTitle);
  const [editTargetInput, setEditTargetInput] = useState<string>(savingsTarget.toString());
  const [editCurrentInput, setEditCurrentInput] = useState<string>(savingsCurrent.toString());
  const [quickAddInput, setQuickAddInput] = useState<string>('');

  const handleSaveGoal = () => {
    const targetVal = parseFloat(editTargetInput);
    const currentVal = parseFloat(editCurrentInput);
    if (editTitleInput.trim() && !isNaN(targetVal) && targetVal > 0 && !isNaN(currentVal) && currentVal >= 0) {
      setSavingsTitle(editTitleInput.trim());
      setSavingsTarget(targetVal);
      setSavingsCurrent(currentVal);
      localStorage.setItem('family_savings_goal_title', editTitleInput.trim());
      localStorage.setItem('family_savings_goal_target', targetVal.toString());
      localStorage.setItem('family_savings_goal_current', currentVal.toString());
      setIsEditingGoal(false);
    }
  };

  const handleAddSavings = (amountToAdd: number) => {
    if (amountToAdd > 0) {
      const newCurrent = savingsCurrent + amountToAdd;
      setSavingsCurrent(newCurrent);
      localStorage.setItem('family_savings_goal_current', newCurrent.toString());
      setQuickAddInput('');
    }
  };

  // Filter expenses by selected month (YYYY-MM)
  const monthExpenses = expenses.filter(exp => exp.date && exp.date.startsWith(selectedMonth));

  // Compute 6-Month Trend Data
  const last6Months = getLast6Months(selectedMonth);
  const trendsData = last6Months.map(({ yearMonth, label }) => {
    const mExpenses = expenses.filter(exp => exp.date && exp.date.startsWith(yearMonth));
    const total = mExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    const memberAmounts: Record<string, number> = {};
    FAMILY_MEMBERS.forEach(m => {
      memberAmounts[m] = mExpenses
        .filter(exp => exp.paidBy === m)
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    });

    return {
      month: label,
      yearMonth,
      'Total Expenses': total,
      'Budget': monthlyBudget,
      ...memberAmounts,
    };
  });

  // Breakdown by Family Member for selectedMonth
  const memberTotals: Record<string, { amount: number; count: number }> = {};
  familyMembers.forEach(m => {
    memberTotals[m] = { amount: 0, count: 0 };
  });
  if (typeof FAMILY_MEMBERS !== 'undefined' && Array.isArray(FAMILY_MEMBERS)) {
    FAMILY_MEMBERS.forEach(m => {
      if (!memberTotals[m]) memberTotals[m] = { amount: 0, count: 0 };
    });
  }

  monthExpenses.forEach(exp => {
    if (exp.paidBy) {
      if (!memberTotals[exp.paidBy]) {
        memberTotals[exp.paidBy] = { amount: 0, count: 0 };
      }
      memberTotals[exp.paidBy].amount += Number(exp.amount) || 0;
      memberTotals[exp.paidBy].count += 1;
    }
  });

  // Apply customMonthSpentOverride if present for members
  FAMILY_MEMBERS.forEach(m => {
    const override = memberBankAmounts?.[m]?.customMonthSpentOverride;
    if (override !== undefined && override !== null && !isNaN(Number(override))) {
      if (!memberTotals[m]) memberTotals[m] = { amount: 0, count: 0 };
      memberTotals[m].amount = Number(override);
    }
  });

  // Total Family Monthly Expenses sum across all family members
  const sumFamilyMonthlyExpenses = familyMembers.reduce(
    (sum, m) => sum + (memberTotals[m]?.amount || 0),
    0
  );

  // Total spent calculation in month (use sum of family members' monthly expenses)
  const rawCalculatedTotalSpent = monthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const calculatedTotalSpent = Math.max(rawCalculatedTotalSpent, sumFamilyMonthlyExpenses);
  const sipExpenses = monthExpenses.filter(exp => (exp.category as string) === 'SIP');
  const totalSipInvested = sipExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const hasCustomTotalOverride = familyTotalOverrides[selectedMonth] !== undefined;
  const totalSpent = hasCustomTotalOverride ? familyTotalOverrides[selectedMonth] : calculatedTotalSpent;
  const remainingBudget = monthlyBudget - totalSpent;
  const budgetUsagePercent = monthlyBudget > 0 ? Math.min(Math.round((totalSpent / monthlyBudget) * 100), 999) : 0;

  // Combined Total Bank Balance across all family members
  const totalCombinedBankBalance = familyMembers.reduce(
    (sum, m) => sum + (memberBankAmounts?.[m]?.pendingBankAmount || 0),
    0
  );

  const handleOpenEditBudgetModal = () => {
    setEditBudgetAmount(monthlyBudget.toString());
    setIsEditBudgetModalOpen(true);
  };

  const handleSaveBudgetModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalBudget = Math.max(0, parseFloat(editBudgetAmount) || 0);
    setIsSavingBudget(true);
    try {
      await onUpdateBudget(finalBudget);
      setIsEditBudgetModalOpen(false);
    } catch (err) {
      console.error('Failed to update budget:', err);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleOpenChangeTotalExpensesModal = () => {
    setInputFamilyTotalAmount(totalSpent.toString());
    setAdjAmount('');
    setTotalEditSuccessMsg(null);
    setQuickEditingExpenseId(null);
    setActiveTotalEditTab('monthly');
    setIsEditTotalExpensesModalOpen(true);
  };

  const handleSaveDirectFamilyTotalOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputFamilyTotalAmount);
    if (!isNaN(parsed) && parsed >= 0) {
      handleSaveFamilyTotalOverride(selectedMonth, parsed);
      setTotalEditSuccessMsg(`Total Family Expenses for ${selectedMonth} updated to ${formatINR(parsed)}!`);
      setTimeout(() => {
        setIsEditTotalExpensesModalOpen(false);
        setTotalEditSuccessMsg(null);
      }, 1200);
    }
  };

  const handleResetDirectFamilyTotalOverride = () => {
    handleResetFamilyTotalOverride(selectedMonth);
    setInputFamilyTotalAmount(calculatedTotalSpent.toString());
    setTotalEditSuccessMsg(`Reset to calculated expenses sum (${formatINR(calculatedTotalSpent)})!`);
  };

  const handleAddAdjustmentEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(adjAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    const finalAmount = adjType === 'subtract' ? -parsed : parsed;
    const today = new Date().toISOString().split('T')[0];
    const dateStr = selectedMonth === getCurrentMonthKey() ? today : `${selectedMonth}-01`;

    if (onSaveExpense) {
      await onSaveExpense({
        amount: finalAmount,
        category: adjCategory,
        paidBy: adjPaidBy,
        date: dateStr,
        notes: adjNotes || `Total expense adjustment (${adjType === 'subtract' ? '-' : '+'}${formatINR(parsed)})`,
        addedByMember: activeMember,
      });

      handleResetFamilyTotalOverride(selectedMonth);
      setAdjAmount('');
      setTotalEditSuccessMsg(`Added adjustment entry of ${formatINR(finalAmount)} successfully!`);
    }
  };

  const handleSaveQuickExpenseAmount = async (expense: Expense, newAmtStr: string) => {
    const parsed = parseFloat(newAmtStr);
    if (isNaN(parsed) || parsed < 0) return;

    if (onEditExpense) {
      onEditExpense({ ...expense, amount: parsed });
    } else if (onSaveExpense) {
      await onSaveExpense({
        amount: parsed,
        category: expense.category,
        paidBy: expense.paidBy,
        date: expense.date,
        notes: expense.notes,
        addedByMember: expense.addedByMember,
      });
    }
    setQuickEditingExpenseId(null);
    setTotalEditSuccessMsg(`Updated expense amount to ${formatINR(parsed)}!`);
  };

  // Breakdown by Category
  const categoryTotals: Record<string, number> = {};
  monthExpenses.forEach(exp => {
    const normCat = exp.category === 'Grocery' ? 'Groceries' : exp.category;
    categoryTotals[normCat] = (categoryTotals[normCat] || 0) + (Number(exp.amount) || 0);
  });

  // Top Spender & Top Category
  let topSpender: FamilyMember = familyMembers[0] || FAMILY_MEMBERS[0] || 'Aamir Khan';
  let maxSpent = 0;
  FAMILY_MEMBERS.forEach(m => {
    const amt = memberTotals[m]?.amount || 0;
    if (amt > maxSpent) {
      maxSpent = amt;
      topSpender = m;
    }
  });

  let topCategory = 'Groceries';
  let maxCatSpent = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > maxCatSpent) {
      maxCatSpent = amt;
      topCategory = cat;
    }
  });

  const handleSaveBudget = () => {
    const val = parseFloat(tempBudgetInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(val);
      setIsEditingBudget(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Primary KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Total Family Monthly Expense Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xs group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Total Family Monthly Expenses
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenChangeTotalExpensesModal}
                  className="py-1 px-2.5 bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900 border border-amber-300/80 dark:border-amber-800 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="Modify Total Family Monthly Expenses"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                  <span>Modify Expenses</span>
                </button>
                <span className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 rounded-xl font-black text-xs">
                  ₹ INR
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-center gap-2">
                <span>{formatINR(totalSpent)}</span>
                <button
                  type="button"
                  onClick={handleOpenChangeTotalExpensesModal}
                  className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  title="Modify Total Family Monthly Expenses"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {hasCustomTotalOverride && (
                <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 uppercase tracking-wider shrink-0">
                  Custom Total Set
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>
              {monthExpenses.length} entries in <strong className="text-slate-700 dark:text-slate-300">{selectedMonth}</strong> ({familyMembers.length} members)
            </span>
            {hasCustomTotalOverride ? (
              <button
                type="button"
                onClick={() => handleResetFamilyTotalOverride(selectedMonth)}
                className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer shrink-0"
              >
                Reset to Calculated
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenChangeTotalExpensesModal}
                className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer shrink-0"
              >
                View Breakdown
              </button>
            )}
          </div>
        </div>

        {/* Remaining Budget (Combined Member Bank Balances) Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xs group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Remaining Budget
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditAllBankBalancesModalOpen(true)}
                  className="py-1 px-2.5 bg-emerald-100/80 hover:bg-emerald-200/80 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300/80 dark:border-emerald-800 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="View & Edit Member Bank Account Balances"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                  <span>Edit Balances</span>
                </button>
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 rounded-xl font-black text-xs">
                  <Landmark className="w-5 h-5" />
                </span>
              </div>
            </div>

            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight flex items-center justify-between">
              <span>{formatINR(totalCombinedBankBalance)}</span>
              <button
                type="button"
                onClick={() => setIsEditAllBankBalancesModalOpen(true)}
                className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                title="Edit Member Bank Account Balances"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>
              Combined bank balance ({familyMembers.length} members)
            </span>
            <button
              type="button"
              onClick={() => setIsEditAllBankBalancesModalOpen(true)}
              className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Modify Balances
            </button>
          </div>
        </div>

        {/* Top Spending Highlights */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Spending Insights
            </span>
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 mt-1">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Top Spender</span>
              <span className="text-xs font-black text-slate-900 block truncate mt-0.5">{topSpender}</span>
              <span className="text-[11px] font-mono font-bold text-indigo-600">{formatINRCompact(maxSpent)}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Highest Category</span>
              <span className="text-xs font-black text-slate-900 block truncate mt-0.5">{topCategory}</span>
              <span className="text-[11px] font-mono font-bold text-amber-600">{formatINRCompact(maxCatSpent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly EMI Active Commitment Widget */}
      {emis.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg border border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Monthly Family EMI Commitment</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {emis.filter(e => e.status === 'active').length} Active Plans
                </span>
              </div>
              <p className="text-xs font-medium text-slate-300 mt-0.5">
                Total monthly EMI burden: <span className="font-mono font-black text-indigo-300">{formatINR(emis.filter(e => e.status === 'active').reduce((sum, e) => sum + e.emiAmount, 0))} / month</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('emis')}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Manage EMIs & Record Payment →
          </button>
        </div>
      )}

      {/* SIP & Mutual Funds Family Investment Widget */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0 font-black">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">SIP & Investment Portfolio</h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-extrabold border border-emerald-400/30">
                Bank Deducted
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-200/80 mt-0.5">
              Monthly wealth creation & mutual fund investments automatically deducted from member bank accounts
            </p>
            
            {/* Member SIP Breakdown Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {familyMembers.map((m) => {
                const memberSip = monthExpenses
                  .filter(exp => exp.paidBy === m && (exp.category as string) === 'SIP')
                  .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
                
                if (memberSip <= 0) return null;
                return (
                  <div key={m} className="px-2.5 py-1 bg-emerald-900/60 border border-emerald-700/60 rounded-xl text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                    <span>{m}:</span>
                    <span className="font-mono text-emerald-300 font-extrabold">{formatINR(memberSip)}</span>
                    <span className="text-[10px] text-emerald-400 font-normal">(Bank Deducted)</span>
                  </div>
                );
              })}
              {totalSipInvested === 0 && (
                <span className="text-xs text-slate-400 italic">No SIP investments logged yet for {selectedMonth}.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 border-t sm:border-t-0 border-emerald-800/60 pt-3 sm:pt-0 shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">Total SIP Invested</span>
            <span className="text-2xl font-black font-mono text-emerald-300">{formatINR(totalSipInvested)}</span>
          </div>
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log SIP Investment</span>
          </button>
        </div>
      </div>

      {/* Savings Goal Tracker */}
      {(() => {
        const savingsPercent = savingsTarget > 0 ? Math.min(Math.round((savingsCurrent / savingsTarget) * 100), 100) : 0;
        const remainingSavings = Math.max(savingsTarget - savingsCurrent, 0);

        return (
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-800/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <PiggyBank className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      {savingsTitle}
                    </h3>
                    <button
                      onClick={() => {
                        setEditTitleInput(savingsTitle);
                        setEditTargetInput(savingsTarget.toString());
                        setEditCurrentInput(savingsCurrent.toString());
                        setIsEditingGoal(!isEditingGoal);
                      }}
                      className="text-indigo-300 hover:text-white p-1 rounded-lg hover:bg-indigo-800/50 transition-colors cursor-pointer"
                      title="Edit Savings Goal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-indigo-200/80">
                    Shared Family Savings Target & Emergency Fund
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/80 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-extrabold text-indigo-100 font-mono">
                  {savingsPercent}% Achieved
                </span>
              </div>
            </div>

            {/* Inline Goal Editing Form */}
            {isEditingGoal ? (
              <div className="bg-indigo-950/90 border border-indigo-700/80 rounded-xl p-4 space-y-3">
                <div className="text-xs font-extrabold text-indigo-200 uppercase tracking-wider">
                  Update Savings Target & Funds
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Goal Name</label>
                    <input
                      type="text"
                      value={editTitleInput}
                      onChange={(e) => setEditTitleInput(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-700 text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                      placeholder="e.g. Vacation Fund"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Target Amount (₹)</label>
                    <input
                      type="number"
                      value={editTargetInput}
                      onChange={(e) => setEditTargetInput(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-700 text-white text-xs font-bold font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">Current Saved (₹)</label>
                    <input
                      type="number"
                      value={editCurrentInput}
                      onChange={(e) => setEditCurrentInput(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-700 text-white text-xs font-bold font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                      placeholder="38500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGoal}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow-sm"
                  >
                    Save Goal Settings
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Visual Progress Bar & KPI metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-3">
                    <span className="text-[10px] text-indigo-300 font-extrabold uppercase block">Current Savings</span>
                    <span className="text-lg font-black text-emerald-400 font-mono block mt-0.5">
                      {formatINR(savingsCurrent)}
                    </span>
                  </div>
                  <div className="bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-3">
                    <span className="text-[10px] text-indigo-300 font-extrabold uppercase block">Target Goal</span>
                    <span className="text-lg font-black text-indigo-100 font-mono block mt-0.5">
                      {formatINR(savingsTarget)}
                    </span>
                  </div>
                  <div className="bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-3">
                    <span className="text-[10px] text-indigo-300 font-extrabold uppercase block">Remaining to Save</span>
                    <span className="text-lg font-black text-amber-300 font-mono block mt-0.5">
                      {formatINR(remainingSavings)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-200">
                    <span>Progress Tracker</span>
                    <span>{formatINR(savingsCurrent)} / {formatINR(savingsTarget)}</span>
                  </div>
                  <div className="w-full bg-slate-950/80 h-4 rounded-full overflow-hidden p-0.5 border border-indigo-800/80">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: `${savingsPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quick Add Savings Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-200">Quick Deposit:</span>
                    {[500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleAddSavings(amt)}
                        className="px-2.5 py-1 bg-indigo-800/60 hover:bg-emerald-500 hover:text-slate-950 text-indigo-200 font-mono font-bold text-xs rounded-lg border border-indigo-700/60 transition-colors cursor-pointer"
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Add custom ₹"
                      value={quickAddInput}
                      onChange={(e) => setQuickAddInput(e.target.value)}
                      className="w-28 bg-slate-900 border border-indigo-700 text-white font-mono text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      onClick={() => {
                        const val = parseFloat(quickAddInput);
                        if (!isNaN(val) && val > 0) {
                          handleAddSavings(val);
                        }
                      }}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow-sm cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* 6-Month Spending Trends Recharts Line Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              6-Month Family Spending Trends (₹)
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Historical spending trajectory across the last 6 months
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setChartMode('total')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                chartMode === 'total'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total vs Budget
            </button>
            <button
              type="button"
              onClick={() => setChartMode('members')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                chartMode === 'members'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Member Breakdown
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }} 
              />
              
              {chartMode === 'total' ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="Total Expenses" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Budget" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false}
                  />
                </>
              ) : (
                FAMILY_MEMBERS.map((m) => (
                  <Line 
                    key={m}
                    type="monotone" 
                    dataKey={m} 
                    stroke={MEMBER_HEX_COLORS[m]} 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: MEMBER_HEX_COLORS[m], strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All-Data Pie Chart Analytics Section */}
      <PieChartSection
        expenses={expenses}
        selectedMonth={selectedMonth}
        emis={emis}
        memberBankAmounts={memberBankAmounts}
        familyMembers={familyMembers}
        activeMember={activeMember}
        memberConfigs={memberConfigs}
        language={language}
        onOpenAddExpense={onOpenAddExpense}
      />

      {/* Member Pending Bank Dues & Bank Accounts Section */}
      <div className="space-y-3.5 bg-emerald-50/70 dark:bg-slate-900/90 border border-emerald-200/90 dark:border-emerald-900/60 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Member Bank Accounts & Dues
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Track pending bank transfers and UPI account amounts for each family member
            </p>
          </div>

          {onOpenBankTransfer && (
            <button
              type="button"
              onClick={onOpenBankTransfer}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'hi' ? 'बैंक से बैंक ट्रांसफर' : 'Bank to Bank Transfer'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {familyMembers.map((member) => {
            const bankInfo = memberBankAmounts?.[member];
            const pendingAmt = bankInfo?.pendingBankAmount || 0;
            const mSpent = memberTotals[member]?.amount || 0;

            return (
              <div
                key={member}
                className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MemberAvatar member={member} memberConfigs={memberConfigs} size="sm" />
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {member}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                      pendingAmt > 0
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-100'
                    }`}>
                      {pendingAmt > 0 ? 'Active' : 'Zero'}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Bank Balance:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatINR(pendingAmt)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Month Spent:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatINR(mSpent)}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 font-medium">
                    <p className="truncate">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Bank:</span> {bankInfo?.bankName || 'SBI / GPay'}
                    </p>
                    {bankInfo?.upiId && (
                      <p className="truncate font-mono text-[10px] text-slate-400">
                        {bankInfo.upiId}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDashBankModal(member)}
                  className="w-full mt-2 py-1.5 px-2 font-black text-[11px] rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95"
                  title={`Modify bank balance for ${member}`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Modify Bank Amount</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown by Pre-Configured Family Members */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Expenses Breakdown by Pre-Defined Member
          </h2>
          <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1.5 self-start sm:self-auto">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Spent of this month restarts from ₹0 on 1st of every month</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {FAMILY_MEMBERS.map((member) => {
            const data = memberTotals[member] || { amount: 0, count: 0 };
            const percentOfTotal = totalSpent > 0 ? Math.round(((data.amount || 0) / totalSpent) * 100) : 0;
            const isActiveUser = member === activeMember;
            const theme = MEMBER_THEMES[member];

            // All-Time Total Spent for this member across all recorded expenses (or custom override)
            const allTimeMemberExps = expenses.filter((e) => e.paidBy === member);
            const calcAllTime = allTimeMemberExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            const customOverride = memberBankAmounts?.[member]?.customTotalSpentOverride;
            const allTimeSpent = (customOverride !== undefined && customOverride !== null && !isNaN(Number(customOverride)))
              ? Number(customOverride)
              : calcAllTime;

            return (
              <div
                key={member}
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between relative transition-all ${
                  isActiveUser
                    ? 'border-2 border-indigo-600 shadow-md ring-2 ring-indigo-100 scale-[1.02]'
                    : 'border-slate-100 hover:border-slate-200 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${theme.avatarBg}`}>
                      {theme.initials}
                    </div>
                    {isActiveUser && (
                      <span className="bg-indigo-100 text-indigo-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                        Active User
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-slate-900 text-sm truncate">{member}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="text-xl font-black text-red-600 dark:text-red-400 font-mono">
                      {formatINR(data.amount || 0)}
                    </div>
                    {onUpdateBankAmount && (
                      <button
                        type="button"
                        onClick={() => handleOpenMonthSpentDashModal(member, data.amount || 0)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title={`Modify Spent of this Month for ${member}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 block mt-0.5">
                    Spent of this month (Resets on 1st)
                  </span>

                  {/* Total Spent with Edit option */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600">
                      Total Spent:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black font-mono text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {formatINR(allTimeSpent)}
                      </span>
                      {onUpdateBankAmount && (
                        <button
                          type="button"
                          onClick={() => handleOpenTotalSpentDashModal(member, allTimeSpent)}
                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title={`Modify Total Spent for ${member}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>{data.count} month entries</span>
                    <span className="font-mono font-bold text-slate-900">{percentOfTotal}% share</span>
                  </div>

                  {/* Individual mini progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${theme.bg}`}
                      style={{ width: `${percentOfTotal}%` }}
                    ></div>
                  </div>

                  {/* View Monthly Records button */}
                  <button
                    type="button"
                    onClick={() => setViewingHistoryMember(member)}
                    className="w-full mt-1.5 py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-200 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Monthly Records</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Family Grocery Subsection */}
      {(() => {
        const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(selectedMonth));
        const groceryExps = monthExpenses.filter(e => e.category === 'Groceries' || (e.category as string) === 'Grocery');
        const totalGrocery = groceryExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const groceryPercentOfTotal = totalSpent > 0 ? Math.round((totalGrocery / totalSpent) * 100) : 0;

        // Sub-type breakdown
        const bulkRationSpent = groceryExps.filter(e => (e.notes || '').toLowerCase().includes('bulk') || (e.notes || '').toLowerCase().includes('ration')).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const kiranaSpent = groceryExps.filter(e => (e.notes || '').toLowerCase().includes('kirana') || (e.notes || '').toLowerCase().includes('spices')).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const veggiesSpent = groceryExps.filter(e => (e.notes || '').toLowerCase().includes('veggie') || (e.notes || '').toLowerCase().includes('fruit') || (e.notes || '').toLowerCase().includes('mandi') || (e.notes || '').toLowerCase().includes('milk') || (e.notes || '').toLowerCase().includes('dairy')).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        return (
          <div className={`bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl shadow-md border border-emerald-800/80 transition-all ${
            dashGroceryBoxSize === 'sm' ? 'p-2.5 space-y-2' : dashGroceryBoxSize === 'md' ? 'p-4 space-y-3' : 'p-5 space-y-4'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShoppingCart className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-white">
                      Family Grocery & Ration
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                      {formatINR(totalGrocery)} ({groceryPercentOfTotal}%)
                    </span>

                    {/* Resize Box Control */}
                    <div className="inline-flex items-center bg-slate-900/90 border border-emerald-800/80 rounded-md p-0.5 text-[9px] font-bold ml-1" title="Resize Grocery Subsection Box">
                      <span className="text-[8px] uppercase tracking-wider text-emerald-300 px-1 font-extrabold">Size:</span>
                      <button
                        type="button"
                        onClick={() => setDashGroceryBoxSize('sm')}
                        className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                          dashGroceryBoxSize === 'sm' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-300 hover:text-white'
                        }`}
                        title="Small Compact Box"
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashGroceryBoxSize('md')}
                        className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                          dashGroceryBoxSize === 'md' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-300 hover:text-white'
                        }`}
                        title="Medium Box"
                      >
                        M
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashGroceryBoxSize('lg')}
                        className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                          dashGroceryBoxSize === 'lg' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-300 hover:text-white'
                        }`}
                        title="Large Expanded Box"
                      >
                        L
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Breakdown Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="px-2.5 py-1 bg-slate-900/80 border border-emerald-800/60 rounded-xl font-bold text-emerald-300 flex items-center gap-1">
                  📦 Ration: <span className="font-mono text-white">{formatINR(bulkRationSpent)}</span>
                </span>
                <span className="px-2.5 py-1 bg-slate-900/80 border border-emerald-800/60 rounded-xl font-bold text-emerald-300 flex items-center gap-1">
                  🏪 Kirana: <span className="font-mono text-white">{formatINR(kiranaSpent)}</span>
                </span>
                <span className="px-2.5 py-1 bg-slate-900/80 border border-emerald-800/60 rounded-xl font-bold text-emerald-300 flex items-center gap-1">
                  🍏 Mandi/Dairy: <span className="font-mono text-white">{formatINR(veggiesSpent)}</span>
                </span>

                <button
                  type="button"
                  onClick={onOpenAddExpense}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Log Grocery</span>
                </button>
              </div>
            </div>

            {/* Logged Grocery Transactions List */}
            {groceryExps.length > 0 && (
              <div className="bg-slate-950/60 border border-emerald-800/60 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] border-b border-emerald-800/40 pb-1.5">
                  <span className="font-extrabold uppercase text-emerald-300 text-[10px] tracking-wider flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3 text-emerald-400" />
                    Logged Items ({groceryExps.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('transactions')}
                    className="text-emerald-300 hover:text-white font-bold text-[10px] flex items-center gap-0.5 cursor-pointer hover:underline"
                  >
                    <span>Full Log</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className={`overflow-y-auto space-y-1.5 pr-1 transition-all ${
                  dashGroceryBoxSize === 'sm' ? 'max-h-24' : dashGroceryBoxSize === 'md' ? 'max-h-44' : 'max-h-80'
                }`}>
                  {groceryExps.map((gExp) => {
                    const memTheme = MEMBER_THEMES[gExp.paidBy as FamilyMember];
                    return (
                      <div
                        key={gExp.id}
                        className="p-2.5 bg-slate-900/80 border border-emerald-900/60 rounded-xl flex items-center justify-between gap-2 text-xs hover:border-emerald-700/80 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg shrink-0 ${memTheme ? `${memTheme.badgeBg} ${memTheme.badgeText}` : 'bg-slate-800 text-slate-300'}`}>
                            {gExp.paidBy}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs truncate">
                              {gExp.notes || 'Grocery & Ration Expense'}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-emerald-200/60 font-mono mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                                {formatDateDisplay(gExp.date)}
                              </span>
                              {gExp.time && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-emerald-400" />
                                  {gExp.time}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black font-mono text-emerald-400 text-xs">
                            {formatINR(gExp.amount)}
                          </span>
                          <div className="flex items-center gap-1 border-l border-emerald-800/60 pl-1.5">
                            {onEditExpense && (
                              <button
                                type="button"
                                onClick={() => onEditExpense(gExp)}
                                className="p-1 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-lg transition-colors cursor-pointer"
                                title="Edit this grocery record"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteExpense && (
                              <button
                                type="button"
                                onClick={() => onDeleteExpense(gExp.id)}
                                className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Delete this grocery record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-800/40">
              <span className="text-emerald-200/90 font-medium">
                {groceryExps.length} grocery transaction {groceryExps.length === 1 ? 'record' : 'records'} logged in {selectedMonth}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('transactions')}
                className="text-emerald-300 hover:text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer hover:underline"
              >
                <span>View Full Grocery Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Category Breakdown & Bar Chart Visualiser */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visual Category Bars */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-600" />
              Spending by Expense Category
            </h3>
            <span className="text-xs text-slate-400 font-mono font-bold">
              {Object.keys(categoryTotals).length} Active Categories
            </span>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => {
              const spent = categoryTotals[cat.id] || 0;
              const catPercent = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;

              if (spent === 0) return null;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-extrabold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      {getCategoryLabel(cat.id, language)}
                    </span>
                    <span className="font-mono text-slate-900 font-black">
                      {formatINR(spent)} ({catPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${catPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {Object.keys(categoryTotals).length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No expenses logged for {selectedMonth} yet.
              </div>
            )}
          </div>
        </div>

        {/* Member Comparative Bar Visualizer */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Member Comparison Chart
            </h3>
            <button
              onClick={onOpenAddExpense}
              className="text-xs font-extrabold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {FAMILY_MEMBERS.map((m) => {
              const spent = memberTotals[m]?.amount || 0;
              const maxMemberSpent = Math.max(...FAMILY_MEMBERS.map(mem => memberTotals[mem]?.amount || 0), 1);
              const barWidthPercent = Math.round((spent / maxMemberSpent) * 100);
              const theme = MEMBER_THEMES[m];

              return (
                <div key={m} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-900 font-black flex items-center gap-1.5">
                      <span>{theme.emoji}</span>
                      {m}
                    </span>
                    <span className="font-mono text-slate-900 font-black">
                      {formatINR(spent)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${theme.bg}`}
                      style={{ width: `${barWidthPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Monthly PDF Summary Printable Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl printable-area border border-slate-200">
            
            {/* Modal Control Header (Hidden when printing via CSS) */}
            <div className="no-print bg-slate-900 text-white px-6 py-4 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-black text-white">Monthly PDF Summary Report</h2>
                  <p className="text-[11px] text-slate-300">Formatted financial statement for {selectedMonth}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF File</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Open Print Dialog"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Printable Body */}
            <div id="monthly-pdf-report-document" className="p-6 sm:p-10 space-y-8 bg-white text-slate-900 font-sans">
              
              {/* Report Document Header */}
              <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-widest mb-1">
                    <FileCheck className="w-4 h-4" /> Official Family Statement
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    Family Expense Tracker
                  </h1>
                  <p className="text-sm font-bold text-slate-600 mt-0.5">
                    Monthly Spending Summary
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-1.5 flex items-center gap-1">
                    🌈 𝕿𝖍𝖎𝖘 𝕬𝖕𝖕 𝖍𝖆𝖘 𝖇𝖊𝖊𝖓 𝕯𝖊𝖘𝖎𝖌𝖓𝖊𝖉 & 𝕮𝖗𝖆𝖋𝖙𝖊𝖉 𝖇𝖞 <span className="font-extrabold text-amber-900 tracking-wide underline decoration-amber-400">Aamir Khan</span> ✨
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-right space-y-1 font-mono text-xs shrink-0">
                  <div className="font-extrabold text-slate-900">
                    Month: <span className="text-amber-800">{selectedMonth}</span>
                  </div>
                  <div className="text-slate-500 font-medium">
                    Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-slate-500 font-medium">
                    Status: <span className="text-emerald-700 font-bold">Verified Audit</span>
                  </div>
                </div>
              </div>

              {/* Executive Overview KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Spent</span>
                  <span className="text-xl font-black text-slate-900 font-mono block mt-1">
                    {formatINR(totalSpent)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                    {monthExpenses.length} transactions logged
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Bank Balance</span>
                  <span className="text-xl font-black text-emerald-700 font-mono block mt-1">
                    {formatINR(totalCombinedBankBalance)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                    Sum of family bank balances
                  </span>
                </div>
              </div>

              {/* Family Member Spending Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>1. Family Member Spending Breakdown</span>
                  <span className="text-xs font-normal text-slate-500">5 Registered Members</span>
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Family Member</th>
                        <th className="py-2.5 px-4 text-center">Transactions</th>
                        <th className="py-2.5 px-4 text-right">Total Paid (₹)</th>
                        <th className="py-2.5 px-4 text-right">% Share of Month</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {FAMILY_MEMBERS.map((member) => {
                        const paid = memberTotals[member]?.amount || 0;
                        const count = memberTotals[member]?.count || 0;
                        const pct = totalSpent > 0 ? ((paid / totalSpent) * 100).toFixed(1) : '0';
                        const theme = MEMBER_THEMES[member];

                        return (
                          <tr key={member} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 font-extrabold text-slate-900 flex items-center gap-2">
                              <span>{theme.emoji}</span>
                              <span>{member}</span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-600">
                              {count}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                              {formatINR(paid)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-600">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Expenditure Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  2. Spending by Category
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4 text-right">Amount Spent (₹)</th>
                        <th className="py-2.5 px-4 text-right">% of Month</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(categoryTotals)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, amt]) => {
                          const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : '0';
                          return (
                            <tr key={cat} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-4 font-extrabold text-slate-900">
                                {cat}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                                {formatINR(amt)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-600">
                                {pct}%
                              </td>
                            </tr>
                          );
                        })}
                      {Object.keys(categoryTotals).length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400 font-medium">
                            No expenses recorded for this month.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Itemized Transaction Log */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>3. Itemized Transaction Log ({monthExpenses.length})</span>
                  <span className="text-xs font-normal text-slate-500 font-mono">Sorted by Date</span>
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Paid By</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-3">Notes / Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono text-slate-600 font-semibold whitespace-nowrap">
                            {formatDateDisplay(exp.date)}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                            {exp.paidBy}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {getCategoryLabel(exp.category, language)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                            {formatINR(exp.amount)}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-xs">
                            {exp.notes || '—'}
                          </td>
                        </tr>
                      ))}
                      {monthExpenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                            No transaction records found for {selectedMonth}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Monthly Family EMIs Commitment */}
              {emis && emis.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>5. Active Monthly Family EMIs ({emis.filter(e => e.status === 'active').length})</span>
                    <span className="text-xs font-normal text-slate-500 font-mono">
                      Monthly EMI Burden: {formatINR(emis.filter(e => e.status === 'active').reduce((sum, e) => sum + e.emiAmount, 0))}
                    </span>
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">EMI Plan Title</th>
                          <th className="py-2.5 px-3">Primary Payer</th>
                          <th className="py-2.5 px-3">Progress</th>
                          <th className="py-2.5 px-3 text-right">Monthly EMI (₹)</th>
                          <th className="py-2.5 px-3 text-right">Total Loan (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {emis.filter(e => e.status === 'active').map((emi) => (
                          <tr key={emi.id} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 font-extrabold text-slate-900">
                              {emi.title}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-700">
                              {emi.paidBy}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600 font-medium">
                              {emi.paidMonths} / {emi.tenureMonths} months ({Math.round((emi.paidMonths / emi.tenureMonths) * 100)}%)
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                              {formatINR(emi.emiAmount)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-medium text-slate-600">
                              {formatINR(emi.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Document Signoff Footer */}
              <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
                <div>
                  <p className="font-extrabold text-slate-900">Family Expense Tracker Application</p>
                  <p>Certified statement generated for personal offline archives.</p>
                  <p className="text-[11px] font-bold text-slate-700 mt-1">
                    🌈 𝕿𝖍𝖎𝖘 𝕬𝖕𝖕 𝖍𝖆𝖘 𝖇𝖊𝖊𝖓 𝕯𝖊𝖘𝖎𝖌𝖓𝖊𝖉 & 𝕮𝖗𝖆𝖋𝖙𝖊𝖉 𝖇𝖞 <span className="font-extrabold text-amber-900 tracking-wide underline decoration-amber-400">Aamir Khan</span> ✨
                  </p>
                </div>
                <div className="border border-slate-300 rounded-xl px-4 py-2 text-center font-mono text-[11px] text-slate-700 bg-slate-50">
                  <span className="font-bold uppercase tracking-wider block text-slate-900">Family Audit Stamp</span>
                  <span>{selectedMonth} • Verified</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
      {/* Dashboard Edit Pending Bank Amount Modal */}
      {editingDashBankMember && (() => {
        const currentBankAmt = memberBankAmounts?.[editingDashBankMember]?.pendingBankAmount || 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">
                      Increase Bank Amount: {editingDashBankMember}
                    </h3>
                    <p className="text-xs text-slate-400">Increase pending bank transfer amount & details</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingDashBankMember(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDashBankDetails} className="space-y-4 pt-4">
                {/* Current Bank Amount Card */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                      Current Bank Amount
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {formatINR(currentBankAmt)}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-900 dark:text-emerald-200 bg-emerald-200/80 dark:bg-emerald-900/80 px-2.5 py-1 rounded-xl">
                    Increase-Only Mode
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Bank amount can only be increased and cannot be decreased below current amount ({formatINR(currentBankAmt)}).</span>
                </div>

                {/* Input New Increased Bank Amount */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    New Increased Bank Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={currentBankAmt}
                    required
                    placeholder={`Minimum ${formatINR(currentBankAmt)}`}
                    value={dashBankAmount}
                    onChange={(e) => {
                      setDashBankAmount(e.target.value);
                      setDashBankError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-sm font-black font-mono border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Enter an amount greater than or equal to current {formatINR(currentBankAmt)}.
                  </p>
                </div>

                {/* Error Banner */}
                {dashBankError && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-bold">
                    ⚠️ {dashBankError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                      Bank / App Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SBI, HDFC, GPay"
                      value={dashBankName}
                      onChange={(e) => setDashBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                      UPI ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. amir@upi"
                      value={dashUpiId}
                      onChange={(e) => setDashUpiId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={dashStatus}
                    onChange={(e) => setDashStatus(e.target.value as 'pending' | 'received' | 'partially_settled')}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="pending">Pending Transfer</option>
                    <option value="partially_settled">Partially Paid</option>
                    <option value="received">Received / Active Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Transfer Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rent share pending bank transfer"
                    value={dashNotes}
                    onChange={(e) => setDashNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingDashBankMember(null)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                  >
                    Save Increased Amount
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Member Monthly Records History Modal */}
      {viewingHistoryMember && (() => {
        const memberExps = expenses.filter((e) => e.paidBy === viewingHistoryMember);
        const monthMap: Record<string, { monthKey: string; amount: number; count: number }> = {};
        let totalAllTime = 0;

        memberExps.forEach((exp) => {
          const monthKey = exp.date ? exp.date.substring(0, 7) : 'Unknown';
          const amt = Number(exp.amount) || 0;
          totalAllTime += amt;

          if (!monthMap[monthKey]) {
            monthMap[monthKey] = { monthKey, amount: 0, count: 0 };
          }
          monthMap[monthKey].amount += amt;
          monthMap[monthKey].count += 1;
        });

        const monthlyRecords = Object.values(monthMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
        const theme = MEMBER_THEMES[viewingHistoryMember];

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl p-6 shadow-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${theme.avatarBg}`}>
                    {theme.initials}
                  </div>
                  <div>
                    <h3 className="font-black text-base flex items-center gap-2">
                      {viewingHistoryMember}'s Monthly Records
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      All-time monthly spending history maintained till date
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingHistoryMember(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Total Summary Header */}
              <div className="my-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                    Total Spent Till Date
                  </span>
                  <span className="text-xl font-black font-mono text-indigo-900 dark:text-indigo-100">
                    {formatINR(totalAllTime)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Recorded Expenses
                  </span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">
                    {memberExps.length} entries
                  </span>
                </div>
              </div>

              {/* Month-wise Records Table */}
              <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Month-Wise Breakdown</span>
                  <span>Amount Spent</span>
                </div>

                {monthlyRecords.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">
                    No expense records found for {viewingHistoryMember} yet.
                  </div>
                ) : (
                  monthlyRecords.map((rec) => {
                    const isCurrentSelected = selectedMonth === rec.monthKey;

                    return (
                      <div
                        key={rec.monthKey}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrentSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-200 dark:ring-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {formatMonthName(rec.monthKey)}
                            </span>
                            {isCurrentSelected && (
                              <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded-md uppercase">
                                Active View
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                            {rec.count} {rec.count === 1 ? 'expense' : 'expenses'} recorded
                          </span>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="text-base font-black font-mono text-red-600 dark:text-red-400 block">
                              {formatINR(rec.amount)}
                            </span>
                          </div>

                          {!isCurrentSelected && (
                            <button
                              type="button"
                              onClick={() => {
                                onMonthChange(rec.monthKey);
                                setViewingHistoryMember(null);
                              }}
                              className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                              title={`Switch dashboard view to ${formatMonthName(rec.monthKey)}`}
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingHistoryMember(null)}
                  className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                >
                  Close Records
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modify Total Spent Modal for Dashboard */}
      {editingTotalSpentDashMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Modify Total Spent</h3>
                  <p className="text-xs text-slate-400 font-medium">Update total spent amount for {editingTotalSpentDashMember}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTotalSpentDashMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTotalSpentDash} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Custom Total Spent Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 15000"
                  value={inputTotalSpentDashAmount}
                  onChange={(e) => setInputTotalSpentDashAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl text-sm font-black font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  This modifies and overrides the displayed total spent amount for {editingTotalSpentDashMember} across the dashboard.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetTotalSpentDash}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 font-bold rounded-2xl text-xs cursor-pointer transition-colors"
                  title="Reset to calculated expense total from history"
                >
                  Reset Override
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTotalSpentDashMember(null)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  >
                    Save Total Spent
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Spent of This Month Modal for Dashboard */}
      {editingMonthSpentDashMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Modify Spent of This Month</h3>
                  <p className="text-xs text-slate-400 font-medium">Update monthly spent amount for {editingMonthSpentDashMember}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMonthSpentDashMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMonthSpentDash} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Custom Spent of This Month Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5000"
                  value={inputMonthSpentDashAmount}
                  onChange={(e) => setInputMonthSpentDashAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl text-sm font-black font-mono border focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  This overrides the displayed Spent of this month for {editingMonthSpentDashMember} across the dashboard and member cards.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetMonthSpentDash}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 font-bold rounded-2xl text-xs cursor-pointer transition-colors"
                  title="Reset to calculated expense sum for this month"
                >
                  Reset Override
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMonthSpentDashMember(null)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-xs shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
                  >
                    Save Spent of Month
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Total Family Expenses Amount Modal */}
      {isEditTotalExpensesModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl p-6 shadow-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Total Family Monthly Expenses</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Selected Month: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMonth}</span> • Monthly Total: <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{formatINR(totalSpent)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditTotalExpensesModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message Banner */}
            {totalEditSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{totalEditSuccessMsg}</span>
              </div>
            )}

            {/* Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mt-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTotalEditTab('override')}
                className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeTotalEditTab === 'override'
                    ? 'bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Set Direct Total
              </button>
              <button
                type="button"
                onClick={() => setActiveTotalEditTab('monthly')}
                className={`flex-1 min-w-[130px] py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeTotalEditTab === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Family Monthly Expenses
              </button>
              <button
                type="button"
                onClick={() => setActiveTotalEditTab('adjust')}
                className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeTotalEditTab === 'adjust'
                    ? 'bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                + / - Adjustment
              </button>
              <button
                type="button"
                onClick={() => setActiveTotalEditTab('list')}
                className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeTotalEditTab === 'list'
                    ? 'bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Edit Entries ({monthExpenses.length})
              </button>
            </div>

            {/* Tab 1: Direct Override */}
            {activeTotalEditTab === 'override' && (
              <form onSubmit={handleSaveDirectFamilyTotalOverride} className="space-y-4 pt-4">
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Direct Total Override
                  </p>
                  <p className="text-[11px] font-medium leading-relaxed opacity-90">
                    Directly updates the displayed Total Family Expenses for <strong>{selectedMonth}</strong> without altering historical transaction records.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Target Total Family Expense Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-amber-700 dark:text-amber-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={inputFamilyTotalAmount}
                      onChange={(e) => setInputFamilyTotalAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-2xl text-base font-black font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  <span>Calculated expense entries sum:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatINR(calculatedTotalSpent)}</span>
                </div>

                <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  {hasCustomTotalOverride ? (
                    <button
                      type="button"
                      onClick={handleResetDirectFamilyTotalOverride}
                      className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 font-bold rounded-2xl text-xs cursor-pointer transition-colors"
                    >
                      Reset Override
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditTotalExpensesModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-xs shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer"
                    >
                      Save Total Amount
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tab 2: Total Family Monthly Expenses */}
            {activeTotalEditTab === 'monthly' && (
              <div className="space-y-4 pt-4">
                {/* Summary Banner */}
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    Total Family Monthly Expenses Breakdown
                  </p>
                  <p className="text-[11px] font-medium leading-relaxed opacity-90">
                    Combined monthly expenses for <strong>{selectedMonth}</strong> across all {familyMembers.length} family members. Modifying a member's monthly expense updates their individual total and recalculates Total Family Expenses.
                  </p>
                </div>

                {/* Big Total Card */}
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-300/80 dark:border-amber-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                      Total Family Monthly Expenses ({selectedMonth})
                    </span>
                    <span className="text-2xl font-black font-mono text-amber-900 dark:text-amber-200">
                      {formatINR(sumFamilyMonthlyExpenses)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleSaveFamilyTotalOverride(selectedMonth, sumFamilyMonthlyExpenses);
                      setTotalEditSuccessMsg(`Set Total Family Expenses to Monthly Expenses sum (${formatINR(sumFamilyMonthlyExpenses)})!`);
                    }}
                    className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Sync Total Expense</span>
                  </button>
                </div>

                {/* Member List */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                    Family Member Monthly Expenses
                  </span>

                  <div className="space-y-2">
                    {familyMembers.map((member) => {
                      const mSpent = memberTotals[member]?.amount || 0;
                      const count = memberTotals[member]?.count || 0;
                      const hasOverride = memberBankAmounts?.[member]?.customMonthSpentOverride !== undefined;

                      return (
                        <div
                          key={member}
                          className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <MemberAvatar member={member} memberConfigs={memberConfigs} size="md" />
                            <div className="min-w-0">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate">
                                {member}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 block">
                                {formatINR(mSpent)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block truncate">
                                {count} logged entries • {hasOverride ? 'Custom Override Active' : 'Calculated from entries'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              handleOpenMonthSpentDashModal(member, mSpent);
                            }}
                            className="py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-200 font-black text-xs rounded-xl border border-amber-200 dark:border-amber-800 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Modify</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditTotalExpensesModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-2xl cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Adjustment Entry */}
            {activeTotalEditTab === 'adjust' && (
              <form onSubmit={handleAddAdjustmentEntry} className="space-y-4 pt-4">
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    Log Adjustment Entry
                  </p>
                  <p className="text-[11px] font-medium leading-relaxed opacity-90">
                    Adds an adjustment transaction record to automatically increase (+) or decrease (-) total family expenses.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Adjustment Type
                    </label>
                    <select
                      value={adjType}
                      onChange={(e) => setAdjType(e.target.value as 'add' | 'subtract')}
                      className="w-full px-3 py-2.5 rounded-2xl text-xs font-bold border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="add">+ Increase Total Expense</option>
                      <option value="subtract">- Decrease Total Expense (Credit/Discount)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full px-3.5 py-2 rounded-2xl text-sm font-black font-mono border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={adjCategory}
                      onChange={(e) => setAdjCategory(e.target.value as CategoryId)}
                      className="w-full px-3 py-2 rounded-2xl text-xs font-bold border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Paid By
                    </label>
                    <select
                      value={adjPaidBy}
                      onChange={(e) => setAdjPaidBy(e.target.value as FamilyMember)}
                      className="w-full px-3 py-2 rounded-2xl text-xs font-bold border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {familyMembers.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Note / Description
                  </label>
                  <input
                    type="text"
                    value={adjNotes}
                    onChange={(e) => setAdjNotes(e.target.value)}
                    placeholder="e.g. Monthly expense correction"
                    className="w-full px-3.5 py-2 rounded-2xl text-xs font-semibold border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditTotalExpensesModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  >
                    Add Adjustment Entry
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Quick Edit Individual Expense List */}
            {activeTotalEditTab === 'list' && (
              <div className="space-y-3 pt-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-between">
                  <span>Transactions logged for {selectedMonth}:</span>
                  <span className="font-black text-slate-900 dark:text-white">{monthExpenses.length} entries</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {monthExpenses.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                      No expense entries recorded for {selectedMonth}.
                    </div>
                  ) : (
                    monthExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 rounded-2xl border bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                              {getCategoryLabel(exp.category, language)}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {exp.paidBy}
                            </span>
                          </div>
                          {exp.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {exp.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {quickEditingExpenseId === exp.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                autoFocus
                                value={quickEditingAmount}
                                onChange={(e) => setQuickEditingAmount(e.target.value)}
                                className="w-24 px-2 py-1 text-xs font-black font-mono border border-amber-500 rounded-lg bg-white dark:bg-slate-900 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveQuickExpenseAmount(exp, quickEditingAmount)}
                                className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] hover:bg-emerald-700 cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickEditingExpenseId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-black font-mono text-slate-900 dark:text-white">
                                {formatINR(exp.amount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickEditingExpenseId(exp.id);
                                  setQuickEditingAmount(exp.amount.toString());
                                }}
                                className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Edit Amount"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteExpense && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteExpense(exp.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditTotalExpensesModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Administrator Permission Notice Modal */}
      {adminNoticeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Administrator Rights Required</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bank Details & Reminders Restricted</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminNoticeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-5 space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-medium">
                Only the <strong>Administrator ({ADMIN_MEMBER})</strong> has the permission to modify or edit the bank option, account details, and pending bank dues provided with each reminder.
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Currently active profile: <span className="font-bold text-slate-700 dark:text-slate-300">{activeMember}</span>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {onSelectMember && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectMember(ADMIN_MEMBER);
                    setAdminNoticeModalOpen(false);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Switch to {ADMIN_MEMBER} (Admin)
                </button>
              )}
              <button
                type="button"
                onClick={() => setAdminNoticeModalOpen(false)}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remaining Budget & All Family Members Bank Balances Modal */}
      {isEditAllBankBalancesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Remaining Budget & Member Bank Balances
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Combined bank balances across all family members
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditAllBankBalancesModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Combined Summary Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                Total Combined Remaining Budget
              </span>
              <div className="text-3xl font-black font-mono tracking-tight">
                {formatINR(totalCombinedBankBalance)}
              </div>
              <p className="text-xs text-emerald-100 font-medium pt-1">
                Sum of bank account balances across all {familyMembers.length} family members.
              </p>
            </div>

            {/* Member Balances Breakdown & Action List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Family Member Bank Balances
              </h4>

              <div className="space-y-2">
                {familyMembers.map((member) => {
                  const bankInfo = memberBankAmounts?.[member];
                  const pendingAmt = bankInfo?.pendingBankAmount || 0;

                  return (
                    <div
                      key={member}
                      className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MemberAvatar member={member} memberConfigs={memberConfigs} size="md" />
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate">
                            {member}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                            {formatINR(pendingAmt)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block truncate">
                            {bankInfo?.bankName || 'SBI / GPay'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenDashBankModal(member);
                        }}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modify</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditAllBankBalancesModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs rounded-2xl cursor-pointer hover:bg-slate-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
