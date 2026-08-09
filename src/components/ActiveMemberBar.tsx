import React, { useState, useMemo } from 'react';
import { FamilyMember, FAMILY_MEMBERS, MEMBER_THEMES, MemberBankAmount, Expense, ADMIN_MEMBER, MemberCustomConfig, getMemberTheme, EmiPlan } from '../types';
import { CheckCircle2, Landmark, Edit2, X, Check, History, Calendar, ArrowRight, Lock, ShieldAlert, UserPlus, Users, Download, Wallet, ArrowRightLeft } from 'lucide-react';
import { formatINRCompact, formatINR, formatMonthName } from '../utils/formatters';
import { MemberAvatar } from './MemberAvatar';
import { exportMemberDataToCSV, exportMemberDataToJSON, exportMemberDataToPDF } from '../utils/exportImport';
import { Language, t } from '../utils/translations';

interface ActiveMemberBarProps {
  activeMember: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
  memberTotals: Record<FamilyMember, number>;
  allTimeMemberTotals?: Record<FamilyMember, number>;
  allExpenses?: Expense[];
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
  onUpdateBankAmount?: (member: FamilyMember, updates: Partial<MemberBankAmount>) => Promise<void> | void;
  theme?: 'light' | 'dark';
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
  onOpenManageMembers?: () => void;
  onOpenExportImport?: () => void;
  onOpenBankTransfer?: () => void;
  emis?: EmiPlan[];
  language?: Language;
}

export const ActiveMemberBar: React.FC<ActiveMemberBarProps> = ({
  activeMember,
  onSelectMember,
  memberTotals,
  allTimeMemberTotals,
  allExpenses = [],
  selectedMonth,
  onMonthChange,
  memberBankAmounts,
  onUpdateBankAmount,
  theme = 'light',
  familyMembers = FAMILY_MEMBERS,
  memberConfigs,
  onOpenManageMembers,
  onOpenExportImport,
  onOpenBankTransfer,
  emis = [],
  language = 'en',
}) => {
  const isDark = theme === 'dark';
  const isAdmin = activeMember === ADMIN_MEMBER;

  // Admin permission notice modal state
  const [adminNoticeModalOpen, setAdminNoticeModalOpen] = useState(false);

  // Bank Edit Modal State
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('0');
  const [inputBankName, setInputBankName] = useState<string>('');
  const [inputUpiId, setInputUpiId] = useState<string>('');
  const [inputNotes, setInputNotes] = useState<string>('');
  const [inputStatus, setInputStatus] = useState<'pending' | 'received' | 'partially_settled'>('pending');
  const [bankError, setBankError] = useState<string | null>(null);

  // Member Total Spent Edit Modal State
  const [editingTotalSpentMember, setEditingTotalSpentMember] = useState<FamilyMember | null>(null);
  const [inputTotalSpentAmount, setInputTotalSpentAmount] = useState<string>('0');

  // Member Month Spent Edit Modal State
  const [editingMonthSpentMember, setEditingMonthSpentMember] = useState<FamilyMember | null>(null);
  const [inputMonthSpentAmount, setInputMonthSpentAmount] = useState<string>('0');

  // Member History Modal State
  const [historyMember, setHistoryMember] = useState<FamilyMember | null>(null);

  const handleOpenBankModal = (member: FamilyMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // prevent switching active member if clicking edit
    const current = memberBankAmounts?.[member];
    const currentAmt = current?.pendingBankAmount || 0;
    setEditingMember(member);
    setInputAmount(currentAmt.toString());
    setInputBankName(current?.bankName || 'SBI / GPay');
    setInputUpiId(current?.upiId || '');
    setInputNotes(current?.notes || '');
    setInputStatus(current?.status || 'pending');
    setBankError(null);
  };

  const handleOpenTotalSpentModal = (member: FamilyMember, currentTotalSpent: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTotalSpentMember(member);
    setInputTotalSpentAmount(currentTotalSpent.toString());
  };

  const handleOpenMonthSpentModal = (member: FamilyMember, currentMonthSpent: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingMonthSpentMember(member);
    setInputMonthSpentAmount(currentMonthSpent.toString());
  };

  const handleOpenHistoryModal = (member: FamilyMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHistoryMember(member);
  };

  const handleSaveTotalSpent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTotalSpentMember || !onUpdateBankAmount) return;

    const parsed = parseFloat(inputTotalSpentAmount);
    const customOverride = isNaN(parsed) ? undefined : parsed;

    await onUpdateBankAmount(editingTotalSpentMember, {
      customTotalSpentOverride: customOverride,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingTotalSpentMember(null);
  };

  const handleResetTotalSpent = async () => {
    if (!editingTotalSpentMember || !onUpdateBankAmount) return;

    await onUpdateBankAmount(editingTotalSpentMember, {
      customTotalSpentOverride: undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingTotalSpentMember(null);
  };

  const handleSaveMonthSpent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonthSpentMember || !onUpdateBankAmount) return;

    const parsed = parseFloat(inputMonthSpentAmount);
    const customOverride = isNaN(parsed) ? undefined : parsed;

    await onUpdateBankAmount(editingMonthSpentMember, {
      customMonthSpentOverride: customOverride,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingMonthSpentMember(null);
  };

  const handleResetMonthSpent = async () => {
    if (!editingMonthSpentMember || !onUpdateBankAmount) return;

    await onUpdateBankAmount(editingMonthSpentMember, {
      customMonthSpentOverride: undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingMonthSpentMember(null);
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !onUpdateBankAmount) return;

    const currentBankAmt = memberBankAmounts?.[editingMember]?.pendingBankAmount || 0;
    const finalBankAmt = Math.max(0, parseFloat(inputAmount) || 0);

    if (finalBankAmt < currentBankAmt) {
      setBankError(`Bank account balance can only be increased (must be at least ₹${currentBankAmt.toLocaleString('en-IN')})`);
      return;
    }

    await onUpdateBankAmount(editingMember, {
      pendingBankAmount: finalBankAmt,
      bankName: inputBankName.trim() || 'Bank Transfer',
      upiId: inputUpiId.trim(),
      notes: inputNotes.trim(),
      status: inputStatus,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setEditingMember(null);
  };

  // Group member expenses by month
  const historyMemberData = useMemo(() => {
    if (!historyMember) return null;
    const memberExps = allExpenses.filter((e) => e.paidBy === historyMember);

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

    return {
      member: historyMember,
      totalAllTime,
      totalCount: memberExps.length,
      monthlyRecords,
    };
  }, [historyMember, allExpenses]);

  return (
    <div className={`border-b py-3.5 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/80 backdrop-blur-md border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              {t('memberProfiles', language)}
            </span>

            {onOpenBankTransfer && (
              <button
                type="button"
                onClick={onOpenBankTransfer}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  isDark
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Transfer money from one member bank account to another"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span>{language === 'hi' ? 'बैंक से बैंक ट्रांसफर' : 'Bank Transfer'}</span>
              </button>
            )}
          </div>

          <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 hidden sm:inline-flex items-center gap-1">
            <span>{t('restartsOnFirst', language)}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {familyMembers.map((member) => {
            const isActive = activeMember === member;
            const monthSpent = memberTotals[member] || 0;
            const allTimeSpent = allTimeMemberTotals ? (allTimeMemberTotals[member] || 0) : monthSpent;
            const bankData = memberBankAmounts?.[member];
            const pendingBank = bankData?.pendingBankAmount || 0;
            const memberSipMonth = allExpenses
              .filter(e => e.paidBy === member && (selectedMonth ? e.date?.startsWith(selectedMonth) : true) && (e.category as string) === 'SIP')
              .reduce((s, e) => s + (Number(e.amount) || 0), 0);

            return (
              <div
                key={member}
                onClick={() => onSelectMember(member)}
                className={`relative flex flex-col justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group ${
                  isActive
                    ? isDark
                      ? 'bg-slate-800 border-2 border-indigo-500 shadow-md shadow-indigo-950 ring-2 ring-indigo-900/50 scale-[1.02]'
                      : 'bg-white border-2 border-indigo-600 shadow-md shadow-indigo-100 ring-2 ring-indigo-100 scale-[1.02]'
                    : isDark
                      ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 hover:border-slate-700 shadow-2xs'
                      : 'bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <MemberAvatar
                      member={member}
                      memberConfigs={memberConfigs}
                      size="md"
                      isActive={isActive}
                      className="group-hover:scale-105 transition-transform"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-black truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {member}
                        </p>
                        {isActive && (
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        )}
                      </div>
                      
                      {/* Monthly Spent (Red) */}
                      <div className="flex items-center gap-1">
                        <p
                          className={`text-[10px] font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                          title="Spent of this month (restarts on 1st of every month)"
                        >
                          {t('spentThisMonth', language)}: <span className="font-black text-red-600 dark:text-red-400">{formatINR(monthSpent)}</span>
                        </p>
                        {onUpdateBankAmount && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenMonthSpentModal(member, monthSpent, e)}
                            className="p-0.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded transition-colors cursor-pointer shrink-0"
                            title={`Modify Spent of this month for ${member}`}
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* All-Time Total Spent with Modify Option */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className="text-[9px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 truncate"
                        title="Total amount spent by this member across all time"
                      >
                        {t('totalSpent', language)}: <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">{formatINR(allTimeSpent)}</span>
                      </span>

                      {onUpdateBankAmount && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenTotalSpentModal(member, allTimeSpent, e)}
                          className="p-0.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 rounded transition-colors cursor-pointer shrink-0"
                          title={`Modify Total Spent for ${member}`}
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={(e) => handleOpenHistoryModal(member, e)}
                        className="text-[9px] font-extrabold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5 cursor-pointer hover:underline"
                        title={`View monthly records for ${member}`}
                      >
                        <History className="w-2.5 h-2.5" />
                        <span>{t('records', language)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportMemberDataToPDF(member, allExpenses, memberBankAmounts?.[member], memberConfigs?.[member], emis);
                        }}
                        className="text-[9px] font-extrabold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-0.5 cursor-pointer hover:underline"
                        title={`Download ${member}'s official PDF statement`}
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportMemberDataToCSV(member, allExpenses, memberBankAmounts?.[member], memberConfigs?.[member], emis);
                        }}
                        className="text-[9px] font-extrabold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer hover:underline"
                        title={`Download ${member}'s expense data (CSV)`}
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={(e) => handleOpenBankModal(member, e)}
                    className="w-full inline-flex items-center justify-between text-[10px] font-black text-emerald-800 dark:text-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/90 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300/80 dark:border-emerald-800/80 px-2 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="Click to edit bank balance"
                  >
                    <span className="flex items-center gap-1">
                      <Landmark className="w-2.5 h-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Bank Balance: <strong className="font-mono">{formatINR(pendingBank)}</strong></span>
                    </span>
                    <Edit2 className="w-2.5 h-2.5 ml-1 opacity-70" />
                  </button>
                </div>

                {/* Member SIP Investment Badge */}
                {memberSipMonth > 0 && (
                  <div className="mt-1 pt-1 border-t border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-[9px] font-extrabold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1 truncate">
                      <span>📈</span> SIP: <strong className="font-mono text-emerald-700 dark:text-emerald-300">{formatINR(memberSipMonth)}</strong>
                    </span>
                    <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950 px-1 py-0.2 rounded font-normal text-emerald-700 dark:text-emerald-400">Deducted</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Monthly Records History Modal */}
      {historyMemberData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 shadow-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${MEMBER_THEMES[historyMemberData.member].avatarBg}`}>
                  {MEMBER_THEMES[historyMemberData.member].initials}
                </div>
                <div>
                  <h3 className="font-black text-base flex items-center gap-2">
                    {historyMemberData.member}'s Monthly Records
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    All-time monthly spending history maintained till date
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHistoryMember(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Summary Header */}
            <div className="my-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                  Total Spent Till Date
                </span>
                <span className="text-xl font-black font-mono text-indigo-900 dark:text-indigo-100">
                  {formatINR(historyMemberData.totalAllTime)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => exportMemberDataToPDF(
                    historyMemberData.member,
                    allExpenses,
                    memberBankAmounts?.[historyMemberData.member],
                    memberConfigs?.[historyMemberData.member],
                    emis
                  )}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  title={`Download ${historyMemberData.member}'s official PDF statement`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportMemberDataToCSV(
                    historyMemberData.member,
                    allExpenses,
                    memberBankAmounts?.[historyMemberData.member],
                    memberConfigs?.[historyMemberData.member],
                    emis
                  )}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  title={`Download ${historyMemberData.member}'s CSV statement`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportMemberDataToJSON(
                    historyMemberData.member,
                    allExpenses,
                    memberBankAmounts?.[historyMemberData.member],
                    memberConfigs?.[historyMemberData.member],
                    emis
                  )}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  title={`Download ${historyMemberData.member}'s full profile JSON backup`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>

            {/* Month-wise Records Table */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Month-Wise Breakdown</span>
                <span>Amount Spent</span>
              </div>

              {historyMemberData.monthlyRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  No expense records found for {historyMemberData.member} yet.
                </div>
              ) : (
                historyMemberData.monthlyRecords.map((rec) => {
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

                        {onMonthChange && !isCurrentSelected && (
                          <button
                            type="button"
                            onClick={() => {
                              onMonthChange(rec.monthKey);
                              setHistoryMember(null);
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
                onClick={() => setHistoryMember(null)}
                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
              >
                Close Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Edit Modal */}
      {editingMember && (() => {
        const currentBankAmt = memberBankAmounts?.[editingMember]?.pendingBankAmount || 0;

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base">Edit Bank Details: {editingMember}</h3>
                    <p className="text-xs text-slate-400 font-medium">Manage member bank account balance</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingMember(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBankDetails} className="space-y-4 pt-4">
                {/* Current Bank Balance & Increase-Only Rule Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                      Current Bank Balance
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
                  <span>Bank account balance can only be increased and cannot be decreased below current balance ({formatINR(currentBankAmt)}).</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                      New Bank Account Balance (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={currentBankAmt}
                      placeholder={`Minimum ${formatINR(currentBankAmt)}`}
                      value={inputAmount}
                      onChange={(e) => {
                        setInputAmount(e.target.value);
                        setBankError(null);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-black font-mono border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      Enter an amount greater than or equal to current {formatINR(currentBankAmt)}.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {bankError && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-bold">
                    ⚠️ {bankError}
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
                      value={inputBankName}
                      onChange={(e) => setInputBankName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                      UPI ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. amir@upi"
                      value={inputUpiId}
                      onChange={(e) => setInputUpiId(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={inputStatus}
                    onChange={(e) => setInputStatus(e.target.value as 'pending' | 'received' | 'partially_settled')}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
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
                    placeholder="e.g. House expense bank balance"
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                  >
                    Save & Sync Budget
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modify Total Spent Modal */}
      {editingTotalSpentMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Modify Total Spent</h3>
                  <p className="text-xs text-slate-400 font-medium">Update total spent amount for {editingTotalSpentMember}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTotalSpentMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTotalSpent} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Custom Total Spent Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 15000"
                  value={inputTotalSpentAmount}
                  onChange={(e) => setInputTotalSpentAmount(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-black font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  This overrides the displayed total spent amount for {editingTotalSpentMember} across the dashboard and member cards.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetTotalSpent}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 font-bold rounded-2xl text-xs cursor-pointer transition-colors"
                  title="Reset to calculated expense total from history"
                >
                  Reset Override
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTotalSpentMember(null)}
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

      {/* Modify Spent of This Month Modal */}
      {editingMonthSpentMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Modify Spent of This Month</h3>
                  <p className="text-xs text-slate-400 font-medium">Update monthly spent amount for {editingMonthSpentMember}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMonthSpentMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMonthSpent} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Custom Spent of This Month Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5000"
                  value={inputMonthSpentAmount}
                  onChange={(e) => setInputMonthSpentAmount(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-black font-mono border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  This overrides the displayed Spent of this month for {editingMonthSpentMember} across the dashboard and member cards.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetMonthSpent}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 font-bold rounded-2xl text-xs cursor-pointer transition-colors"
                  title="Reset to calculated expense sum for this month"
                >
                  Reset Override
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMonthSpentMember(null)}
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

      {/* Administrator Permission Notice Modal */}
      {adminNoticeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
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
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-5 space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-medium">
                Only the <strong>Administrator ({ADMIN_MEMBER})</strong> has the permission to modify or edit the bank option, account details, and pending dues provided with each reminder.
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Currently active profile: <span className="font-bold text-slate-700 dark:text-slate-300">{activeMember}</span>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
    </div>
  );
};
