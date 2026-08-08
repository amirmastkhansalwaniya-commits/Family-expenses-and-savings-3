import React, { useState, useEffect } from 'react';
import { Expense, FamilyMember, FAMILY_MEMBERS, CATEGORIES, CategoryId, MEMBER_THEMES, MemberCustomConfig, GROCERY_SUBTYPES, GrocerySubtype } from '../types';
import { X, Plus, Sparkles, Landmark, ShoppingBag, Check, Settings2, TrendingUp, PiggyBank, Calendar, Clock, Pencil, Trash2, Edit3, RotateCcw, Maximize2, Minimize2, Scaling, ChevronRight, ChevronLeft, CheckCircle2, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, t, getCategoryLabel } from '../utils/translations';
import { MemberAvatar } from './MemberAvatar';

const POPULAR_SIP_FUNDS = [
  { label: 'HDFC Flexi Cap Fund', emoji: '📈', defaultNotes: '[SIP] Monthly HDFC Flexi Cap Mutual Fund Investment' },
  { label: 'SBI Nifty 50 Index', emoji: '🏦', defaultNotes: '[SIP] Monthly SBI Nifty 50 Index Fund Investment' },
  { label: 'PPF Monthly Savings', emoji: '🛡️', defaultNotes: '[SIP] Public Provident Fund (PPF) Monthly Savings' },
  { label: 'Parag Parikh Flexi Cap', emoji: '🌐', defaultNotes: '[SIP] Parag Parikh Flexi Cap Fund Investment' },
  { label: 'Nippon India Small Cap', emoji: '🚀', defaultNotes: '[SIP] Nippon India Small Cap Fund Investment' },
  { label: 'Zerodha Coin SIP', emoji: '📊', defaultNotes: '[SIP] Zerodha Direct Mutual Fund SIP' },
  { label: 'SGB / Gold ETF SIP', emoji: '🥇', defaultNotes: '[SIP] Sovereign Gold Bond / Gold ETF Investment' },
  { label: 'UTI Nifty 50 Index', emoji: '💼', defaultNotes: '[SIP] UTI Nifty 50 Index Fund Investment' },
];

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expenseData: Omit<Expense, 'id'>) => Promise<void>;
  activeMember: FamilyMember;
  initialData?: Expense | null;
  language?: Language;
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
}

const getCurrentTimeStr = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  activeMember,
  initialData,
  language = 'en',
  familyMembers = FAMILY_MEMBERS,
  memberConfigs,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<CategoryId>('Groceries');
  const [expenseType, setExpenseType] = useState<'grocery' | 'sip'>('grocery');
  const [paidBy, setPaidBy] = useState<FamilyMember>(activeMember);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(getCurrentTimeStr());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [groceryBoxSize, setGroceryBoxSize] = useState<'sm' | 'md' | 'lg'>('sm');

  // Managed Grocery Subtypes state (supports Edit and Delete for any option)
  const [grocerySubtypesList, setGrocerySubtypesList] = useState<GrocerySubtype[]>(() => {
    const saved = localStorage.getItem('family_grocery_subtypes_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return GROCERY_SUBTYPES;
  });

  const [editingSubtypeId, setEditingSubtypeId] = useState<string | null>(null);
  const [optionLabel, setOptionLabel] = useState('');
  const [optionEmoji, setOptionEmoji] = useState('🛒');
  const [optionNotes, setOptionNotes] = useState('');
  const [isManagingOptions, setIsManagingOptions] = useState(false);

  const handleSaveGrocerySubtype = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!optionLabel.trim()) return;

    if (editingSubtypeId) {
      // Edit existing option
      const updated = grocerySubtypesList.map((sub) =>
        sub.id === editingSubtypeId
          ? {
              ...sub,
              label: optionLabel.trim(),
              emoji: optionEmoji.trim() || '🛒',
              defaultNotes: optionNotes.trim() || `${optionLabel.trim()} item type`,
            }
          : sub
      );
      setGrocerySubtypesList(updated);
      localStorage.setItem('family_grocery_subtypes_v3', JSON.stringify(updated));
      setEditingSubtypeId(null);
    } else {
      // Add new custom option
      const newSub: GrocerySubtype = {
        id: `custom_${Date.now()}`,
        label: optionLabel.trim(),
        emoji: optionEmoji.trim() || '🛒',
        defaultNotes: optionNotes.trim() || `${optionLabel.trim()} item type`,
        isCustom: true,
      };
      const updated = [...grocerySubtypesList, newSub];
      setGrocerySubtypesList(updated);
      localStorage.setItem('family_grocery_subtypes_v3', JSON.stringify(updated));
    }

    setOptionLabel('');
    setOptionNotes('');
    setOptionEmoji('🛒');
  };

  const startEditingSubtype = (sub: GrocerySubtype) => {
    setEditingSubtypeId(sub.id);
    setOptionLabel(sub.label);
    setOptionEmoji(sub.emoji);
    setOptionNotes(sub.defaultNotes);
    setIsManagingOptions(true);
  };

  const handleDeleteGrocerySubtype = (id: string) => {
    const updated = grocerySubtypesList.filter((s) => s.id !== id);
    setGrocerySubtypesList(updated);
    localStorage.setItem('family_grocery_subtypes_v3', JSON.stringify(updated));
    if (editingSubtypeId === id) {
      setEditingSubtypeId(null);
      setOptionLabel('');
      setOptionNotes('');
      setOptionEmoji('🛒');
    }
  };

  const handleResetDefaultGrocerySubtypes = () => {
    setGrocerySubtypesList(GROCERY_SUBTYPES);
    localStorage.setItem('family_grocery_subtypes_v3', JSON.stringify(GROCERY_SUBTYPES));
    setEditingSubtypeId(null);
    setOptionLabel('');
    setOptionNotes('');
    setOptionEmoji('🛒');
  };

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      const rawCat = initialData.category === 'Grocery' ? 'Groceries' : initialData.category;
      setCategory(rawCat as CategoryId);
      if (rawCat === 'SIP') {
        setExpenseType('sip');
      } else {
        setExpenseType('grocery');
      }
      setPaidBy(initialData.paidBy);
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTime(initialData.time || getCurrentTimeStr());
      setNotes(initialData.notes || '');
    } else {
      setAmount('');
      setCategory('Groceries');
      setExpenseType('grocery');
      setPaidBy(activeMember);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(getCurrentTimeStr());
      setNotes('');
    }
    setCurrentStep(1);
    setErrorMessage(null);
  }, [initialData, activeMember, isOpen]);

  // Lock background screen scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateStep1 = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid expense amount (₹)');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep2 = () => {
    if (!paidBy) {
      setErrorMessage('Please select who paid for this expense');
      return false;
    }
    if (!date) {
      setErrorMessage('Please select a valid date');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleQuickAddAmount = (addVal: number) => {
    const currentVal = parseFloat(amount) || 0;
    setAmount((currentVal + addVal).toString());
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setCurrentStep(1);
      setErrorMessage('Please enter a valid expense amount in ₹ (INR)');
      return;
    }

    if (!paidBy) {
      setCurrentStep(2);
      setErrorMessage('Please select who paid for this expense');
      return;
    }

    const finalCategory: CategoryId = expenseType === 'grocery' ? 'Groceries' : expenseType === 'sip' ? 'SIP' : category;

    setIsSubmitting(true);
    try {
      await onSaveExpense({
        amount: parsedAmount,
        category: finalCategory,
        paidBy,
        date,
        time,
        notes: notes.trim(),
        addedByMember: activeMember,
      });

      // Confetti effect for instant feedback
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#d97706', '#10b981', '#ec4899'],
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overscroll-none touch-pan-y"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full ${
          modalSize === 'sm' ? 'max-w-xs' : modalSize === 'md' ? 'max-w-md' : 'max-w-xl'
        } overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 flex items-center justify-center shrink-0 shadow-2xs font-bold">
              {currentStep === 1 ? '1' : currentStep === 2 ? '2' : '3'}
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900 dark:text-white">
                {initialData ? t('editExpenseTitle', language) : t('logExpenseTitle', language)}
              </h2>
              <p className="text-[9.5px] font-bold text-slate-400 leading-tight">
                Step {currentStep} of 3: {currentStep === 1 ? 'Amount & Type' : currentStep === 2 ? 'Who Paid & Date' : 'Category & Details'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Box Size Toggle */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-lg p-0.5 text-[9px] font-black border border-slate-300/50 dark:border-slate-700" title="Option to resize box size">
              <button
                type="button"
                onClick={() => setModalSize('sm')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  modalSize === 'sm'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                S
              </button>
              <button
                type="button"
                onClick={() => setModalSize('md')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  modalSize === 'md'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => setModalSize('lg')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  modalSize === 'lg'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                L
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Step Wizard Navigation Bar */}
        <div className="px-3 py-2 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                currentStep === 1
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : currentStep > 1
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[9px] flex items-center justify-center font-bold">1</span>}
              <span className="truncate">1. Amount</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                currentStep === 2
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : currentStep > 2
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[9px] flex items-center justify-center font-bold">2</span>}
              <span className="truncate">2. Payer & Date</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) setCurrentStep(3);
              }}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                currentStep === 3
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-500'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[9px] flex items-center justify-center font-bold">3</span>
              <span className="truncate">3. Details & Save</span>
            </button>
          </div>
        </div>

        {/* Form Body - Wizard Steps */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-3 overflow-y-auto flex-1 overscroll-contain touch-pan-y">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold flex items-center justify-between animate-fade-in">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 p-0.5 hover:text-rose-800">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* STEP 1: Expense Type & Amount */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-fade-in">
              {/* Type Switcher */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Expense Category Type
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setExpenseType('grocery');
                      setCategory('Groceries');
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      expenseType === 'grocery'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('groceryType', language)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExpenseType('sip');
                      setCategory('SIP');
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      expenseType === 'sip'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('sipType', language)}</span>
                  </button>
                </div>
              </div>

              {/* Amount Field with ₹ Symbol */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t('amountLabel', language)} (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-600 dark:text-indigo-400 font-black text-xl">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNextStep();
                      }
                    }}
                    autoFocus
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xl font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Quick Amount Suggestion Chips */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Quick Amount Add (₹)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[100, 500, 1000, 2000, 5000].map((addVal) => (
                    <button
                      key={addVal}
                      type="button"
                      onClick={() => handleQuickAddAmount(addVal)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      +₹{addVal}
                    </button>
                  ))}
                  {amount && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Step 2: Who Paid & Date</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Who Paid & Date / Time */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-fade-in">
              {/* Paid By Selection */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t('paidByLabel', language)} *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {familyMembers.map((member) => {
                    const isSelected = paidBy === member;
                    return (
                      <button
                        key={member}
                        type="button"
                        onClick={() => {
                          setPaidBy(member as FamilyMember);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-left text-xs font-black transition-all cursor-pointer justify-between ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-slate-800 border-2 border-emerald-600 text-slate-900 dark:text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MemberAvatar
                            member={member}
                            memberConfigs={memberConfigs}
                            size="xs"
                            isActive={isSelected}
                          />
                          <span className="truncate text-xs font-black">{member}</span>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" title={`${member} Selected`}></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time Selection */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    <span>{t('dateLabel', language)} *</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>Time *</span>
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Step 3: Details & Notes</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Details & Notes / Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-fade-in">
              {/* Popular SIP Mutual Funds Picker */}
              {expenseType === 'sip' && (
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Select Popular SIP / Mutual Fund Option:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {POPULAR_SIP_FUNDS.map((fund) => {
                      const isMatch = notes.includes(fund.label);
                      return (
                        <button
                          key={fund.label}
                          type="button"
                          onClick={() => {
                            setNotes(fund.defaultNotes);
                          }}
                          className={`p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isMatch
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100/60 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="text-sm shrink-0">{fund.emoji}</span>
                          <span className="truncate text-[11px]">{fund.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Family Grocery Options & Sub-Types Selector */}
              {expenseType === 'grocery' && (
                <div className={`bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl transition-all ${
                  groceryBoxSize === 'sm' ? 'p-2 space-y-1.5' : groceryBoxSize === 'md' ? 'p-3 space-y-2.5' : 'p-4 space-y-3.5'
                }`}>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        Grocery Subsection:
                      </span>

                      {/* Box Size Toggle */}
                      <div className="inline-flex items-center bg-emerald-200/70 dark:bg-emerald-900/80 rounded-md p-0.5 text-[9px] font-extrabold border border-emerald-300/60 dark:border-emerald-800" title="Option to resize Grocery Subsection box">
                        <button
                          type="button"
                          onClick={() => setGroceryBoxSize('sm')}
                          className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                            groceryBoxSize === 'sm' ? 'bg-emerald-700 text-white font-black shadow-2xs' : 'text-emerald-800 dark:text-emerald-200 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroceryBoxSize('md')}
                          className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                            groceryBoxSize === 'md' ? 'bg-emerald-700 text-white font-black shadow-2xs' : 'text-emerald-800 dark:text-emerald-200 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          M
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroceryBoxSize('lg')}
                          className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                            groceryBoxSize === 'lg' ? 'bg-emerald-700 text-white font-black shadow-2xs' : 'text-emerald-800 dark:text-emerald-200 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          L
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsManagingOptions(!isManagingOptions);
                        if (editingSubtypeId) {
                          setEditingSubtypeId(null);
                          setOptionLabel('');
                          setOptionNotes('');
                          setOptionEmoji('🛒');
                        }
                      }}
                      className="px-2 py-0.5 bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-lg text-[10px] font-black hover:bg-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Settings2 className="w-3 h-3" />
                      <span>{isManagingOptions ? 'Close Editor' : '✏️ Options'}</span>
                    </button>
                  </div>

                  {/* Add / Edit Grocery Item Type Form Drawer */}
                  {isManagingOptions && (
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-emerald-900 dark:text-emerald-200 text-[10px] flex items-center gap-1">
                          <Pencil className="w-3 h-3 text-emerald-600" />
                          <span>{editingSubtypeId ? 'Edit Option:' : 'Add New Option:'}</span>
                        </p>
                        <button
                          type="button"
                          onClick={handleResetDefaultGrocerySubtypes}
                          className="text-[10px] text-slate-500 hover:text-emerald-700 underline font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          Reset Defaults
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="Emoji"
                          value={optionEmoji}
                          onChange={(e) => setOptionEmoji(e.target.value)}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-center text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Option Name"
                          value={optionLabel}
                          onChange={(e) => setOptionLabel(e.target.value)}
                          className="col-span-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={handleSaveGrocerySubtype}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-black rounded-lg text-xs hover:bg-emerald-700 cursor-pointer"
                        >
                          <span>{editingSubtypeId ? 'Update' : '+ Save'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Subtype Pills Container */}
                  <div className={`flex flex-wrap gap-1.5 overflow-y-auto pr-1 transition-all ${
                    groceryBoxSize === 'sm' ? 'max-h-24' : groceryBoxSize === 'md' ? 'max-h-40' : 'max-h-60'
                  }`}>
                    {grocerySubtypesList.map((sub) => {
                      const tag = `[${sub.label}]`;
                      const isMatch = notes.includes(tag) || notes.includes(sub.label);
                      return (
                        <div
                          key={sub.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
                            isMatch
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100/80 dark:hover:bg-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (notes.includes(tag)) {
                                setNotes(notes.replace(tag, '').trim());
                              } else {
                                setNotes(`${tag} ${sub.defaultNotes}`.trim());
                              }
                            }}
                            className="cursor-pointer flex items-center gap-1"
                          >
                            <span className="text-xs">{sub.emoji}</span>
                            <span>{sub.label}</span>
                          </button>

                          {isManagingOptions && (
                            <div className="flex items-center gap-0.5 border-l border-emerald-300 dark:border-emerald-700 ml-1 pl-1">
                              <button
                                type="button"
                                onClick={() => startEditingSubtype(sub)}
                                className="p-0.5 hover:text-indigo-600 cursor-pointer"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGrocerySubtype(sub.id)}
                                className="p-0.5 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes Field */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Notes / Item Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Purchased monthly rations from Supermarket"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Quick Summary Card */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
                  Summary
                </span>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px]">Amount: </span>
                    <span className="font-black text-slate-900 dark:text-white">₹{parseFloat(amount || '0').toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px]">Paid By: </span>
                    <span className="font-black text-slate-900 dark:text-white">{paidBy}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-bold text-[10px]">Date & Time: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{date} at {time}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? t('syncing', language) : initialData ? t('updateExpense', language) : t('saveExpense', language)}</span>
                </button>
              </div>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};
