export const DEFAULT_FAMILY_MEMBERS = [
  'Aamir Khan',
  'Angrej Singh',
  'Kajal',
  'Shahnaz',
  'Sonam'
] as const;

export const FAMILY_MEMBERS = [...DEFAULT_FAMILY_MEMBERS];

export type FamilyMember = string;

export const ADMIN_MEMBER: FamilyMember = 'Aamir Khan';

export interface MemberCustomConfig {
  name: string;
  emoji?: string;
  photoUrl?: string; // base64 data url from gallery or image URL
  color?: string; // theme color key: 'blue', 'emerald', 'pink', 'orange', 'purple', 'amber', 'indigo', 'rose', 'teal', 'cyan'
}

export interface MemberTheme {
  color: string;
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  avatarBg: string;
  initials: string;
  emoji: string;
  photoUrl?: string;
}

const COLOR_MAP: Record<string, Omit<MemberTheme, 'initials' | 'emoji' | 'photoUrl'>> = {
  blue: {
    color: 'blue',
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-500',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    avatarBg: 'bg-blue-500 text-white',
  },
  emerald: {
    color: 'emerald',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-500',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    avatarBg: 'bg-emerald-500 text-white',
  },
  pink: {
    color: 'pink',
    bg: 'bg-pink-500',
    text: 'text-pink-600',
    border: 'border-pink-500',
    badgeBg: 'bg-pink-50 border-pink-200',
    badgeText: 'text-pink-700',
    avatarBg: 'bg-pink-500 text-white',
  },
  orange: {
    color: 'orange',
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-500',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-orange-700',
    avatarBg: 'bg-orange-500 text-white',
  },
  purple: {
    color: 'purple',
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-500',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-700',
    avatarBg: 'bg-purple-500 text-white',
  },
  amber: {
    color: 'amber',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-500',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
    avatarBg: 'bg-amber-500 text-white',
  },
  indigo: {
    color: 'indigo',
    bg: 'bg-indigo-500',
    text: 'text-indigo-600',
    border: 'border-indigo-500',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-700',
    avatarBg: 'bg-indigo-500 text-white',
  },
  rose: {
    color: 'rose',
    bg: 'bg-rose-500',
    text: 'text-rose-600',
    border: 'border-rose-500',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-700',
    avatarBg: 'bg-rose-500 text-white',
  },
  teal: {
    color: 'teal',
    bg: 'bg-teal-500',
    text: 'text-teal-600',
    border: 'border-teal-500',
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-700',
    avatarBg: 'bg-teal-500 text-white',
  },
  cyan: {
    color: 'cyan',
    bg: 'bg-cyan-500',
    text: 'text-cyan-600',
    border: 'border-cyan-500',
    badgeBg: 'bg-cyan-50 border-cyan-200',
    badgeText: 'text-cyan-700',
    avatarBg: 'bg-cyan-500 text-white',
  },
};

export function getMemberInitials(name: string): string {
  if (!name) return 'FM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getMemberTheme(
  member: string,
  customConfigs?: Record<string, MemberCustomConfig>
): MemberTheme {
  const custom = customConfigs?.[member];
  const defaultMap: Record<string, { color: string; emoji: string }> = {
    'Aamir Khan': { color: 'blue', emoji: '🧔‍♂️' },
    'Amir Khan': { color: 'blue', emoji: '🧔‍♂️' },
    'Angrej Singh': { color: 'emerald', emoji: '🧔' },
    'Kajal': { color: 'pink', emoji: '👩' },
    'Shahnaz': { color: 'orange', emoji: '🧕' },
    'Sonam': { color: 'purple', emoji: '👩‍🎓' },
  };

  const chosenColor = custom?.color || defaultMap[member]?.color || 'indigo';
  const colorTheme = COLOR_MAP[chosenColor] || COLOR_MAP.indigo;
  const emoji = custom?.emoji || defaultMap[member]?.emoji || '👤';
  const photoUrl = custom?.photoUrl;
  const initials = getMemberInitials(member);

  return {
    ...colorTheme,
    initials,
    emoji,
    photoUrl,
  };
}

export const MEMBER_THEMES: Record<string, MemberTheme> = new Proxy({}, {
  get: (_target, prop: string) => {
    return getMemberTheme(prop);
  }
});

export interface GrocerySubtype {
  id: string;
  label: string;
  emoji: string;
  defaultNotes: string;
  isCustom?: boolean;
}

export const GROCERY_SUBTYPES: GrocerySubtype[] = [
  { id: 'bulk_ration', label: 'Monthly Bulk Ration', emoji: '📦', defaultNotes: 'Monthly Atta, Rice, Pulses, Oil & Sugar' },
  { id: 'atta_grains', label: 'Atta, Flour & Grains', emoji: '🌾', defaultNotes: 'Wheat flour, Atta, Besan, Maida & Suji' },
  { id: 'rice_pulses', label: 'Rice, Dal & Pulses', emoji: '🍚', defaultNotes: 'Basmati rice, Toor dal, Moong & Chana' },
  { id: 'oil_ghee', label: 'Cooking Oil & Ghee', emoji: '🛢️', defaultNotes: 'Mustard oil, Sunflower oil & Desi Ghee' },
  { id: 'spices_masalas', label: 'Spices, Salt & Masalas', emoji: '🧂', defaultNotes: 'Spices, Turmeric, Salt & Whole Masalas' },
  { id: 'kirana', label: 'Kirana Store & Spices', emoji: '🏪', defaultNotes: 'Local Kirana shop grocery items' },
  { id: 'supermarket', label: 'Supermarket / D-Mart', emoji: '🛒', defaultNotes: 'Supermarket cart bulk shopping' },
  { id: 'vegetables', label: 'Fresh Veggies & Fruits', emoji: '🍏', defaultNotes: 'Mandi fresh vegetables & fruits' },
  { id: 'dairy', label: 'Milk, Dairy & Bakery', emoji: '🥛', defaultNotes: 'Milk, paneer, curd, butter & bread' },
  { id: 'meat', label: 'Meat, Fish & Poultry', emoji: '🥩', defaultNotes: 'Fresh chicken, mutton, fish & eggs' },
  { id: 'household', label: 'Cleaning & Household', emoji: '🧹', defaultNotes: 'Detergent, soaps, cleaners & tissues' },
  { id: 'tea_snacks', label: 'Tea, Coffee & Dry Fruits', emoji: '☕', defaultNotes: 'Tea, coffee, biscuits & dry fruits' },
  { id: 'personal_care', label: 'Personal Care & Hygiene', emoji: '🧴', defaultNotes: 'Shampoo, soaps, toothpaste & skincare' },
  { id: 'baby_care', label: 'Baby Care & Diapers', emoji: '🍼', defaultNotes: 'Baby food, milk powder & diapers' },
  { id: 'snacks_sweets', label: 'Snacks & Biscuits', emoji: '🍪', defaultNotes: 'Namkeen, biscuits, chips & chocolates' },
];

export type GrocerySubtypeId = string;

export const CATEGORIES = [
  { id: 'Groceries', label: 'Groceries & Family Ration', icon: 'ShoppingCart', color: 'emerald' },
  { id: 'SIP', label: 'SIP & Investments', icon: 'TrendingUp', color: 'emerald' },
  { id: 'EMI', label: 'EMI & Loan Installments', icon: 'CreditCard', color: 'indigo' },
  { id: 'Utilities', label: 'Utilities (Electricity/Water/Wifi)', icon: 'Zap', color: 'amber' },
  { id: 'Medical', label: 'Medical & Healthcare', icon: 'HeartPulse', color: 'rose' },
  { id: 'Fuel', label: 'Fuel & Transportation', icon: 'Fuel', color: 'blue' },
  { id: 'Rent', label: 'Rent & Housing', icon: 'Home', color: 'indigo' },
  { id: 'Dining', label: 'Dining & Snacks', icon: 'Utensils', color: 'orange' },
  { id: 'Education', label: 'Education & Fees', icon: 'GraduationCap', color: 'purple' },
  { id: 'Shopping', label: 'Shopping & Clothes', icon: 'ShoppingBag', color: 'pink' },
  { id: 'Entertainment', label: 'Entertainment & Movies', icon: 'Film', color: 'cyan' },
  { id: 'Household', label: 'Household Items', icon: 'Package', color: 'teal' },
  { id: 'Others', label: 'Others / Misc', icon: 'MoreHorizontal', color: 'slate' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export interface Expense {
  id: string;
  amount: number; // strictly in INR (₹)
  category: CategoryId;
  paidBy: FamilyMember;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm format
  notes?: string;
  createdAt?: string;
  addedByMember?: string;
  isEmiPayment?: boolean;
  emiPlanId?: string;
}

export interface EmiPlan {
  id: string;
  title: string; // e.g. "Home Loan (SBI)", "iPhone 15 Pro", "Bike Loan"
  totalAmount: number; // Total principal or purchase amount in ₹
  emiAmount: number; // Monthly installment amount in ₹
  tenureMonths: number; // e.g., 6, 12, 24, 36
  paidMonths: number; // e.g., 4
  startMonth: string; // YYYY-MM format
  paidBy: FamilyMember;
  category: CategoryId;
  notes?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt?: string;
  addedByMember?: string;
  paymentHistory?: string[]; // Array of YYYY-MM months when payment was logged
  interestRate?: number; // Optional annual interest rate %
}

export interface FamilyBudget {
  monthlyBudget: number; // in INR (₹)
  month: string; // YYYY-MM format
}

export interface SettlementSummary {
  member: FamilyMember;
  totalPaid: number;
  averageShare: number;
  netBalance: number; // positive = spent more than average (gets back), negative = owes
}

export interface MemberBankAmount {
  id: string;
  member: FamilyMember;
  pendingBankAmount: number; // in ₹
  bankName?: string; // e.g. "SBI", "HDFC", "GPay / UPI"
  accountNumberLast4?: string; // e.g. "4821"
  upiId?: string; // e.g. "amir@okicici"
  notes?: string;
  status: 'pending' | 'received' | 'partially_settled';
  lastUpdated?: string;
  customTotalSpentOverride?: number; // Optional manual override for Total Spent
  customMonthSpentOverride?: number; // Optional manual override for Spent of this month
}

export const SIP_FUND_CATEGORIES = [
  'Mutual Funds (Equity)',
  'Index Funds (Nifty 50 / Sensex)',
  'Small Cap / Mid Cap Funds',
  'ELSS Tax Saving Funds',
  'PPF / Post Office Monthly',
  'Gold & Sovereign Gold Bond',
  'Direct Equity / Stocks SIP',
  'Debt / Liquid Funds'
] as const;

export type SipFundCategory = typeof SIP_FUND_CATEGORIES[number];

export interface SipPlan {
  id: string;
  title: string; // e.g. "Parag Parikh Flexi Cap Fund", "Nifty 50 Index SIP", "SBI Small Cap"
  monthlyAmount: number; // Monthly investment in ₹
  expectedRateOfReturn: number; // Expected Annual Return Rate % (e.g., 12.5)
  tenureYears: number; // Investment duration in years (e.g. 5, 10, 15, 20)
  startMonth: string; // YYYY-MM format
  completedMonths: number; // Number of monthly SIP installments paid
  paidBy: FamilyMember;
  fundCategory: string; // e.g., "Mutual Funds (Equity)", "Index Funds", etc.
  goalName?: string; // e.g., "Retirement Fund", "Child Higher Education", "Emergency Corpus", "Wealth Generation"
  notes?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt?: string;
  addedByMember?: string;
  paymentHistory?: string[]; // Array of YYYY-MM months when SIP was logged
  stepUpPercentage?: number; // Optional annual step-up increment percentage (e.g. 10%)
}

export interface DebtRecord {
  id: string;
  title: string; // e.g. "Personal Loan from Ramesh Uncle", "Hand loan for shop repair"
  type: 'borrowed' | 'given'; // 'borrowed' = Money I/Family Owe, 'given' = Money Owed to Us
  personName: string; // Person, lender, borrower or bank name
  totalAmount: number; // Initial debt/loan amount in ₹
  remainingAmount: number; // Current unpaid balance in ₹
  paidBy: FamilyMember; // Responsible family member
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD target payoff date
  notes?: string;
  status: 'active' | 'settled';
  createdAt?: string;
  addedByMember?: string;
}




