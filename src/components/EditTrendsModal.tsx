import React, { useState } from 'react';
import { X, TrendingUp, Save, RotateCcw, Calendar, Users, DollarSign } from 'lucide-react';
import { formatINR, getLast6Months } from '../utils/formatters';
import { Language } from '../utils/translations';

interface EditTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  monthlyBudget: number;
  onUpdateBudget: (newBudget: number) => void;
  familyMembers: string[];
  familyTotalOverrides: Record<string, number>;
  onSaveFamilyTotalOverride: (monthKey: string, newTotal: number) => void;
  memberTrendOverrides: Record<string, Record<string, number>>;
  onSaveMemberTrendOverrides: (monthKey: string, memberAmounts: Record<string, number>) => void;
  onResetMonthOverride: (monthKey: string) => void;
  language?: Language;
}

export const EditTrendsModal: React.FC<EditTrendsModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  monthlyBudget,
  onUpdateBudget,
  familyMembers,
  familyTotalOverrides,
  onSaveFamilyTotalOverride,
  memberTrendOverrides,
  onSaveMemberTrendOverrides,
  onResetMonthOverride,
}) => {
  const last6Months = getLast6Months(selectedMonth);
  const [activeMonth, setActiveMonth] = useState<string>(selectedMonth);

  // Form states for the active month being edited
  const [tempBudget, setTempBudget] = useState<string>(monthlyBudget.toString());
  const [totalOverrideInput, setTotalOverrideInput] = useState<string>(
    familyTotalOverrides[selectedMonth] !== undefined
      ? familyTotalOverrides[selectedMonth].toString()
      : ''
  );

  const [memberInputs, setMemberInputs] = useState<Record<string, string>>(() => {
    const monthOverrides = memberTrendOverrides[selectedMonth] || {};
    const initial: Record<string, string> = {};
    familyMembers.forEach((m) => {
      initial[m] = monthOverrides[m] !== undefined ? monthOverrides[m].toString() : '';
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleSelectMonth = (mKey: string) => {
    setActiveMonth(mKey);
    setTotalOverrideInput(
      familyTotalOverrides[mKey] !== undefined ? familyTotalOverrides[mKey].toString() : ''
    );
    const monthOverrides = memberTrendOverrides[mKey] || {};
    const updated: Record<string, string> = {};
    familyMembers.forEach((m) => {
      updated[m] = monthOverrides[m] !== undefined ? monthOverrides[m].toString() : '';
    });
    setMemberInputs(updated);
  };

  const handleSaveActiveMonth = () => {
    // 1. Save Budget if changed
    const parsedBudget = parseFloat(tempBudget);
    if (!isNaN(parsedBudget) && parsedBudget > 0 && parsedBudget !== monthlyBudget) {
      onUpdateBudget(parsedBudget);
    }

    // 2. Save Total Override
    if (totalOverrideInput.trim() !== '') {
      const parsedTotal = parseFloat(totalOverrideInput);
      if (!isNaN(parsedTotal) && parsedTotal >= 0) {
        onSaveFamilyTotalOverride(activeMonth, parsedTotal);
      }
    }

    // 3. Save Member Overrides
    const newMemberAmounts: Record<string, number> = {};
    Object.entries(memberInputs).forEach(([m, rawVal]) => {
      const valStr = String(rawVal || '').trim();
      if (valStr !== '') {
        const val = parseFloat(valStr);
        if (!isNaN(val) && val >= 0) {
          newMemberAmounts[m] = val;
        }
      }
    });

    onSaveMemberTrendOverrides(activeMonth, newMemberAmounts);
    onClose();
  };

  const handleResetActiveMonth = () => {
    onResetMonthOverride(activeMonth);
    setTotalOverrideInput('');
    const updated: Record<string, string> = {};
    familyMembers.forEach((m) => {
      updated[m] = '';
    });
    setMemberInputs(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Edit 6-Month Spending Trends & Member Data</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Customize trend calculations, budget targets, and defined member amounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Selector Tabs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Select Month to Edit (Last 6 Months):
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {last6Months.map(({ yearMonth, label }) => {
              const isSelected = activeMonth === yearMonth;
              const hasOverride =
                familyTotalOverrides[yearMonth] !== undefined ||
                (memberTrendOverrides[yearMonth] &&
                  Object.keys(memberTrendOverrides[yearMonth]).length > 0);

              return (
                <button
                  key={yearMonth}
                  type="button"
                  onClick={() => handleSelectMonth(yearMonth)}
                  className={`px-3 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <span>{label}</span>
                  {hasOverride && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1" title="Has custom edits" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* Monthly Budget Setting */}
          <div className="bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Monthly Budget Target (₹):
            </label>
            <input
              type="number"
              value={tempBudget}
              onChange={(e) => setTempBudget(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 50000"
            />
            <p className="text-[11px] text-slate-500 font-medium">
              This budget reference line is rendered on the 6-month trends chart.
            </p>
          </div>

          {/* Family Total Spent Override for Selected Month */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Total Spent Override for {activeMonth} (₹):
            </label>
            <input
              type="number"
              value={totalOverrideInput}
              onChange={(e) => setTotalOverrideInput(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Leave blank to use auto-calculated total from expenses"
            />
            <p className="text-[11px] text-slate-400 font-medium">
              Override total spent for {activeMonth} on trend charts if offline or lump-sum records were logged.
            </p>
          </div>

          {/* Defined Member Trend Overrides */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              Defined Member Spending Overrides for {activeMonth}:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {familyMembers.map((m) => (
                <div key={m} className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">{m}</span>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-extrabold text-slate-400">₹</span>
                    <input
                      type="number"
                      value={memberInputs[m] || ''}
                      onChange={(e) =>
                        setMemberInputs({ ...memberInputs, [m]: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Calculated"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetActiveMonth}
            className="px-3.5 py-2 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset {activeMonth} Edits</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveActiveMonth}
              className="px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update Charts</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
