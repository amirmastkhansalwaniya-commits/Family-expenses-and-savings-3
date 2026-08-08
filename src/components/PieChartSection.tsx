import React, { useState, useMemo } from 'react';
import { 
  Expense, 
  FamilyMember, 
  FAMILY_MEMBERS, 
  CATEGORIES, 
  EmiPlan, 
  MemberBankAmount, 
  GROCERY_SUBTYPES,
  MemberCustomConfig,
  getMemberTheme
} from '../types';
import { formatINR, formatINRCompact, formatMonthName } from '../utils/formatters';
import { Language, getCategoryLabel } from '../utils/translations';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Sector
} from 'recharts';
import { 
  PieChart as PieChartIcon, 
  Grid, 
  Layers, 
  ShoppingCart, 
  UserCheck, 
  CreditCard, 
  Landmark, 
  Package, 
  Plus, 
  Calendar, 
  TrendingUp,
  Info,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface PieChartSectionProps {
  expenses: Expense[];
  selectedMonth: string;
  emis?: EmiPlan[];
  memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
  familyMembers?: string[];
  activeMember?: FamilyMember;
  memberConfigs?: Record<string, MemberCustomConfig>;
  language?: Language;
  onOpenAddExpense?: () => void;
}

export type PieDataType = 'category' | 'member' | 'emi' | 'bank' | 'grocery' | 'all';

// Color Palette for Category Slices
const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#10b981', // Emerald
  SIP: '#059669',       // Teal
  EMI: '#6366f1',       // Indigo
  Utilities: '#f59e0b', // Amber
  Medical: '#f43f5e',   // Rose
  Fuel: '#3b82f6',      // Blue
  Rent: '#4f46e5',      // Deep Indigo
  Dining: '#f97316',    // Orange
  Education: '#a855f7', // Purple
  Shopping: '#ec4899',  // Pink
  Entertainment: '#06b6d4', // Cyan
  Household: '#14b8a6', // Teal
  Others: '#64748b',    // Slate
};

// Fallback palette for dynamic slices
const VIBRANT_PALETTE = [
  '#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6',
  '#a855f7', '#f97316', '#06b6d4', '#f43f5e', '#14b8a6',
  '#84cc16', '#8b5cf6', '#d97706', '#0284c7', '#e11d48'
];

// Custom Active Shape Renderer for hover focus
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, percent } = props;

  return (
    <g>
      <text x={cx} y={cy - 12} dy={8} textAnchor="middle" fill="#0f172a" className="font-extrabold text-xs">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} dy={8} textAnchor="middle" fill={fill} className="font-black text-sm font-mono">
        {formatINR(value)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

// Custom Pie Tooltip
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.payload.color || data.color;
    const countText = data.payload.count !== undefined ? `${data.payload.count} records` : null;

    return (
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-3.5 shadow-2xl text-xs space-y-1.5 font-sans min-w-44 z-50">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5 font-bold text-slate-200">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="truncate">{data.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-mono">
          <span className="text-slate-400 font-semibold">Amount:</span>
          <span className="font-black text-emerald-400">{formatINR(data.value)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-mono">
          <span className="text-slate-400 font-semibold">Share:</span>
          <span className="font-black text-amber-400">{(data.payload.percent * 100).toFixed(1)}%</span>
        </div>
        {countText && (
          <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/80">
            <span>Volume:</span>
            <span>{countText}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const PieChartSection: React.FC<PieChartSectionProps> = ({
  expenses,
  selectedMonth,
  emis = [],
  memberBankAmounts,
  familyMembers = FAMILY_MEMBERS,
  memberConfigs,
  language = 'en',
  onOpenAddExpense,
}) => {
  const [activeTab, setActiveTab] = useState<PieDataType>('category');
  const [timeScope, setTimeScope] = useState<'month' | 'all'>('month');
  const [chartStyle, setChartStyle] = useState<'donut' | 'pie'>('donut');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [selectedSlice, setSelectedSlice] = useState<any | null>(null);

  // Filter expenses based on month vs all-time
  const filteredExpenses = useMemo(() => {
    if (timeScope === 'month') {
      return expenses.filter((e) => e.date && e.date.startsWith(selectedMonth));
    }
    return expenses;
  }, [expenses, selectedMonth, timeScope]);

  // 1. CATEGORY PIE DATA
  const categoryData = useMemo(() => {
    const totals: Record<string, { amount: number; count: number }> = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Others';
      if (!totals[cat]) totals[cat] = { amount: 0, count: 0 };
      totals[cat].amount += Number(e.amount) || 0;
      totals[cat].count += 1;
    });

    const grandTotal = Object.values(totals).reduce((sum, item) => sum + item.amount, 0);

    return Object.entries(totals)
      .map(([cat, data], idx) => ({
        name: getCategoryLabel(cat, language),
        rawCategory: cat,
        value: data.amount,
        count: data.count,
        percent: grandTotal > 0 ? data.amount / grandTotal : 0,
        color: CATEGORY_COLORS[cat] || VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, language]);

  // 2. MEMBER PIE DATA
  const memberData = useMemo(() => {
    const totals: Record<string, { amount: number; count: number }> = {};
    familyMembers.forEach((m) => {
      totals[m] = { amount: 0, count: 0 };
    });

    filteredExpenses.forEach((e) => {
      const m = e.paidBy || familyMembers[0] || 'Member';
      if (!totals[m]) totals[m] = { amount: 0, count: 0 };
      totals[m].amount += Number(e.amount) || 0;
      totals[m].count += 1;
    });

    const grandTotal = Object.values(totals).reduce((sum, item) => sum + item.amount, 0);

    return Object.entries(totals)
      .map(([m, data], idx) => {
        const theme = getMemberTheme(m, memberConfigs);
        return {
          name: m,
          value: data.amount,
          count: data.count,
          percent: grandTotal > 0 ? data.amount / grandTotal : 0,
          emoji: theme.emoji,
          color: VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length],
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, familyMembers, memberConfigs]);

  // 3. EMI LOANS PIE DATA
  const emiData = useMemo(() => {
    const activeEmis = emis.filter((e) => e.status === 'active' || e.status === undefined);
    const grandTotal = activeEmis.reduce((sum, e) => sum + (e.emiAmount || 0), 0);

    return activeEmis
      .map((e, idx) => ({
        name: e.title,
        value: e.emiAmount || 0,
        totalPrincipal: e.totalAmount || 0,
        paidBy: e.paidBy,
        percent: grandTotal > 0 ? (e.emiAmount || 0) / grandTotal : 0,
        color: VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [emis]);

  // 4. BANK BALANCES PIE DATA
  const bankData = useMemo(() => {
    if (!memberBankAmounts) return [];
    const bankEntries = Object.entries(memberBankAmounts) as [string, MemberBankAmount][];
    const grandTotal = bankEntries.reduce((sum, [, b]) => sum + (b?.pendingBankAmount || 0), 0);

    return bankEntries
      .map(([m, b], idx) => ({
        name: `${m} (${b?.bankName || 'Bank'})`,
        value: b?.pendingBankAmount || 0,
        member: m,
        bankName: b?.bankName,
        percent: grandTotal > 0 ? (b?.pendingBankAmount || 0) / grandTotal : 0,
        color: VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [memberBankAmounts]);

  // 5. GROCERY SUBTYPES PIE DATA
  const groceryData = useMemo(() => {
    const groceryExps = filteredExpenses.filter((e) => e.category === 'Groceries' || (e.category as string) === 'Grocery');
    const totals: Record<string, { label: string; amount: number; emoji: string; count: number }> = {};

    groceryExps.forEach((e) => {
      const notesLower = (e.notes || '').toLowerCase();
      let matchedSubtype = GROCERY_SUBTYPES.find((sub) => 
        notesLower.includes(sub.label.toLowerCase()) || 
        notesLower.includes(sub.id.toLowerCase())
      );

      if (!matchedSubtype) {
        if (notesLower.includes('bulk') || notesLower.includes('ration') || notesLower.includes('month')) {
          matchedSubtype = GROCERY_SUBTYPES[0];
        } else if (notesLower.includes('veggie') || notesLower.includes('fruit') || notesLower.includes('mandi')) {
          matchedSubtype = GROCERY_SUBTYPES[7];
        } else if (notesLower.includes('milk') || notesLower.includes('dairy') || notesLower.includes('paneer')) {
          matchedSubtype = GROCERY_SUBTYPES[8];
        } else if (notesLower.includes('kirana') || notesLower.includes('store')) {
          matchedSubtype = GROCERY_SUBTYPES[5];
        }
      }

      const subLabel = matchedSubtype ? matchedSubtype.label : 'General Groceries';
      const subEmoji = matchedSubtype ? matchedSubtype.emoji : '🛒';

      if (!totals[subLabel]) totals[subLabel] = { label: subLabel, amount: 0, emoji: subEmoji, count: 0 };
      totals[subLabel].amount += Number(e.amount) || 0;
      totals[subLabel].count += 1;
    });

    const grandTotal = Object.values(totals).reduce((sum, item) => sum + item.amount, 0);

    return Object.values(totals)
      .map((item, idx) => ({
        name: `${item.emoji} ${item.label}`,
        value: item.amount,
        count: item.count,
        percent: grandTotal > 0 ? item.amount / grandTotal : 0,
        color: VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Current active dataset
  const currentChartData = useMemo(() => {
    switch (activeTab) {
      case 'category':
        return categoryData;
      case 'member':
        return memberData;
      case 'emi':
        return emiData;
      case 'bank':
        return bankData;
      case 'grocery':
        return groceryData;
      default:
        return categoryData;
    }
  }, [activeTab, categoryData, memberData, emiData, bankData, groceryData]);

  const currentTotalAmount = useMemo(() => {
    return currentChartData.reduce((sum, item) => sum + item.value, 0);
  }, [currentChartData]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieClick = (entry: any) => {
    setSelectedSlice(entry);
  };

  return (
    <div id="pie-chart-analytics-section" className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>All-Data Pie Chart Analytics</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Interactive
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Visual proportion breakdown across categories, member shares, loans & bank balances
              </p>
            </div>
          </div>
        </div>

        {/* Control Switches */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Time scope toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setTimeScope('month')}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                timeScope === 'month'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatMonthName(selectedMonth)}</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeScope('all')}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                timeScope === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>All Time</span>
            </button>
          </div>

          {/* Donut vs Pie toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setChartStyle('donut')}
              className={`px-2.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                chartStyle === 'donut'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Donut Chart View"
            >
              🍩 Donut
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('pie')}
              className={`px-2.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                chartStyle === 'pie'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Full Pie Chart View"
            >
              🥧 Solid Pie
            </button>
          </div>

        </div>
      </div>

      {/* Dataset Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => { setActiveTab('category'); setSelectedSlice(null); setActiveIndex(undefined); }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'category'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Category Expenses ({categoryData.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('member'); setSelectedSlice(null); setActiveIndex(undefined); }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'member'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Member Share ({memberData.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('emi'); setSelectedSlice(null); setActiveIndex(undefined); }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'emi'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>EMI Loans ({emiData.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('bank'); setSelectedSlice(null); setActiveIndex(undefined); }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Bank Funds ({bankData.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('grocery'); setSelectedSlice(null); setActiveIndex(undefined); }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'grocery'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Grocery Subtypes ({groceryData.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('all'); setSelectedSlice(null); setActiveIndex(undefined); }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>All Charts Grid</span>
        </button>
      </div>

      {/* Main Single Pie View OR All Charts Grid */}
      {activeTab !== 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Pie Chart Display Area */}
          <div className="lg:col-span-6 bg-slate-50/70 border border-slate-100 rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[340px]">
            {currentChartData.length > 0 ? (
              <div className="w-full h-80 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={currentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={chartStyle === 'donut' ? 70 : 0}
                      outerRadius={105}
                      paddingAngle={chartStyle === 'donut' ? 4 : 1}
                      dataKey="value"
                      nameKey="name"
                      onMouseEnter={onPieEnter}
                      onClick={onPieClick}
                      className="cursor-pointer"
                    >
                      {currentChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="#ffffff" 
                          strokeWidth={2}
                          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                {chartStyle === 'donut' && activeIndex === undefined && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Total {activeTab.toUpperCase()}
                    </span>
                    <span className="text-xl font-black font-mono text-slate-900 block mt-0.5">
                      {formatINR(currentTotalAmount)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      {currentChartData.length} items
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-200/80 text-slate-400 flex items-center justify-center mx-auto">
                  <PieChartIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-extrabold text-slate-600">
                  No data logged for {activeTab.toUpperCase()} in {timeScope === 'month' ? formatMonthName(selectedMonth) : 'All Time'}
                </p>
                {onOpenAddExpense && (
                  <button
                    type="button"
                    onClick={onOpenAddExpense}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Log First Expense</span>
                  </button>
                )}
              </div>
            )}

            {selectedSlice && (
              <div className="w-full mt-3 bg-white border border-indigo-200 rounded-2xl p-3 shadow-xs flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: selectedSlice.color }} />
                  <div>
                    <span className="font-black text-slate-900">{selectedSlice.name}</span>
                    <span className="text-[10px] text-slate-400 block">{(selectedSlice.percent * 100).toFixed(1)}% share</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black font-mono text-indigo-700 text-sm block">{formatINR(selectedSlice.value)}</span>
                  <button 
                    onClick={() => setSelectedSlice(null)} 
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear Focus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Breakdown Table & Legend */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Data Breakdown ({currentChartData.length} items)
              </h3>
              <span className="text-xs font-black font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Total: {formatINR(currentTotalAmount)}
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {currentChartData.map((item, idx) => {
                const percentVal = Math.round(item.percent * 100);
                const isHovered = activeIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                    onClick={() => setSelectedSlice(item)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                      isHovered || selectedSlice?.name === item.name
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-xs scale-[1.01]'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                        <span className="font-black text-slate-900 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono shrink-0">
                        <span className="font-extrabold text-slate-900">{formatINR(item.value)}</span>
                        <span className="font-bold text-indigo-600 bg-indigo-100/80 dark:bg-indigo-950 px-1.5 py-0.5 rounded-md text-[11px]">
                          {percentVal}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar inside Legend Item */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentVal}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}

              {currentChartData.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6 font-medium">
                  No records found in this category.
                </p>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ALL CHARTS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* 1. Category Pie */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Category Expenses Pie
              </h3>
              <span className="text-xs font-bold font-mono text-emerald-700">
                {formatINR(categoryData.reduce((s, i) => s + i.value, 0))}
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Member Share Pie */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Member Spending Share Pie
              </h3>
              <span className="text-xs font-bold font-mono text-indigo-700">
                {formatINR(memberData.reduce((s, i) => s + i.value, 0))}
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={memberData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {memberData.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. EMI Loans Pie */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-600" />
                Active EMI Monthly Installments
              </h3>
              <span className="text-xs font-bold font-mono text-purple-700">
                {formatINR(emiData.reduce((s, i) => s + i.value, 0))}
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emiData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {emiData.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Bank Funds Pie */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-amber-600" />
                Member Bank Accounts & Balances
              </h3>
              <span className="text-xs font-bold font-mono text-amber-700">
                {formatINR(bankData.reduce((s, i) => s + i.value, 0))}
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bankData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {bankData.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
