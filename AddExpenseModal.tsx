import React, { useState, useEffect } from 'react';
import { Expense, FamilyMember, FAMILY_MEMBERS, CATEGORIES, CategoryId, MEMBER_THEMES, MemberCustomConfig, GROCERY_SUBTYPES, GrocerySubtype, CategorySubtype, CATEGORY_SUBTYPES_MAP } from '../types';
import { X, Plus, Sparkles, Landmark, ShoppingBag, Check, Settings2, TrendingUp, PiggyBank, Calendar, Clock, Pencil, Trash2, Edit3, RotateCcw, Maximize2, Minimize2, Scaling, ChevronRight, ChevronLeft, CheckCircle2, User, Search, Tag, Filter, ShoppingCart, CreditCard, Zap, HeartPulse, Fuel as FuelIcon, Home, Utensils, GraduationCap, Film, Package, MoreHorizontal, Plane, ShieldCheck, Wrench, Gift, Tv, Dumbbell, Dog, Baby, Briefcase } from 'lucide-react';
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

const getCategoryIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'ShoppingCart': return <ShoppingCart className="w-4 h-4" />;
    case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
    case 'CreditCard': return <CreditCard className="w-4 h-4" />;
    case 'Zap': return <Zap className="w-4 h-4" />;
    case 'HeartPulse': return <HeartPulse className="w-4 h-4" />;
    case 'Fuel': return <FuelIcon className="w-4 h-4" />;
    case 'Home': return <Home className="w-4 h-4" />;
    case 'Utensils': return <Utensils className="w-4 h-4" />;
    case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
    case 'ShoppingBag': return <ShoppingBag className="w-4 h-4" />;
    case 'Film': return <Film className="w-4 h-4" />;
    case 'Package': return <Package className="w-4 h-4" />;
    case 'Plane': return <Plane className="w-4 h-4" />;
    case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
    case 'Wrench': return <Wrench className="w-4 h-4" />;
    case 'Sparkles': return <Sparkles className="w-4 h-4" />;
    case 'Gift': return <Gift className="w-4 h-4" />;
    case 'Tv': return <Tv className="w-4 h-4" />;
    case 'Dumbbell': return <Dumbbell className="w-4 h-4" />;
    case 'Dog': return <Dog className="w-4 h-4" />;
    case 'Baby': return <Baby className="w-4 h-4" />;
    case 'Landmark': return <Landmark className="w-4 h-4" />;
    case 'Briefcase': return <Briefcase className="w-4 h-4" />;
    case 'PiggyBank': return <PiggyBank className="w-4 h-4" />;
    default: return <MoreHorizontal className="w-4 h-4" />;
  }
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
  const [paidBy, setPaidBy] = useState<FamilyMember>(activeMember);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(getCurrentTimeStr());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [groceryBoxSize, setGroceryBoxSize] = useState<'sm' | 'md' | 'lg'>('sm');
  const [grocerySearchQuery, setGrocerySearchQuery] = useState('');
  const [groceryFilterTab, setGroceryFilterTab] = useState<'all' | 'quick' | 'staples' | 'fresh' | 'store' | 'home'>('all');

  // Managed Category Subtypes Map state (supports custom options across ALL categories)
  const [categorySubtypesMap, setCategorySubtypesMap] = useState<Record<CategoryId, CategorySubtype[]>>(() => {
    const saved = localStorage.getItem('family_category_subtypes_map_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...CATEGORY_SUBTYPES_MAP, ...parsed };
        }
      } catch (e) {}
    }
    return CATEGORY_SUBTYPES_MAP;
  });

  const [editingSubtypeId, setEditingSubtypeId] = useState<string | null>(null);
  const [optionLabel, setOptionLabel] = useState('');
  const [optionEmoji, setOptionEmoji] = useState('🏷️');
  const [optionNotes, setOptionNotes] = useState('');
  const [isManagingOptions, setIsManagingOptions] = useState(false);

  const handleSaveCategorySubtype = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!optionLabel.trim()) return;

    const currentList = categorySubtypesMap[category] || [];
    let updatedList: CategorySubtype[];

    if (editingSubtypeId) {
      updatedList = currentList.map((item) =>
        item.id === editingSubtypeId
          ? {
              ...item,
              label: optionLabel.trim(),
              emoji: optionEmoji.trim() || '🏷️',
              defaultNotes: optionNotes.trim() || `${optionLabel.trim()} item type`,
            }
          : item
      );
    } else {
      const newItem: CategorySubtype = {
        id: `custom_${Date.now()}`,
        label: optionLabel.trim(),
        emoji: optionEmoji.trim() || '🏷️',
        defaultNotes: optionNotes.trim() || `${optionLabel.trim()} item type`,
        isCustom: true,
      };
      updatedList = [newItem, ...currentList];
    }

    const updatedMap = {
      ...categorySubtypesMap,
      [category]: updatedList,
    };

    setCategorySubtypesMap(updatedMap);
    localStorage.setItem('family_category_subtypes_map_v2', JSON.stringify(updatedMap));

    setEditingSubtypeId(null);
    setOptionLabel('');
    setOptionNotes('');
    setOptionEmoji('🏷️');
  };

  const startEditingSubtype = (sub: CategorySubtype) => {
    setEditingSubtypeId(sub.id);
    setOptionLabel(sub.label);
    setOptionEmoji(sub.emoji);
    setOptionNotes(sub.defaultNotes);
    setIsManagingOptions(true);
  };

  const handleDeleteCategorySubtype = (id: string) => {
    const currentList = categorySubtypesMap[category] || [];
    const updatedList = currentList.filter((item) => item.id !== id);
    const updatedMap = {
      ...categorySubtypesMap,
      [category]: updatedList,
    };
    setCategorySubtypesMap(updatedMap);
    localStorage.setItem('family_category_subtypes_map_v2', JSON.stringify(updatedMap));

    if (editingSubtypeId === id) {
      setEditingSubtypeId(null);
      setOptionLabel('');
      setOptionNotes('');
      setOptionEmoji('🏷️');
    }
  };

  const handleResetCategorySubtypes = () => {
    const defaultList = CATEGORY_SUBTYPES_MAP[category] || [];
    const updatedMap = {
      ...categorySubtypesMap,
      [category]: defaultList,
    };
    setCategorySubtypesMap(updatedMap);
    localStorage.setItem('family_category_subtypes_map_v2', JSON.stringify(updatedMap));
    setEditingSubtypeId(null);
    setOptionLabel('');
    setOptionNotes('');
    setOptionEmoji('🏷️');
  };

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      const rawCat = initialData.category === 'Grocery' ? 'Groceries' : initialData.category;
      setCategory(rawCat as CategoryId);
      setPaidBy(initialData.paidBy);
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTime(initialData.time || getCurrentTimeStr());
      setNotes(initialData.notes || '');
    } else {
      setAmount('');
      setCategory('Groceries');
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

    const finalCategory: CategoryId = category;

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

          {/* STEP 1: Expense Category & Amount */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-fade-in">
              {/* Category Grid Switcher */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Select Expense Category ({CATEGORIES.length} Categories)
                  </label>
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                    Selected: {getCategoryLabel(category, language)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id);
                        }}
                        className={`p-2 rounded-xl text-left text-xs font-black transition-all cursor-pointer flex items-center gap-2 border relative ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-400'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-indigo-50/70 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={`p-1 rounded-lg shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {getCategoryIconComponent(cat.icon)}
                        </div>
                        <div className="truncate min-w-0 flex-1">
                          <span className="truncate block leading-tight text-[11px]">{getCategoryLabel(cat.id, language)}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })}
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

          {/* STEP 3: Details & Notes / Subsections */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-fade-in">
              {/* Category Subsections & Quick Options Box */}
              <div className={`bg-gradient-to-br from-indigo-50/90 via-slate-50/50 to-indigo-100/60 dark:from-slate-950/80 dark:via-slate-900 dark:to-indigo-950/50 border border-indigo-200 dark:border-indigo-900/80 rounded-2xl transition-all shadow-sm ${
                groceryBoxSize === 'sm' ? 'p-2.5 space-y-2' : groceryBoxSize === 'md' ? 'p-3.5 space-y-3' : 'p-4 space-y-4'
              }`}>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-2xs">
                      {getCategoryIconComponent(CATEGORIES.find(c => c.id === category)?.icon || 'Tag')}
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200 block leading-none">
                        {getCategoryLabel(category, language)} Subsections & Options
                      </span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold">
                        Select options to auto-tag your expense description
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Box Size Toggle */}
                    <div className="inline-flex items-center bg-white/80 dark:bg-slate-800 rounded-lg p-0.5 text-[9px] font-extrabold border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                      {(['sm', 'md', 'lg'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setGroceryBoxSize(sz)}
                          className={`px-1.5 py-0.5 rounded uppercase transition-all cursor-pointer ${
                            groceryBoxSize === sz
                              ? 'bg-indigo-600 text-white font-black shadow-2xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-indigo-700'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsManagingOptions(!isManagingOptions);
                        if (editingSubtypeId) {
                          setEditingSubtypeId(null);
                          setOptionLabel('');
                          setOptionNotes('');
                          setOptionEmoji('🏷️');
                        }
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 rounded-lg text-[10px] font-black hover:bg-indigo-100/80 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Settings2 className="w-3 h-3 text-indigo-600" />
                      <span>{isManagingOptions ? 'Close Editor' : '✏️ Options Editor'}</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar & Clear Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder={`Search ${category} options...`}
                        value={grocerySearchQuery}
                        onChange={(e) => setGrocerySearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      {grocerySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setGrocerySearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-black p-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Clear Selected Tags */}
                    {(categorySubtypesMap[category] || []).some(sub => notes.includes(`[${sub.label}]`)) && (
                      <button
                        type="button"
                        onClick={() => {
                          let cleanedNotes = notes;
                          (categorySubtypesMap[category] || []).forEach(sub => {
                            cleanedNotes = cleanedNotes.replace(`[${sub.label}]`, '').replace(sub.defaultNotes, '');
                          });
                          setNotes(cleanedNotes.trim());
                        }}
                        className="px-2 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded-lg text-[10px] font-black hover:bg-rose-200 transition-colors shrink-0 cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Drawer for Custom Category Subtype */}
                {isManagingOptions && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border-2 border-indigo-400 dark:border-indigo-700 space-y-2 text-xs shadow-md animate-fade-in">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-1">
                        <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{editingSubtypeId ? `Edit ${category} Option:` : `Add Custom ${category} Option:`}</span>
                      </p>
                      <button
                        type="button"
                        onClick={handleResetCategorySubtypes}
                        className="text-[10px] text-slate-500 hover:text-indigo-700 underline font-extrabold flex items-center gap-0.5 cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Reset Category Defaults
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <input
                        type="text"
                        placeholder="Emoji"
                        value={optionEmoji}
                        onChange={(e) => setOptionEmoji(e.target.value)}
                        className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-black text-center text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option Name"
                        value={optionLabel}
                        onChange={(e) => setOptionLabel(e.target.value)}
                        className="col-span-3 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-black text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Default description notes (optional)"
                      value={optionNotes}
                      onChange={(e) => setOptionNotes(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white text-[11px]"
                    />

                    <div className="flex justify-end gap-1.5 pt-1">
                      {editingSubtypeId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubtypeId(null);
                            setOptionLabel('');
                            setOptionNotes('');
                            setOptionEmoji('🏷️');
                          }}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveCategorySubtype}
                        className="px-3 py-1 bg-indigo-600 text-white font-black rounded-lg text-xs hover:bg-indigo-700 cursor-pointer shadow-2xs"
                      >
                        <span>{editingSubtypeId ? 'Update Option' : '+ Save Custom Option'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Category Subtypes Grid */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 overflow-y-auto pr-1 transition-all ${
                  groceryBoxSize === 'sm' ? 'max-h-36' : groceryBoxSize === 'md' ? 'max-h-52' : 'max-h-72'
                }`}>
                  {(categorySubtypesMap[category] || [])
                    .filter((sub) => {
                      if (!grocerySearchQuery.trim()) return true;
                      const q = grocerySearchQuery.toLowerCase();
                      return sub.label.toLowerCase().includes(q) || sub.defaultNotes.toLowerCase().includes(q);
                    })
                    .map((sub) => {
                      const tag = `[${sub.label}]`;
                      const isMatch = notes.includes(tag) || notes.includes(sub.label);
                      return (
                        <div
                          key={sub.id}
                          className={`p-2 rounded-xl border text-left text-xs font-black transition-all flex items-center justify-between gap-1 group cursor-pointer ${
                            isMatch
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-400'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-indigo-200/80 dark:border-indigo-900 hover:bg-indigo-100/80 dark:hover:bg-slate-800'
                          }`}
                          onClick={() => {
                            if (notes.includes(tag)) {
                              setNotes(notes.replace(tag, '').trim());
                            } else {
                              setNotes(`${tag} ${sub.defaultNotes}`.trim());
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-base shrink-0">{sub.emoji}</span>
                            <div className="truncate min-w-0">
                              <span className="truncate block text-xs font-black leading-tight">
                                {sub.label}
                              </span>
                              <span className={`text-[9.5px] block truncate font-medium ${
                                isMatch ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                {sub.defaultNotes}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isMatch && (
                              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                            )}

                            {isManagingOptions && (
                              <div className="flex items-center gap-0.5 border-l border-indigo-300 dark:border-indigo-700 pl-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => startEditingSubtype(sub)}
                                  className="p-1 hover:text-indigo-200 cursor-pointer"
                                  title="Edit option"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategorySubtype(sub.id)}
                                  className="p-1 hover:text-rose-300 cursor-pointer"
                                  title="Delete option"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

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
