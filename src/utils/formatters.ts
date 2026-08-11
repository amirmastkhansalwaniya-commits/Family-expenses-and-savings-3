import { Expense, FamilyMember, FAMILY_MEMBERS, SettlementSummary } from '../types';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatMonthName(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function calculateSettlements(expenses: Expense[]): SettlementSummary[] {
  const totals: Record<FamilyMember, number> = {
    'Amir Khan': 0,
    'Angrej Singh': 0,
    'Kajal': 0,
    'Shahnaz': 0,
    'Sonam': 0,
  };

  expenses.forEach(exp => {
    if (totals[exp.paidBy] !== undefined) {
      totals[exp.paidBy] += Number(exp.amount) || 0;
    }
  });

  const totalSpent = Object.values(totals).reduce((a, b) => a + b, 0);
  const averageShare = FAMILY_MEMBERS.length > 0 ? totalSpent / FAMILY_MEMBERS.length : 0;

  return FAMILY_MEMBERS.map(member => {
    const paid = totals[member];
    const net = paid - averageShare;
    return {
      member,
      totalPaid: paid,
      averageShare: Math.round(averageShare),
      netBalance: Math.round(net),
    };
  });
}

export const SAMPLE_SEED_EXPENSES: Omit<Expense, 'id'>[] = [
  {
    amount: 3850,
    category: 'Groceries',
    paidBy: 'Amir Khan',
    date: new Date().toISOString().split('T')[0],
    notes: 'Monthly staples & dry fruits from BigBasket',
    addedByMember: 'Amir Khan',
  },
  {
    amount: 2400,
    category: 'Utilities',
    paidBy: 'Angrej Singh',
    date: new Date().toISOString().split('T')[0],
    notes: 'Electricity Bill payment for current month',
    addedByMember: 'Angrej Singh',
  },
  {
    amount: 1250,
    category: 'Medical',
    paidBy: 'Kajal',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    notes: 'Monthly health supplements & pharmacy items',
    addedByMember: 'Kajal',
  },
  {
    amount: 1800,
    category: 'Fuel',
    paidBy: 'Shahnaz',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    notes: 'Vehicle petrol refill',
    addedByMember: 'Shahnaz',
  },
  {
    amount: 3200,
    category: 'Dining',
    paidBy: 'Sonam',
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    notes: 'Family weekend dinner outing',
    addedByMember: 'Sonam',
  },
];

export function getLast6Months(targetMonthStr: string): { yearMonth: string; label: string }[] {
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
}
