import React, { useState, useEffect } from 'react';
import { FamilyMember, FAMILY_MEMBERS, MemberBankAmount, MemberCustomConfig, Expense } from '../types';
import { X, Landmark, Check, ArrowRightLeft, ShieldAlert, CheckCircle2, ArrowRight, Wallet, Calendar, FileText } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { MemberAvatar } from './MemberAvatar';
import { Language, t } from '../utils/translations';
import confetti from 'canvas-confetti';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
  memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
  onUpdateBankAmount?: (member: FamilyMember, updates: Partial<MemberBankAmount>) => Promise<void> | void;
  onSaveExpense?: (expenseData: Omit<Expense, 'id'>) => Promise<void>;
  activeMember?: FamilyMember;
  language?: Language;
  theme?: 'light' | 'dark';
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  isOpen,
  onClose,
  familyMembers = FAMILY_MEMBERS,
  memberConfigs,
  memberBankAmounts,
  onUpdateBankAmount,
  onSaveExpense,
  activeMember,
  language = 'en',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  const defaultFrom = activeMember && familyMembers.includes(activeMember) 
    ? activeMember 
    : familyMembers[0] || 'Aamir Khan';
  
  const defaultTo = familyMembers.find(m => m !== defaultFrom) || familyMembers[1] || 'Angrej Singh';

  const [fromMember, setFromMember] = useState<FamilyMember>(defaultFrom);
  const [toMember, setToMember] = useState<FamilyMember>(defaultTo);
  const [amount, setAmount] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [logTransaction, setLogTransaction] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFromMember(activeMember && familyMembers.includes(activeMember) ? activeMember : familyMembers[0]);
      const other = familyMembers.find(m => m !== (activeMember || familyMembers[0]));
      if (other) setToMember(other);
      setAmount('');
      setNotes('');
      setTransferDate(new Date().toISOString().split('T')[0]);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, activeMember, familyMembers]);

  if (!isOpen) return null;

  const fromBankData = memberBankAmounts?.[fromMember];
  const toBankData = memberBankAmounts?.[toMember];

  const fromBalance = fromBankData?.pendingBankAmount || 0;
  const toBalance = toBankData?.pendingBankAmount || 0;

  const fromBankName = fromBankData?.bankName || 'Bank Account';
  const toBankName = toBankData?.bankName || 'Bank Account';

  const numericAmount = parseFloat(amount) || 0;

  const handleQuickAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addVal).toString());
    setErrorMsg(null);
  };

  const handleMaxAmount = () => {
    setAmount(fromBalance.toString());
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fromMember === toMember) {
      setErrorMsg('Sender and receiver bank accounts must be different family members.');
      return;
    }

    if (numericAmount <= 0) {
      setErrorMsg('Please enter a valid transfer amount greater than ₹0.');
      return;
    }

    if (!onUpdateBankAmount) {
      setErrorMsg('Bank balance update handler is not configured.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate updated balances
      const updatedFromBalance = Math.max(0, fromBalance - numericAmount);
      const updatedToBalance = toBalance + numericAmount;

      // Update From Member Bank Balance
      await onUpdateBankAmount(fromMember, {
        pendingBankAmount: updatedFromBalance,
        lastUpdated: transferDate,
      });

      // Update To Member Bank Balance
      await onUpdateBankAmount(toMember, {
        pendingBankAmount: updatedToBalance,
        lastUpdated: transferDate,
      });

      // Optionally log as transaction entry in expenses
      if (logTransaction && onSaveExpense) {
        await onSaveExpense({
          amount: numericAmount,
          category: 'Others',
          paidBy: fromMember,
          date: transferDate,
          notes: `[Bank to Bank Transfer] ₹${numericAmount.toLocaleString('en-IN')} transferred from ${fromMember} (${fromBankName}) to ${toMember} (${toBankName})${notes.trim() ? ' - ' + notes.trim() : ''}`,
        });
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'],
        });
      } catch (err) {
        // ignore if confetti fails
      }

      setSuccessMsg(`Successfully transferred ${formatINR(numericAmount)} from ${fromMember} to ${toMember}!`);
      
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Bank to bank transfer failed:', err);
      setErrorMsg(err?.message || 'Failed to complete bank transfer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all transform ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-emerald-50/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ArrowRightLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                {language === 'hi' ? 'बैंक से बैंक ट्रांसफर' : 'Bank to Bank Transfer'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === 'hi' 
                  ? 'एक परिवार के सदस्य के बैंक खाते से दूसरे खाते में राशि भेजें'
                  : 'Transfer amount directly between family member bank accounts'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Transfer Flow Visualizer: From Bank -> To Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
            {/* Sender (From Bank) */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1.5">
                {language === 'hi' ? 'भेजने वाला बैंक (From)' : 'From Bank Account (Sender)'}
              </label>

              <select
                value={fromMember}
                onChange={(e) => {
                  const val = e.target.value;
                  setFromMember(val);
                  if (val === toMember) {
                    const alt = familyMembers.find(m => m !== val);
                    if (alt) setToMember(alt);
                  }
                }}
                className={`w-full p-2.5 rounded-xl border text-xs font-black transition-all ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-rose-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                }`}
              >
                {familyMembers.map((member) => (
                  <option key={member} value={member}>
                    {member} ({memberBankAmounts?.[member]?.bankName || 'Bank'})
                  </option>
                ))}
              </select>

              <div className="mt-2.5 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-500 dark:text-slate-400">Available:</span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                  {formatINR(fromBalance)}
                </span>
              </div>
            </div>

            {/* Receiver (To Bank) */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1.5">
                {language === 'hi' ? 'पाने वाला बैंक (To)' : 'To Bank Account (Receiver)'}
              </label>

              <select
                value={toMember}
                onChange={(e) => setToMember(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-black transition-all ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              >
                {familyMembers
                  .filter(m => m !== fromMember)
                  .map((member) => (
                    <option key={member} value={member}>
                      {member} ({memberBankAmounts?.[member]?.bankName || 'Bank'})
                    </option>
                  ))}
              </select>

              <div className="mt-2.5 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-500 dark:text-slate-400">Current:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {formatINR(toBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Transfer Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {language === 'hi' ? 'ट्रांसफर राशि (₹)' : 'Transfer Amount (₹)'}
              </label>
              {fromBalance > 0 && (
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Max ({formatINR(fromBalance)})
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-lg text-emerald-600 dark:text-emerald-400">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMsg(null);
                }}
                className={`w-full pl-9 pr-4 py-3 rounded-2xl text-xl font-black font-mono transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>

            {/* Quick Add Buttons */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {[500, 1000, 2000, 5000, 10000].map((quickVal) => (
                <button
                  key={quickVal}
                  type="button"
                  onClick={() => handleQuickAmount(quickVal)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  +₹{quickVal.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === 'hi' ? 'तारीख (Date)' : 'Transfer Date'}</span>
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'hi' ? 'विवरण / नोट्स' : 'Notes / UPI Ref'}</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rent share / GPay transfer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Log as Transaction checkbox */}
          {onSaveExpense && (
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
              <input
                type="checkbox"
                checked={logTransaction}
                onChange={(e) => setLogTransaction(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'hi' 
                  ? 'इस ट्रांसफर की एंट्री ट्रांजैक्शन इतिहास में दर्ज करें' 
                  : 'Log this transfer in transaction expense history'}
              </span>
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{language === 'hi' ? 'प्रोसेस हो रहा है...' : 'Transferring...'}</span>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'hi' ? 'ट्रांसफर कन्फर्म करें' : 'Confirm Bank Transfer'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
