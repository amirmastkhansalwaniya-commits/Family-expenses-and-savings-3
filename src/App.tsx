import React, { useState, useEffect } from 'react';
import { 
  Expense, 
  FamilyMember, 
  FAMILY_MEMBERS, 
  FamilyBudget,
  EmiPlan,
  SipPlan,
  DebtRecord,
  MemberBankAmount,
  ADMIN_MEMBER,
  MemberCustomConfig,
  getMemberTheme
} from './types';
import { 
  db, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  getDoc,
  getDocs,
  deleteField
} from './lib/firebase';
import { getCurrentMonthKey, SAMPLE_SEED_EXPENSES } from './utils/formatters';
import { Language } from './utils/translations';
import { exportBackupPDF } from './utils/exportImport';
import { FileText, X, Download } from 'lucide-react';

import { Header } from './components/Header';
import { ActiveMemberBar } from './components/ActiveMemberBar';
import { DashboardView } from './components/DashboardView';
import { TransactionHistoryLog } from './components/TransactionHistoryLog';
import { AndroidGuideView } from './components/AndroidGuideView';
import { AddExpenseModal } from './components/AddExpenseModal';
import { BankTransferModal } from './components/BankTransferModal';
import { EmiTrackerView } from './components/EmiTrackerView';
import { SipTrackerView } from './components/SipTrackerView';
import { DebtTrackerView } from './components/DebtTrackerView';
import { AdminPinModal } from './components/AdminPinModal';
import { ExportImportModal } from './components/ExportImportModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { WebAppLinkModal } from './components/WebAppLinkModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { RunningTicker } from './components/RunningTicker';
import { ThemeVariationsModal } from './components/ThemeVariationsModal';
import { TypographyModal } from './components/TypographyModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { applyVariation } from './utils/themeVariations';
import { getSavedTypographySettings, applyTypographySettings } from './utils/typographySettings';
import { getSavedBrandingSettings, saveBrandingSettings, AppBrandingSettings } from './utils/appBranding';

const SAMPLE_SEED_SIPS: Omit<SipPlan, 'id'>[] = [
  {
    title: 'Parag Parikh Flexi Cap Fund',
    monthlyAmount: 5000,
    expectedRateOfReturn: 14.5,
    tenureYears: 15,
    startMonth: '2025-01',
    completedMonths: 18,
    paidBy: 'Amir Khan',
    fundCategory: 'Mutual Funds (Equity)',
    goalName: 'Wealth Generation',
    notes: 'Auto-debit on 10th of every month',
    status: 'active',
    stepUpPercentage: 10,
    paymentHistory: ['2026-05', '2026-06', '2026-07'],
  },
  {
    title: 'Nifty 50 Index Fund (UTI)',
    monthlyAmount: 3000,
    expectedRateOfReturn: 12.0,
    tenureYears: 10,
    startMonth: '2025-03',
    completedMonths: 16,
    paidBy: 'Angrej Singh',
    fundCategory: 'Index Funds (Nifty 50 / Sensex)',
    goalName: 'Retirement Fund',
    notes: 'Low expense ratio index fund',
    status: 'active',
    stepUpPercentage: 5,
    paymentHistory: ['2026-06', '2026-07'],
  },
  {
    title: 'SBI Small Cap Fund',
    monthlyAmount: 2500,
    expectedRateOfReturn: 16.0,
    tenureYears: 12,
    startMonth: '2025-06',
    completedMonths: 13,
    paidBy: 'Shahnaz',
    fundCategory: 'Small Cap / Mid Cap Funds',
    goalName: 'Child Higher Education',
    notes: 'High growth potential fund',
    status: 'active',
    stepUpPercentage: 10,
    paymentHistory: ['2026-07'],
  }
];

const SAMPLE_SEED_EMIS: Omit<EmiPlan, 'id'>[] = [
  {
    title: 'iPhone 15 Pro (HDFC No-Cost EMI)',
    totalAmount: 120000,
    emiAmount: 10000,
    tenureMonths: 12,
    paidMonths: 4,
    startMonth: '2026-04',
    paidBy: 'Amir Khan',
    category: 'Shopping',
    notes: 'HDFC Credit Card No Cost EMI',
    status: 'active',
    paymentHistory: ['2026-04', '2026-05', '2026-06', '2026-07'],
  },
  {
    title: 'Tata Punch Car Loan (SBI)',
    totalAmount: 600000,
    emiAmount: 14500,
    tenureMonths: 48,
    paidMonths: 14,
    startMonth: '2025-06',
    paidBy: 'Angrej Singh',
    category: 'Fuel',
    notes: 'SBI Auto Loan EMI',
    status: 'active',
    paymentHistory: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'],
  },
  {
    title: 'Samsung Smart Fridge (Bajaj Finserv)',
    totalAmount: 48000,
    emiAmount: 4000,
    tenureMonths: 12,
    paidMonths: 12,
    startMonth: '2025-08',
    paidBy: 'Shahnaz',
    category: 'Household',
    notes: 'Bajaj Finserv EMI - Completed',
    status: 'completed',
    paymentHistory: [],
  }
];

const SAMPLE_SEED_DEBTS: Omit<DebtRecord, 'id'>[] = [
  {
    title: 'Hand Loan for Shop Repair',
    type: 'borrowed',
    personName: 'Ramesh Sharma (Shop Dealer)',
    totalAmount: 50000,
    remainingAmount: 20000,
    paidBy: 'Amir Khan',
    dueDate: '2026-10-15',
    notes: '0% interest hand loan from family friend',
    status: 'active',
  },
  {
    title: 'Personal Loan Given for Wedding',
    type: 'given',
    personName: 'Vikas Kumar (Cousin)',
    totalAmount: 30000,
    remainingAmount: 15000,
    paidBy: 'Angrej Singh',
    dueDate: '2026-09-30',
    notes: 'To collect back after wheat harvest season',
    status: 'active',
  }
];

const DEFAULT_MEMBER_BANK_AMOUNTS: Record<FamilyMember, Omit<MemberBankAmount, 'id'>> = {
  'Aamir Khan': {
    member: 'Aamir Khan',
    pendingBankAmount: 0,
    bankName: 'SBI Bank',
    upiId: 'aamir@okicici',
    notes: 'Bank balance settled',
    status: 'received',
    lastUpdated: '2026-08-01',
  },
  'Amir Khan': {
    member: 'Amir Khan',
    pendingBankAmount: 0,
    bankName: 'SBI Bank',
    upiId: 'amir@okicici',
    notes: 'Bank balance settled',
    status: 'received',
    lastUpdated: '2026-08-01',
  },
  'Angrej Singh': {
    member: 'Angrej Singh',
    pendingBankAmount: 0,
    bankName: 'HDFC Bank',
    upiId: 'angrej@okhdfcbank',
    notes: 'Bank balance settled',
    status: 'received',
    lastUpdated: '2026-08-01',
  },
  'Kajal': {
    member: 'Kajal',
    pendingBankAmount: 0,
    bankName: 'GPay / UPI',
    upiId: 'kajal@upi',
    notes: 'Bank balance settled',
    status: 'received',
    lastUpdated: '2026-08-01',
  },
  'Shahnaz': {
    member: 'Shahnaz',
    pendingBankAmount: 0,
    bankName: 'PNB Bank',
    upiId: 'shahnaz@okaxis',
    notes: 'Bank balance settled',
    status: 'received',
    lastUpdated: '2026-08-01',
  },
  'Sonam': {
    member: 'Sonam',
    pendingBankAmount: 0,
    bankName: 'ICICI Bank',
    upiId: 'sonam@icici',
    notes: 'Bank balance settled',
    status: 'received',
    lastUpdated: '2026-08-01',
  },
};

export default function App() {
  // 20 Theme variations state
  const [appVariation, setAppVariation] = useState<string>(() => {
    return localStorage.getItem('family_app_variation') || 'executive_garamond';
  });
  const [isThemeVariationsModalOpen, setIsThemeVariationsModalOpen] = useState<boolean>(false);
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState<boolean>(false);
  const [isAppSettingsModalOpen, setIsAppSettingsModalOpen] = useState<boolean>(false);

  // App Custom Branding State (Name, Font, Color, Logo)
  const [brandingSettings, setBrandingSettings] = useState<AppBrandingSettings>(() => getSavedBrandingSettings());

  const handleUpdateBrandingSettings = (updated: AppBrandingSettings) => {
    setBrandingSettings(updated);
    saveBrandingSettings(updated);
  };

  // Apply chosen variation & typography settings on load & change
  useEffect(() => {
    applyVariation(appVariation);
    applyTypographySettings(getSavedTypographySettings());
  }, [appVariation]);

  // Theme state: 'light' (Clean Light) or 'dark' (Modern Dark), persisted in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('family_app_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Sync theme with HTML root class and localStorage
  useEffect(() => {
    localStorage.setItem('family_app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Language state: 'en', 'hi', 'pa', 'hi-Latn' (persisted in localStorage)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('family_app_language');
    return (saved === 'hi' || saved === 'pa' || saved === 'hi-Latn' || saved === 'en') ? (saved as Language) : 'en';
  });

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('family_app_language', lang);
  };

  // Active user profile state (persisted in localStorage)
  const [activeMember, setActiveMember] = useState<FamilyMember>(() => {
    const saved = localStorage.getItem('family_active_member');
    if (saved === 'Amir Khan') return 'Aamir Khan';
    return saved ? (saved as FamilyMember) : 'Aamir Khan';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'sips' | 'emis' | 'debts' | 'android-guide'>('dashboard');

  // 9:16 Aspect Ratio Mode toggle
  const [isRatio916, setIsRatio916] = useState<boolean>(() => {
    const saved = localStorage.getItem('family_app_ratio_916');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleRatio916 = () => {
    setIsRatio916(prev => {
      const next = !prev;
      localStorage.setItem('family_app_ratio_916', String(next));
      return next;
    });
  };

  // Selected month filter YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return localStorage.getItem('family_selected_month') || getCurrentMonthKey();
  });

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
    localStorage.setItem('family_selected_month', month);
    sessionStorage.setItem('family_manually_selected_month', month);
  };

  // Automatic Month Check: Ensures spending restart from zero on 1st of every month
  useEffect(() => {
    const checkCurrentMonth = () => {
      const currentMonthKey = getCurrentMonthKey();
      // Auto-set selected month to current calendar month if app date advances
      const savedUserMonthSelection = sessionStorage.getItem('family_manually_selected_month');
      if (!savedUserMonthSelection) {
        setSelectedMonth(currentMonthKey);
      }
    };

    checkCurrentMonth();
    window.addEventListener('focus', checkCurrentMonth);
    const interval = setInterval(checkCurrentMonth, 60000);

    return () => {
      window.removeEventListener('focus', checkCurrentMonth);
      clearInterval(interval);
    };
  }, []);

  // Firestore Sync & Expenses Data State (cached in localStorage for persistent offline & refresh durability)
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('family_expenses_cache');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [emis, setEmis] = useState<EmiPlan[]>(() => {
    try {
      const saved = localStorage.getItem('family_emis_cache');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [sips, setSips] = useState<SipPlan[]>(() => {
    try {
      const saved = localStorage.getItem('family_sips_cache');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [debts, setDebts] = useState<DebtRecord[]>(() => {
    try {
      const saved = localStorage.getItem('family_debts_cache');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [memberBankAmounts, setMemberBankAmounts] = useState<Record<FamilyMember, MemberBankAmount>>(() => {
    try {
      const saved = localStorage.getItem('family_member_bank_amounts_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) return parsed;
      }
    } catch (e) {}

    const initialMap = {} as Record<FamilyMember, MemberBankAmount>;
    FAMILY_MEMBERS.forEach((m) => {
      initialMap[m] = {
        id: m,
        member: m,
        pendingBankAmount: DEFAULT_MEMBER_BANK_AMOUNTS[m]?.pendingBankAmount || 0,
        bankName: DEFAULT_MEMBER_BANK_AMOUNTS[m]?.bankName || 'Bank Transfer',
        upiId: DEFAULT_MEMBER_BANK_AMOUNTS[m]?.upiId || '',
        notes: DEFAULT_MEMBER_BANK_AMOUNTS[m]?.notes || '',
        status: DEFAULT_MEMBER_BANK_AMOUNTS[m]?.status || 'pending',
        lastUpdated: DEFAULT_MEMBER_BANK_AMOUNTS[m]?.lastUpdated || new Date().toISOString().split('T')[0],
      };
    });
    return initialMap;
  });

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('family_monthly_budget_cache');
    return saved ? (Number(saved) || 50000) : 50000;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  // Admin Security PIN State
  const [adminPin, setAdminPin] = useState<string>(() => localStorage.getItem('admin_pin_code') || '1234');

  // Dynamic Family Members & Custom Configs State
  const [familyMembers, setFamilyMembers] = useState<string[]>(() => {
    const saved = localStorage.getItem('family_members_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return FAMILY_MEMBERS;
  });

  const [memberConfigs, setMemberConfigs] = useState<Record<string, MemberCustomConfig>>(() => {
    const saved = localStorage.getItem('family_member_configs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [adminPinModalMode, setAdminPinModalMode] = useState<'verify' | 'change'>('verify');
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState<boolean>(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState<boolean>(false);
  const [isWebAppLinkModalOpen, setIsWebAppLinkModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isBankTransferModalOpen, setIsBankTransferModalOpen] = useState<boolean>(false);

  // Firestore Real-time Listener for Member Configs & Family Members List
  useEffect(() => {
    const membersListRef = doc(db, 'settings', 'familyMembersConfig');
    const unsubList = onSnapshot(
      membersListRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.members) && data.members.length > 0) {
            setFamilyMembers(data.members);
            localStorage.setItem('family_members_list', JSON.stringify(data.members));
          }
        }
      },
      (err) => {
        console.warn('Family members config snapshot error:', err);
      }
    );

    const configsRef = collection(db, 'memberConfigs');
    const unsubConfigs = onSnapshot(
      configsRef,
      (snapshot) => {
        const loaded: Record<string, MemberCustomConfig> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as MemberCustomConfig;
          if (data && data.name) {
            loaded[data.name] = data;
          }
        });
        if (Object.keys(loaded).length > 0) {
          setMemberConfigs(loaded);
          localStorage.setItem('family_member_configs', JSON.stringify(loaded));
        }
      },
      (err) => {
        console.warn('Member configs snapshot error:', err);
      }
    );

    return () => {
      unsubList();
      unsubConfigs();
    };
  }, []);

  // Toast notification for automated weekly PDF backup
  const [autoBackupToast, setAutoBackupToast] = useState<string | null>(null);

  // Automated 7-Day Weekly PDF Backup Runner Effect
  useEffect(() => {
    if (isSyncing) return;

    const enabled = localStorage.getItem('auto_weekly_pdf_backup_enabled') !== 'false';
    if (!enabled) return;

    const lastTime = localStorage.getItem('auto_weekly_pdf_backup_last_time');
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    if (!lastTime || now - Number(lastTime) >= SEVEN_DAYS_MS) {
      const timer = setTimeout(() => {
        try {
          exportBackupPDF({
            expenses,
            memberBankAmounts,
            emis,
            monthlyBudget
          });
          localStorage.setItem('auto_weekly_pdf_backup_last_time', String(now));
          const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          setAutoBackupToast(`Automated 7-Day Weekly PDF Backup generated & saved (${dateStr})!`);
        } catch (err) {
          console.warn('Auto weekly backup PDF error:', err);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSyncing, expenses, memberBankAmounts, emis, monthlyBudget]);

  const handleAddMember = async (memberName: string, config?: MemberCustomConfig) => {
    const trimmed = memberName.trim();
    if (!trimmed) return;

    const newMembers = familyMembers.includes(trimmed) ? familyMembers : [...familyMembers, trimmed];
    setFamilyMembers(newMembers);
    localStorage.setItem('family_members_list', JSON.stringify(newMembers));

    try {
      await setDoc(doc(db, 'settings', 'familyMembersConfig'), {
        members: newMembers,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('Error syncing family members list to Firestore:', err);
    }

    if (config) {
      const updatedConfigs = { ...memberConfigs, [trimmed]: config };
      setMemberConfigs(updatedConfigs);
      localStorage.setItem('family_member_configs', JSON.stringify(updatedConfigs));

      try {
        await setDoc(doc(db, 'memberConfigs', trimmed), config, { merge: true });
      } catch (err) {
        console.warn('Error saving member config to Firestore:', err);
      }
    }
  };

  const handleRemoveMember = async (memberName: string) => {
    if (familyMembers.length <= 1) {
      alert('Cannot remove the only remaining family member.');
      return;
    }

    const newMembers = familyMembers.filter((m) => m !== memberName);
    setFamilyMembers(newMembers);
    localStorage.setItem('family_members_list', JSON.stringify(newMembers));

    const updatedConfigs = { ...memberConfigs };
    delete updatedConfigs[memberName];
    setMemberConfigs(updatedConfigs);
    localStorage.setItem('family_member_configs', JSON.stringify(updatedConfigs));

    if (activeMember === memberName) {
      const nextMember = newMembers[0] || 'Amir Khan';
      setActiveMember(nextMember);
      localStorage.setItem('family_active_member', nextMember);
    }

    try {
      await setDoc(doc(db, 'settings', 'familyMembersConfig'), {
        members: newMembers,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await deleteDoc(doc(db, 'memberConfigs', memberName));
    } catch (err) {
      console.warn('Error removing member from Firestore:', err);
    }
  };

  const handleUpdateMember = async (oldName: string, newName: string, config: MemberCustomConfig) => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    if (!trimmedNew) return;

    // Case 1: Member name changed (rename)
    if (trimmedOld !== trimmedNew) {
      // 1. Update family members list
      const updatedMembers = familyMembers.map((m) => (m === trimmedOld ? trimmedNew : m));
      setFamilyMembers(updatedMembers);
      localStorage.setItem('family_members_list', JSON.stringify(updatedMembers));

      // 2. Update member configs map
      const updatedConfigs = { ...memberConfigs };
      delete updatedConfigs[trimmedOld];
      updatedConfigs[trimmedNew] = { ...config, name: trimmedNew };
      setMemberConfigs(updatedConfigs);
      localStorage.setItem('family_member_configs', JSON.stringify(updatedConfigs));

      // 3. If active member was the old name, update active member
      if (activeMember === trimmedOld) {
        setActiveMember(trimmedNew as FamilyMember);
        localStorage.setItem('family_active_member', trimmedNew);
      }

      // 4. Update Firestore familyMembersConfig setting
      try {
        await setDoc(doc(db, 'settings', 'familyMembersConfig'), {
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // 5. Delete old memberConfig doc and set new memberConfig doc
        await deleteDoc(doc(db, 'memberConfigs', trimmedOld));
        await setDoc(doc(db, 'memberConfigs', trimmedNew), { ...config, name: trimmedNew }, { merge: true });

        // 6. Cascade update expenses paidBy field in Firestore
        expenses.forEach(async (exp) => {
          if (exp.paidBy === trimmedOld) {
            await updateDoc(doc(db, 'expenses', exp.id), { paidBy: trimmedNew });
          }
        });

        // 7. Cascade update EMIs paidBy field in Firestore
        emis.forEach(async (emi) => {
          if (emi.paidBy === trimmedOld) {
            await updateDoc(doc(db, 'emis', emi.id), { paidBy: trimmedNew });
          }
        });

        // 8. Cascade update memberBankAmounts doc if exists
        if (memberBankAmounts[trimmedOld]) {
          const bankData = memberBankAmounts[trimmedOld];
          await setDoc(doc(db, 'memberBankAmounts', trimmedNew), {
            ...bankData,
            member: trimmedNew,
          }, { merge: true });
          await deleteDoc(doc(db, 'memberBankAmounts', trimmedOld));
        }
      } catch (err) {
        console.warn('Error syncing member update/rename to Firestore:', err);
      }
    } else {
      // Case 2: Only config (photo, color, emoji) changed
      const updatedConfigs = {
        ...memberConfigs,
        [trimmedOld]: { ...config, name: trimmedOld },
      };
      setMemberConfigs(updatedConfigs);
      localStorage.setItem('family_member_configs', JSON.stringify(updatedConfigs));

      try {
        await setDoc(doc(db, 'memberConfigs', trimmedOld), { ...config, name: trimmedOld }, { merge: true });
      } catch (err) {
        console.warn('Error updating member config in Firestore:', err);
      }
    }
  };

  // Real-time Firestore Admin Settings/PIN Listener
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'adminConfig');
    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.adminPin) {
            setAdminPin(String(data.adminPin));
            localStorage.setItem('admin_pin_code', String(data.adminPin));
          }
        }
      },
      (err) => {
        console.warn('Admin config snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateAdminPin = async (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('admin_pin_code', newPin);
    try {
      const settingsRef = doc(db, 'settings', 'adminConfig');
      await setDoc(settingsRef, { adminPin: newPin, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Error saving admin PIN to Firestore:', err);
    }
  };

  // Persist Active Member
  const handleSelectMember = (member: FamilyMember) => {
    setActiveMember(member);
    localStorage.setItem('family_active_member', member);
  };

  const handleConfirmAdminSwitch = () => {
    setActiveMember(ADMIN_MEMBER);
    localStorage.setItem('family_active_member', ADMIN_MEMBER);
    setIsAdminPinModalOpen(false);
  };

  const handleOpenChangePinModal = () => {
    setAdminPinModalMode('change');
    setIsAdminPinModalOpen(true);
  };

  // Real-time Firestore Expenses Listener
  useEffect(() => {
    setIsSyncing(true);
    const syncTimeout = setTimeout(() => {
      setIsSyncing(false);
    }, 2000);

    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        clearTimeout(syncTimeout);
        const loadedExpenses: Expense[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawCat = data.category || 'Others';
          const normCat = rawCat === 'Grocery' ? 'Groceries' : rawCat;
          loadedExpenses.push({
            id: docSnap.id,
            amount: Number(data.amount) || 0,
            category: normCat,
            paidBy: data.paidBy || 'Amir Khan',
            date: data.date || new Date().toISOString().split('T')[0],
            notes: data.notes || '',
            addedByMember: data.addedByMember || data.paidBy,
            isEmiPayment: data.isEmiPayment || false,
            emiPlanId: data.emiPlanId || '',
          });
        });

        // Auto-seed initial sample data if collection is empty
        if (loadedExpenses.length === 0 && snapshot.empty) {
          const hasSeeded = localStorage.getItem('has_seeded_expenses_v2');
          if (!hasSeeded) {
            localStorage.setItem('has_seeded_expenses_v2', 'true');
            seedInitialSampleData();
          } else {
            setExpenses((prev) => {
              if (prev.length > 0) return prev;
              localStorage.setItem('family_expenses_cache', JSON.stringify([]));
              return [];
            });
          }
        } else if (loadedExpenses.length > 0) {
          localStorage.setItem('has_seeded_expenses_v2', 'true');
          setExpenses(loadedExpenses);
          localStorage.setItem('family_expenses_cache', JSON.stringify(loadedExpenses));
        }
        setIsSyncing(false);
      },
      (error) => {
        clearTimeout(syncTimeout);
        console.warn('Firestore snapshot error, falling back to local memory:', error);
        setIsSyncing(false);
      }
    );

    return () => {
      clearTimeout(syncTimeout);
      unsubscribe();
    };
  }, []);

  // Real-time Firestore EMIs Listener
  useEffect(() => {
    const emisRef = collection(db, 'emis');
    const unsubscribe = onSnapshot(
      emisRef,
      (snapshot) => {
        const loadedEmis: EmiPlan[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedEmis.push({
            id: docSnap.id,
            title: data.title || 'Untitled EMI',
            totalAmount: Number(data.totalAmount) || 0,
            emiAmount: Number(data.emiAmount) || 0,
            tenureMonths: Number(data.tenureMonths) || 12,
            paidMonths: Number(data.paidMonths) || 0,
            startMonth: data.startMonth || selectedMonth,
            paidBy: data.paidBy || 'Amir Khan',
            category: data.category || 'EMI',
            notes: data.notes || '',
            status: data.status || 'active',
            addedByMember: data.addedByMember || data.paidBy,
            paymentHistory: Array.isArray(data.paymentHistory) ? data.paymentHistory : [],
            interestRate: Number(data.interestRate) || 0,
          });
        });

        if (loadedEmis.length === 0 && snapshot.empty) {
          const hasSeeded = localStorage.getItem('has_seeded_emis_v2');
          if (!hasSeeded) {
            localStorage.setItem('has_seeded_emis_v2', 'true');
            seedInitialSampleEmis();
          } else {
            setEmis([]);
            localStorage.setItem('family_emis_cache', JSON.stringify([]));
          }
        } else if (loadedEmis.length > 0) {
          localStorage.setItem('has_seeded_emis_v2', 'true');
          setEmis(loadedEmis);
          localStorage.setItem('family_emis_cache', JSON.stringify(loadedEmis));
        }
      },
      (err) => {
        console.warn('EMIs snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const seedInitialSampleSips = async () => {
    try {
      const sipsRef = collection(db, 'sips');
      for (const sip of SAMPLE_SEED_SIPS) {
        await addDoc(sipsRef, {
          ...sip,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Error seeding sample SIPs:', err);
    }
  };

  // Real-time Firestore SIPs Listener
  useEffect(() => {
    const sipsRef = collection(db, 'sips');
    const unsubscribe = onSnapshot(
      sipsRef,
      (snapshot) => {
        const loadedSips: SipPlan[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedSips.push({
            id: docSnap.id,
            title: data.title || 'Untitled SIP',
            monthlyAmount: Number(data.monthlyAmount) || 0,
            expectedRateOfReturn: Number(data.expectedRateOfReturn) || 12,
            tenureYears: Number(data.tenureYears) || 10,
            completedMonths: Number(data.completedMonths) || 0,
            startMonth: data.startMonth || selectedMonth,
            paidBy: data.paidBy || 'Amir Khan',
            fundCategory: data.fundCategory || 'Mutual Funds (Equity)',
            goalName: data.goalName || 'Wealth Generation',
            notes: data.notes || '',
            status: data.status || 'active',
            addedByMember: data.addedByMember || data.paidBy,
            paymentHistory: Array.isArray(data.paymentHistory) ? data.paymentHistory : [],
            stepUpPercentage: Number(data.stepUpPercentage) || 0,
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });

        if (loadedSips.length === 0 && snapshot.empty) {
          const hasSeeded = localStorage.getItem('has_seeded_sips_v1');
          if (!hasSeeded) {
            localStorage.setItem('has_seeded_sips_v1', 'true');
            seedInitialSampleSips();
          } else {
            setSips([]);
            localStorage.setItem('family_sips_cache', JSON.stringify([]));
          }
        } else if (loadedSips.length > 0) {
          localStorage.setItem('has_seeded_sips_v1', 'true');
          setSips(loadedSips);
          localStorage.setItem('family_sips_cache', JSON.stringify(loadedSips));
        }
      },
      (err) => {
        console.warn('SIPs snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const seedInitialSampleDebts = async () => {
    try {
      const debtsRef = collection(db, 'debts');
      for (const debt of SAMPLE_SEED_DEBTS) {
        await addDoc(debtsRef, {
          ...debt,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Error seeding sample debts:', err);
    }
  };

  // Real-time Firestore Debts Listener
  useEffect(() => {
    const debtsRef = collection(db, 'debts');
    const unsubscribe = onSnapshot(
      debtsRef,
      (snapshot) => {
        const loadedDebts: DebtRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedDebts.push({
            id: docSnap.id,
            title: data.title || 'Untitled Debt',
            type: data.type === 'given' ? 'given' : 'borrowed',
            personName: data.personName || 'Unknown',
            totalAmount: Number(data.totalAmount) || 0,
            remainingAmount: Number(data.remainingAmount) !== undefined ? Number(data.remainingAmount) : (Number(data.totalAmount) || 0),
            paidBy: data.paidBy || 'Amir Khan',
            dueDate: data.dueDate || undefined,
            notes: data.notes || '',
            status: data.status === 'settled' ? 'settled' : 'active',
            createdAt: data.createdAt || new Date().toISOString(),
            addedByMember: data.addedByMember || data.paidBy,
          });
        });

        if (loadedDebts.length === 0 && snapshot.empty) {
          const hasSeeded = localStorage.getItem('has_seeded_debts_v1');
          if (!hasSeeded) {
            localStorage.setItem('has_seeded_debts_v1', 'true');
            seedInitialSampleDebts();
          } else {
            setDebts([]);
            localStorage.setItem('family_debts_cache', JSON.stringify([]));
          }
        } else if (loadedDebts.length > 0) {
          localStorage.setItem('has_seeded_debts_v1', 'true');
          setDebts(loadedDebts);
          localStorage.setItem('family_debts_cache', JSON.stringify(loadedDebts));
        }
      },
      (err) => {
        console.warn('Debts snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Debt Handler Functions
  const handleSaveDebt = async (debtData: Omit<DebtRecord, 'id'>, debtId?: string) => {
    if (debtId) {
      const oldDebt = debts.find((d) => d.id === debtId);
      if (debtData.type === 'given') {
        const oldLentAmount = oldDebt && oldDebt.type === 'given' ? oldDebt.totalAmount : 0;
        const delta = debtData.totalAmount - oldLentAmount;
        if (delta !== 0) {
          await adjustBankForMemberSpending(debtData.paidBy, delta, false);
        }
      }

      const updatedDebt: DebtRecord = { ...debtData, id: debtId };
      setDebts((prev) => {
        const next = prev.map((d) => (d.id === debtId ? updatedDebt : d));
        localStorage.setItem('family_debts_cache', JSON.stringify(next));
        return next;
      });

      try {
        const debtRef = doc(db, 'debts', debtId);
        await updateDoc(debtRef, {
          ...debtData,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Error updating debt in Firestore:', err);
      }
    } else {
      // Debit member bank account whenever Lent (given) amount is added inside debt tracker
      if (debtData.type === 'given' && debtData.totalAmount > 0) {
        await adjustBankForMemberSpending(debtData.paidBy, debtData.totalAmount, false);
      }

      const tempId = `debt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newDebt: DebtRecord = { ...debtData, id: tempId };
      setDebts((prev) => {
        const next = [newDebt, ...prev];
        localStorage.setItem('family_debts_cache', JSON.stringify(next));
        return next;
      });

      try {
        const debtsRef = collection(db, 'debts');
        const docRef = await addDoc(debtsRef, {
          ...debtData,
          createdAt: new Date().toISOString(),
        });
        setDebts((prev) => {
          const next = prev.map((d) => (d.id === tempId ? { ...d, id: docRef.id } : d));
          localStorage.setItem('family_debts_cache', JSON.stringify(next));
          return next;
        });
      } catch (err) {
        console.warn('Error saving debt to Firestore:', err);
      }
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    setDebts((prev) => {
      const next = prev.filter((d) => d.id !== debtId);
      localStorage.setItem('family_debts_cache', JSON.stringify(next));
      return next;
    });

    try {
      await deleteDoc(doc(db, 'debts', debtId));
    } catch (err) {
      console.warn('Error deleting debt from Firestore:', err);
    }
  };

  const handleLogDebtPayment = async (debtId: string, paymentAmount: number) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const newRemaining = Math.max(0, debt.remainingAmount - paymentAmount);
    const isSettled = newRemaining <= 0;

    const updatedDebt: DebtRecord = {
      ...debt,
      remainingAmount: newRemaining,
      status: isSettled ? 'settled' : 'active',
    };

    setDebts((prev) => {
      const next = prev.map((d) => (d.id === debtId ? updatedDebt : d));
      localStorage.setItem('family_debts_cache', JSON.stringify(next));
      return next;
    });

    try {
      const debtRef = doc(db, 'debts', debtId);
      await updateDoc(debtRef, {
        remainingAmount: newRemaining,
        status: isSettled ? 'settled' : 'active',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Error logging debt payment in Firestore:', err);
    }
  };

  // Real-time Firestore Member Bank Amounts Listener
  useEffect(() => {
    const bankRef = collection(db, 'memberBankAmounts');
    const unsubscribe = onSnapshot(
      bankRef,
      (snapshot) => {
        const loaded: Partial<Record<FamilyMember, MemberBankAmount>> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const member = (data.member || docSnap.id) as FamilyMember;
          if (member) {
            loaded[member] = {
              id: docSnap.id,
              member,
              pendingBankAmount: Number(data.pendingBankAmount) || 0,
              bankName: data.bankName || 'Bank Transfer',
              upiId: data.upiId || '',
              notes: data.notes || '',
              status: data.status || 'pending',
              lastUpdated: data.lastUpdated || new Date().toISOString().split('T')[0],
              customTotalSpentOverride: (data.customTotalSpentOverride !== undefined && data.customTotalSpentOverride !== null)
                ? Number(data.customTotalSpentOverride)
                : undefined,
              customMonthSpentOverride: (data.customMonthSpentOverride !== undefined && data.customMonthSpentOverride !== null)
                ? Number(data.customMonthSpentOverride)
                : undefined,
            };
          }
        });

        if (Object.keys(loaded).length === 0 && snapshot.empty) {
          const hasSeededBank = localStorage.getItem('has_seeded_bank_v1');
          if (!hasSeededBank) {
            localStorage.setItem('has_seeded_bank_v1', 'true');
            seedInitialBankAmounts();
          }
        } else {
          localStorage.setItem('has_seeded_bank_v1', 'true');
          setMemberBankAmounts((prev) => {
            const merged = { ...prev, ...loaded };
            localStorage.setItem('family_member_bank_amounts_cache', JSON.stringify(merged));
            return merged;
          });
        }
      },
      (err) => {
        console.warn('Bank snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Keep user member bank balances preserved across sessions
  // useEffect(() => {
  //   zeroAllMemberBankBalances();
  // }, []);

  const zeroAllMemberBankBalances = async () => {
    try {
      const bankRef = collection(db, 'memberBankAmounts');
      for (const member of FAMILY_MEMBERS) {
        const docRef = doc(bankRef, member);
        const defaults = DEFAULT_MEMBER_BANK_AMOUNTS[member] || {
          member,
          pendingBankAmount: 0,
          bankName: 'Bank Transfer',
          upiId: '',
          notes: 'Bank balance settled',
          status: 'received',
          lastUpdated: new Date().toISOString().split('T')[0],
        };
        await setDoc(
          docRef,
          {
            ...defaults,
            pendingBankAmount: 0,
            status: 'received',
            notes: 'Bank balance settled',
            lastUpdated: new Date().toISOString().split('T')[0],
          },
          { merge: true }
        );
      }
      setMemberBankAmounts((prev) => {
        const updated = { ...prev };
        for (const member of FAMILY_MEMBERS) {
          if (updated[member]) {
            updated[member] = {
              ...updated[member],
              pendingBankAmount: 0,
              status: 'received',
              notes: 'Bank balance settled',
              lastUpdated: new Date().toISOString().split('T')[0],
            };
          }
        }
        return updated;
      });
    } catch (e) {
      console.warn('Error zeroing member bank balances:', e);
    }
  };

  const seedInitialBankAmounts = async () => {
    try {
      const bankRef = collection(db, 'memberBankAmounts');
      for (const member of FAMILY_MEMBERS) {
        const docRef = doc(bankRef, member);
        await setDoc(docRef, {
          ...DEFAULT_MEMBER_BANK_AMOUNTS[member],
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Error seeding bank amounts:', e);
    }
  };

  // Sync total budget with sum of member bank amounts on bank update
  const handleUpdateMemberBankAmount = async (
    member: FamilyMember,
    updates: Partial<MemberBankAmount>
  ) => {
    const updatedMemberBankAmounts = {
      ...memberBankAmounts,
      [member]: {
        ...memberBankAmounts[member],
        ...updates,
      },
    };

    setMemberBankAmounts(updatedMemberBankAmounts);
    localStorage.setItem('family_member_bank_amounts_cache', JSON.stringify(updatedMemberBankAmounts));

    // If pendingBankAmount is changed, update total monthlyBudget = sum of member bank balances
    if (updates.pendingBankAmount !== undefined) {
      const newTotalBudget = familyMembers.reduce((sum, m) => {
        return sum + (updatedMemberBankAmounts[m]?.pendingBankAmount || 0);
      }, 0);

      setMonthlyBudget(newTotalBudget);
      localStorage.setItem('family_monthly_budget_cache', String(newTotalBudget));
      try {
        const budgetDocRef = doc(db, 'budgets', selectedMonth);
        await setDoc(budgetDocRef, {
          monthlyBudget: newTotalBudget,
          month: selectedMonth,
        }, { merge: true });
      } catch (e) {
        console.warn('Error syncing budget with bank amounts:', e);
      }
    }

    const firestorePayload: Record<string, any> = {};
    Object.keys(updates).forEach((key) => {
      const val = (updates as any)[key];
      if (val === undefined) {
        firestorePayload[key] = deleteField();
      } else {
        firestorePayload[key] = val;
      }
    });

    try {
      const docRef = doc(db, 'memberBankAmounts', member);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        await updateDoc(docRef, firestorePayload);
      } else {
        await setDoc(docRef, {
          member,
          ...DEFAULT_MEMBER_BANK_AMOUNTS[member],
          ...firestorePayload,
        });
      }
    } catch (e) {
      console.warn('Error updating member bank amount in Firestore:', e);
    }
  };
  useEffect(() => {
    const budgetDocRef = doc(db, 'budgets', selectedMonth);
    const unsubscribe = onSnapshot(
      budgetDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.monthlyBudget === 'number') {
            setMonthlyBudget(data.monthlyBudget);
          }
        }
      },
      (err) => {
        console.warn('Budget snapshot listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [selectedMonth]);

  // Seed sample data into Firestore if database is empty
  const seedInitialSampleData = async () => {
    try {
      const expensesRef = collection(db, 'expenses');
      for (const item of SAMPLE_SEED_EXPENSES) {
        await addDoc(expensesRef, {
          ...item,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Error seeding sample data:', e);
    }
  };

  const seedInitialSampleEmis = async () => {
    try {
      localStorage.setItem('has_seeded_emis_v2', 'true');
      const emisRef = collection(db, 'emis');
      for (const item of SAMPLE_SEED_EMIS) {
        await addDoc(emisRef, {
          ...item,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Error seeding sample EMIs:', e);
    }
  };

  // EMI CRUD Handlers
  const handleSaveEmi = async (emiData: Omit<EmiPlan, 'id'>, id?: string) => {
    if (id) {
      // Calculate bank deduction difference on EMI update (without updating total spent overrides)
      const oldEmi = emis.find((e) => e.id === id);
      const oldPaidMonths = oldEmi ? oldEmi.paidMonths : 0;
      const oldEmiAmount = oldEmi ? oldEmi.emiAmount : 0;
      const oldDeduction = oldPaidMonths * oldEmiAmount;

      const newPaidMonths = emiData.paidMonths;
      const newEmiAmount = emiData.emiAmount;
      const newDeduction = newPaidMonths * newEmiAmount;

      let spendingDelta = newDeduction - oldDeduction;
      if (spendingDelta === 0 && newEmiAmount > 0) {
        spendingDelta = newEmiAmount;
      }

      if (spendingDelta > 0) {
        await adjustBankForMemberSpending(emiData.paidBy, spendingDelta, false);
      }

      const updatedEmi: EmiPlan = { ...emiData, id };
      setEmis((prev) => {
        const next = prev.map((e) => (e.id === id ? updatedEmi : e));
        localStorage.setItem('family_emis_cache', JSON.stringify(next));
        return next;
      });

      try {
        const docRef = doc(db, 'emis', id);
        await updateDoc(docRef, {
          title: emiData.title,
          totalAmount: emiData.totalAmount,
          emiAmount: emiData.emiAmount,
          tenureMonths: emiData.tenureMonths,
          paidMonths: emiData.paidMonths,
          startMonth: emiData.startMonth,
          paidBy: emiData.paidBy,
          category: emiData.category,
          notes: emiData.notes || '',
          status: emiData.status,
          interestRate: emiData.interestRate || 0,
          addedByMember: emiData.addedByMember || activeMember,
        });
      } catch (err) {
        console.warn('Error updating EMI in Firestore:', err);
      }
    } else {
      const tempId = `emi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newEmi: EmiPlan = { ...emiData, id: tempId };

      // Deduct EMI amount from member's bank account for new EMI (without updating total spent overrides)
      const initialDeduction = (emiData.paidMonths > 0 ? emiData.paidMonths : 1) * emiData.emiAmount;
      if (initialDeduction > 0) {
        await adjustBankForMemberSpending(emiData.paidBy, initialDeduction, false);
      }

      setEmis((prev) => {
        const next = [newEmi, ...prev];
        localStorage.setItem('family_emis_cache', JSON.stringify(next));
        return next;
      });

      try {
        const emisRef = collection(db, 'emis');
        const docRef = await addDoc(emisRef, {
          ...emiData,
          createdAt: new Date().toISOString(),
        });
        setEmis((prev) => {
          const next = prev.map((e) => (e.id === tempId ? { ...e, id: docRef.id } : e));
          localStorage.setItem('family_emis_cache', JSON.stringify(next));
          return next;
        });
      } catch (err) {
        console.warn('Error adding EMI to Firestore:', err);
      }
    }
  };

  const handleDeleteEmi = async (emiId: string) => {
    setEmis((prev) => {
      const next = prev.filter((e) => e.id !== emiId);
      localStorage.setItem('family_emis_cache', JSON.stringify(next));
      return next;
    });

    try {
      const docRef = doc(db, 'emis', emiId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Error deleting EMI from Firestore:', err);
    }
  };

  const handleRecordEmiPayment = async (emi: EmiPlan, monthKey: string) => {
    const newPaidMonths = emi.paidMonths + 1;
    const isCompleted = newPaidMonths >= emi.tenureMonths;
    const updatedHistory = Array.from(new Set([...(emi.paymentHistory || []), monthKey]));

    const updatedEmi: EmiPlan = {
      ...emi,
      paidMonths: newPaidMonths,
      status: isCompleted ? 'completed' : 'active',
      paymentHistory: updatedHistory,
    };

    setEmis((prev) => {
      const next = prev.map((e) => (e.id === emi.id ? updatedEmi : e));
      localStorage.setItem('family_emis_cache', JSON.stringify(next));
      return next;
    });

    // 1. Add expense entry into Firestore expenses collection
    await handleSaveExpense({
      amount: emi.emiAmount,
      category: emi.category || 'EMI',
      paidBy: emi.paidBy,
      date: `${monthKey}-05`,
      notes: `EMI Installment (${newPaidMonths}/${emi.tenureMonths}): ${emi.title}`,
      addedByMember: activeMember,
      isEmiPayment: true,
      emiPlanId: emi.id,
    });

    // 2. Deduct EMI amount from member's bank account (without updating total spent overrides)
    await adjustBankForMemberSpending(emi.paidBy, Number(emi.emiAmount) || 0, false);

    // 3. Update EMI document
    try {
      const emiDocRef = doc(db, 'emis', emi.id);
      await updateDoc(emiDocRef, {
        paidMonths: newPaidMonths,
        status: isCompleted ? 'completed' : 'active',
        paymentHistory: updatedHistory,
      });
    } catch (err) {
      console.warn('Error updating EMI record in Firestore:', err);
    }
  };

  // Helper to deduct spending from member's bank account (or refund on delete/edit)
  const adjustBankForMemberSpending = async (
    member: FamilyMember, 
    spendingDelta: number,
    updateSpentOverrides: boolean = true
  ) => {
    if (!member || spendingDelta === 0) return;

    setMemberBankAmounts((prev) => {
      const currentObj = prev[member] || {
        id: member,
        member,
        pendingBankAmount: DEFAULT_MEMBER_BANK_AMOUNTS[member]?.pendingBankAmount || 0,
        bankName: DEFAULT_MEMBER_BANK_AMOUNTS[member]?.bankName || 'Bank Transfer',
        upiId: DEFAULT_MEMBER_BANK_AMOUNTS[member]?.upiId || '',
        notes: DEFAULT_MEMBER_BANK_AMOUNTS[member]?.notes || '',
        status: DEFAULT_MEMBER_BANK_AMOUNTS[member]?.status || 'pending',
        lastUpdated: DEFAULT_MEMBER_BANK_AMOUNTS[member]?.lastUpdated || new Date().toISOString().split('T')[0],
      };

      const currentAmt = Number(currentObj.pendingBankAmount) || 0;
      const newAmt = Math.max(0, currentAmt - spendingDelta);
      const newStatus = newAmt <= 0 ? 'received' : 'pending';

      const currentOverride = currentObj.customTotalSpentOverride;
      let newOverride = currentOverride;
      if (updateSpentOverrides && currentOverride !== undefined && currentOverride !== null && !isNaN(Number(currentOverride))) {
        newOverride = Math.max(0, Number(currentOverride) + spendingDelta);
      }

      const currentMonthOverride = currentObj.customMonthSpentOverride;
      let newMonthOverride = currentMonthOverride;
      if (updateSpentOverrides && currentMonthOverride !== undefined && currentMonthOverride !== null && !isNaN(Number(currentMonthOverride))) {
        newMonthOverride = Math.max(0, Number(currentMonthOverride) + spendingDelta);
      }

      const updatedObj: MemberBankAmount = {
        ...currentObj,
        pendingBankAmount: newAmt,
        status: newStatus,
        customTotalSpentOverride: newOverride,
        customMonthSpentOverride: newMonthOverride,
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      // Persist to Firestore asynchronously
      const docRef = doc(db, 'memberBankAmounts', member);
      const payloadToSave: Record<string, any> = {
        member,
        pendingBankAmount: newAmt,
        bankName: updatedObj.bankName || 'Bank Transfer',
        upiId: updatedObj.upiId || '',
        notes: updatedObj.notes || '',
        status: newStatus,
        lastUpdated: updatedObj.lastUpdated,
      };
      if (newOverride !== undefined) {
        payloadToSave.customTotalSpentOverride = newOverride;
      }
      if (newMonthOverride !== undefined) {
        payloadToSave.customMonthSpentOverride = newMonthOverride;
      }

      setDoc(docRef, payloadToSave, { merge: true }).catch((err) => {
        console.warn('Error persisting bank amount deduction to Firestore:', err);
      });

      const nextMap = {
        ...prev,
        [member]: updatedObj,
      };
      localStorage.setItem('family_member_bank_amounts_cache', JSON.stringify(nextMap));
      return nextMap;
    });
  };

  // Update Budget in Firestore and distribute across member bank accounts
  const handleUpdateBudget = async (newBudget: number) => {
    setMonthlyBudget(newBudget);
    localStorage.setItem('family_monthly_budget_cache', String(newBudget));

    // Distribute total budget across member bank accounts so total bank accounts = total budget
    const count = familyMembers.length || 1;
    const perMember = Math.round(newBudget / count);

    const updatedMap = { ...memberBankAmounts };
    for (const m of familyMembers) {
      const updatedObj = {
        ...(updatedMap[m] || { member: m }),
        pendingBankAmount: perMember,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      updatedMap[m] = updatedObj as MemberBankAmount;

      try {
        const docRef = doc(db, 'memberBankAmounts', m);
        await setDoc(docRef, { pendingBankAmount: perMember, lastUpdated: new Date().toISOString().split('T')[0] }, { merge: true });
      } catch (e) {
        console.warn('Error syncing member bank amount during budget update:', e);
      }
    }
    setMemberBankAmounts(updatedMap);
    localStorage.setItem('family_member_bank_amounts_cache', JSON.stringify(updatedMap));

    try {
      const budgetDocRef = doc(db, 'budgets', selectedMonth);
      await setDoc(budgetDocRef, {
        monthlyBudget: newBudget,
        month: selectedMonth,
      }, { merge: true });
    } catch (err) {
      console.error('Error updating budget:', err);
    }
  };

  // Save or Update Expense in Firestore & localStorage
  const handleSaveExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newAmount = Number(expenseData.amount) || 0;
    const newPaidBy = expenseData.paidBy;

    if (editingExpense) {
      const oldAmount = Number(editingExpense.amount) || 0;
      const oldPaidBy = editingExpense.paidBy;

      const updatedExpense: Expense = {
        ...editingExpense,
        ...expenseData,
      };

      setExpenses((prev) => {
        const next = prev.map((e) => (e.id === editingExpense.id ? updatedExpense : e));
        localStorage.setItem('family_expenses_cache', JSON.stringify(next));
        return next;
      });

      setEditingExpense(null);

      try {
        const docRef = doc(db, 'expenses', editingExpense.id);
        await updateDoc(docRef, {
          amount: expenseData.amount,
          category: expenseData.category,
          paidBy: expenseData.paidBy,
          date: expenseData.date,
          notes: expenseData.notes,
          addedByMember: expenseData.addedByMember,
        });

        if (oldPaidBy === newPaidBy) {
          const delta = newAmount - oldAmount;
          await adjustBankForMemberSpending(newPaidBy, delta);
        } else {
          await adjustBankForMemberSpending(oldPaidBy, -oldAmount);
          await adjustBankForMemberSpending(newPaidBy, newAmount);
        }
      } catch (err: any) {
        console.warn('Firestore write warning in handleSaveExpense (saved locally):', err);
      }
    } else {
      const tempId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const localNewExpense: Expense = {
        id: tempId,
        ...expenseData,
      };

      setExpenses((prev) => {
        const next = [localNewExpense, ...prev];
        localStorage.setItem('family_expenses_cache', JSON.stringify(next));
        return next;
      });

      try {
        const expensesRef = collection(db, 'expenses');
        const docRef = await addDoc(expensesRef, {
          ...expenseData,
          createdAt: new Date().toISOString(),
        });

        setExpenses((prev) => {
          const next = prev.map((e) => (e.id === tempId ? { ...e, id: docRef.id } : e));
          localStorage.setItem('family_expenses_cache', JSON.stringify(next));
          return next;
        });

        await adjustBankForMemberSpending(newPaidBy, newAmount);
      } catch (err: any) {
        console.warn('Firestore addDoc warning in handleSaveExpense (saved locally):', err);
        await adjustBankForMemberSpending(newPaidBy, newAmount);
      }
    }
  };

  // Delete Expense from Firestore & localStorage
  const handleDeleteExpense = async (expenseId: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== expenseId);
      localStorage.setItem('family_expenses_cache', JSON.stringify(next));
      return next;
    });

    try {
      const expenseToDelete = expenses.find((e) => e.id === expenseId);
      if (expenseToDelete) {
        const amountToRefund = Number(expenseToDelete.amount) || 0;
        const paidBy = expenseToDelete.paidBy;

        const docRef = doc(db, 'expenses', expenseId);
        await deleteDoc(docRef);

        // Refund deducted amount back to member's bank account
        await adjustBankForMemberSpending(paidBy, -amountToRefund);

        // If this expense was linked to an EMI plan, revert payment in EMI record
        if (expenseToDelete.isEmiPayment && expenseToDelete.emiPlanId) {
          const emi = emis.find((e) => e.id === expenseToDelete.emiPlanId);
          if (emi) {
            const monthKey = expenseToDelete.date ? expenseToDelete.date.slice(0, 7) : selectedMonth;
            const updatedHistory = (emi.paymentHistory || []).filter((m) => m !== monthKey);
            const newPaidMonths = Math.max(0, emi.paidMonths - 1);
            const emiDocRef = doc(db, 'emis', emi.id);
            await updateDoc(emiDocRef, {
              paidMonths: newPaidMonths,
              status: newPaidMonths >= emi.tenureMonths ? 'completed' : 'active',
              paymentHistory: updatedHistory,
            });
          }
        }
      } else {
        const docRef = doc(db, 'expenses', expenseId);
        await deleteDoc(docRef);
      }
    } catch (err) {
      console.warn("Failed to delete expense from Firestore:", err);
    }
  };

  // SIP Management Handlers
  const handleLogSipPayment = async (sip: SipPlan, month: string) => {
    try {
      const alreadyLogged = sip.paymentHistory?.includes(month);
      if (alreadyLogged) return;

      const newCompleted = (sip.completedMonths || 0) + 1;
      const totalMonths = (sip.tenureYears || 10) * 12;
      const updatedHistory = Array.from(new Set([...(sip.paymentHistory || []), month]));
      const isCompleted = newCompleted >= totalMonths;

      const updatedSip: SipPlan = {
        ...sip,
        completedMonths: newCompleted,
        status: isCompleted ? 'completed' : sip.status || 'active',
        paymentHistory: updatedHistory,
      };

      setSips((prev) => {
        const next = prev.map((s) => (s.id === sip.id ? updatedSip : s));
        localStorage.setItem('family_sips_cache', JSON.stringify(next));
        return next;
      });

      // 1. Log expense entry for SIP investment
      await handleSaveExpense({
        amount: sip.monthlyAmount,
        category: 'Others',
        paidBy: sip.paidBy,
        date: `${month}-05`,
        notes: `SIP Investment: ${sip.title} (${sip.fundCategory || 'Mutual Funds'})`,
        addedByMember: activeMember,
      });

      // 2. Update member bank deduction
      await adjustBankForMemberSpending(sip.paidBy, sip.monthlyAmount);

      // 3. Update SIP plan completed months & history in Firestore
      const sipDocRef = doc(db, 'sips', sip.id);
      await updateDoc(sipDocRef, {
        completedMonths: newCompleted,
        status: isCompleted ? 'completed' : sip.status || 'active',
        paymentHistory: updatedHistory,
      });
    } catch (err) {
      console.warn('Error logging SIP payment:', err);
    }
  };

  const handleAddSip = async (sipData: Omit<SipPlan, 'id'>) => {
    // Debit monthly SIP amount from member's bank account when SIP is added
    const amountToDebit = Number(sipData.monthlyAmount) || 0;
    if (amountToDebit > 0) {
      await adjustBankForMemberSpending(sipData.paidBy, amountToDebit, false);
    }

    const tempId = `sip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSip: SipPlan = { ...sipData, id: tempId };

    setSips((prev) => {
      const next = [newSip, ...prev];
      localStorage.setItem('family_sips_cache', JSON.stringify(next));
      return next;
    });

    try {
      const sipsRef = collection(db, 'sips');
      const docRef = await addDoc(sipsRef, {
        ...sipData,
        createdAt: new Date().toISOString(),
      });
      setSips((prev) => {
        const next = prev.map((s) => (s.id === tempId ? { ...s, id: docRef.id } : s));
        localStorage.setItem('family_sips_cache', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.warn('Error adding SIP plan to Firestore:', err);
    }
  };

  const handleUpdateSip = async (id: string, updates: Partial<SipPlan>) => {
    setSips((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      localStorage.setItem('family_sips_cache', JSON.stringify(next));
      return next;
    });

    try {
      const sipDocRef = doc(db, 'sips', id);
      await updateDoc(sipDocRef, updates);
    } catch (err) {
      console.warn('Error updating SIP plan in Firestore:', err);
    }
  };

  const handleDeleteSip = async (id: string) => {
    setSips((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem('family_sips_cache', JSON.stringify(next));
      return next;
    });

    try {
      const sipDocRef = doc(db, 'sips', id);
      await deleteDoc(sipDocRef);
    } catch (err) {
      console.warn('Error deleting SIP plan from Firestore:', err);
    }
  };

  // Restore expenses handler
  const handleRestoreExpenses = async (restoredExpenses: Expense[]) => {
    if (!restoredExpenses || restoredExpenses.length === 0) return;

    // Ensure every item has a unique ID
    const formattedExpenses: Expense[] = restoredExpenses.map((exp, idx) => ({
      ...exp,
      id: exp.id || `restored_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    }));

    // Update local state and localStorage cache
    setExpenses(formattedExpenses);
    localStorage.setItem('family_expenses_cache', JSON.stringify(formattedExpenses));

    // Save/Update in Firestore
    try {
      for (const item of formattedExpenses) {
        const docRef = doc(db, 'expenses', item.id);
        await setDoc(docRef, {
          ...item,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Error restoring expenses into Firestore:', e);
    }
  };

  // Full PIN-Protected App Reset Handler
  const handleResetApp = async () => {
    try {
      const collectionsToClear = [
        'expenses',
        'emis',
        'sips',
        'debts',
        'memberBankAmounts',
        'budgets',
        'memberConfigs',
        'familyTotalOverrides'
      ];

      for (const colName of collectionsToClear) {
        try {
          const snap = await getDocs(collection(db, colName));
          const deletes = snap.docs.map((docSnap) => deleteDoc(doc(db, colName, docSnap.id)));
          await Promise.all(deletes);
        } catch (e) {
          console.warn(`Error clearing collection ${colName}:`, e);
        }
      }

      setExpenses([]);
      setEmis([]);
      setSips([]);
      setDebts([]);
      setMemberBankAmounts({});
      setMemberConfigs({});

      localStorage.clear();
      localStorage.setItem('has_seeded_v3', 'true');
      localStorage.setItem('has_seeded_bank_v1', 'true');
      localStorage.setItem('has_seeded_emis_v2', 'true');
      localStorage.setItem('has_seeded_sips_v1', 'true');
      localStorage.setItem('has_seeded_debts_v1', 'true');
    } catch (e) {
      console.error('Error resetting entire app:', e);
    }
  };

  // Calculate monthly & all-time totals per member
  const memberTotals: Record<string, number> = {};
  const allTimeMemberTotals: Record<string, number> = {};

  familyMembers.forEach((m) => {
    memberTotals[m] = 0;
    allTimeMemberTotals[m] = 0;
  });

  expenses.forEach((e) => {
    if (allTimeMemberTotals[e.paidBy] !== undefined) {
      allTimeMemberTotals[e.paidBy] += Number(e.amount) || 0;
    } else {
      allTimeMemberTotals[e.paidBy] = Number(e.amount) || 0;
    }
  });

  // Apply customTotalSpentOverride if specified for a member
  familyMembers.forEach((m) => {
    const override = memberBankAmounts?.[m]?.customTotalSpentOverride;
    if (override !== undefined && override !== null && !isNaN(Number(override))) {
      allTimeMemberTotals[m] = Number(override);
    }
  });

  const currentMonthExpenses = expenses.filter(
    (e) => e.date && e.date.startsWith(selectedMonth)
  );

  currentMonthExpenses.forEach((e) => {
    if (memberTotals[e.paidBy] !== undefined) {
      memberTotals[e.paidBy] += Number(e.amount) || 0;
    } else {
      memberTotals[e.paidBy] = Number(e.amount) || 0;
    }
  });

  // Apply customMonthSpentOverride if specified for a member
  familyMembers.forEach((m) => {
    const override = memberBankAmounts?.[m]?.customMonthSpentOverride;
    if (override !== undefined && override !== null && !isNaN(Number(override))) {
      memberTotals[m] = Number(override);
    }
  });

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-slate-950 text-slate-100 dark'
        : 'bg-slate-100 text-slate-900'
    } ${isRatio916 ? 'py-0 sm:py-6 flex flex-col items-center justify-start' : ''}`}>

      {/* Toast Notification Banner for Automated 7-Day Backup */}
      {autoBackupToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white">7-Day Auto-Backup</p>
              <p className="text-[11px] text-slate-300 font-medium truncate">{autoBackupToast}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoBackupToast(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 9:16 Aspect Ratio Frame or Responsive Canvas Container */}
      <div className={`w-full transition-all duration-300 ${
        isRatio916
          ? 'max-w-[450px] w-full min-h-screen sm:min-h-[880px] sm:max-h-[920px] bg-slate-50 dark:bg-slate-900 sm:rounded-[40px] sm:border-[8px] sm:border-slate-900 sm:dark:border-slate-800 sm:shadow-2xl flex flex-col overflow-y-auto overflow-x-hidden relative'
          : 'max-w-7xl mx-auto flex flex-col min-h-screen'
      }`}>

        {/* 9:16 Smartphone Frame Camera Notch / Status Bar (Desktop Display) */}
        {isRatio916 && (
          <div className="hidden sm:flex items-center justify-between px-6 py-2 bg-slate-950 text-slate-300 text-[10px] font-mono tracking-wider border-b border-slate-800/80 shrink-0 select-none z-40">
            <span className="font-bold text-slate-200">9:16 ratio</span>
            {/* Dynamic Camera Notch pill */}
            <div className="w-20 h-3.5 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            </div>
            <span className="text-emerald-400 font-extrabold">100% ⚡</span>
          </div>
        )}

        {/* Top Header */}
        <Header
          activeMember={activeMember}
          onSelectMember={handleSelectMember}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddExpense={() => {
            setEditingExpense(null);
            setIsAddModalOpen(true);
          }}
          isSyncing={isSyncing}
          totalExpensesCount={expenses.length}
          theme={theme}
          activeEmisCount={emis.filter(e => e.status === 'active').length}
          activeSipsCount={sips.filter(s => s.status === 'active' || !s.status).length}
          activeDebtsCount={debts.filter(d => d.status === 'active').length}
          language={language}
          familyMembers={familyMembers}
          memberConfigs={memberConfigs}
          onOpenSettings={() => setIsAppSettingsModalOpen(true)}
          brandingSettings={brandingSettings}
        />

        {/* Family Member Quick Selector Bar */}
        <ActiveMemberBar
          activeMember={activeMember}
          onSelectMember={handleSelectMember}
          memberTotals={memberTotals}
          allTimeMemberTotals={allTimeMemberTotals}
          allExpenses={expenses}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          memberBankAmounts={memberBankAmounts}
          onUpdateBankAmount={handleUpdateMemberBankAmount}
          theme={theme}
          familyMembers={familyMembers}
          memberConfigs={memberConfigs}
          onOpenManageMembers={() => setIsManageMembersModalOpen(true)}
          onOpenExportImport={() => setIsExportImportModalOpen(true)}
          onOpenBankTransfer={() => setIsBankTransferModalOpen(true)}
          emis={emis}
          language={language}
        />

        {/* Main Content Area */}
        <main className={`flex-1 ${isRatio916 ? 'px-3 py-4 pb-20' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full'}`}>
          
          {activeTab === 'dashboard' && (
            <DashboardView
              expenses={expenses}
              monthlyBudget={monthlyBudget}
              onUpdateBudget={handleUpdateBudget}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setIsAddModalOpen(true);
              }}
              onSaveExpense={handleSaveExpense}
              onEditExpense={(expense) => {
                setEditingExpense(expense);
                setIsAddModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              activeMember={activeMember}
              emis={emis}
              onSaveEmi={handleSaveEmi}
              onDeleteEmi={handleDeleteEmi}
              memberBankAmounts={memberBankAmounts}
              onUpdateBankAmount={handleUpdateMemberBankAmount}
              onOpenBankTransfer={() => setIsBankTransferModalOpen(true)}
              onNavigateTab={setActiveTab}
              onSelectMember={handleSelectMember}
              language={language}
              familyMembers={familyMembers}
              memberConfigs={memberConfigs}
              onOpenManageMembers={() => setIsManageMembersModalOpen(true)}
              isPdfModalOpen={isPdfModalOpen}
              setIsPdfModalOpen={setIsPdfModalOpen}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionHistoryLog
              expenses={expenses}
              onEditExpense={(expense) => {
                setEditingExpense(expense);
                setIsAddModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              selectedMonth={selectedMonth}
              language={language}
              familyMembers={familyMembers}
              memberConfigs={memberConfigs}
              onRestoreExpenses={handleRestoreExpenses}
              onOpenExportImport={() => setIsExportImportModalOpen(true)}
            />
          )}

          {activeTab === 'sips' && (
            <SipTrackerView
              sips={sips}
              onAddSip={handleAddSip}
              onUpdateSip={handleUpdateSip}
              onDeleteSip={handleDeleteSip}
              onLogSipPayment={handleLogSipPayment}
              selectedMonth={selectedMonth}
              familyMembers={familyMembers}
              activeMember={activeMember}
              memberConfigs={memberConfigs}
              language={language}
              theme={theme}
            />
          )}

          {activeTab === 'emis' && (
            <EmiTrackerView
              emis={emis}
              activeMember={activeMember}
              onSaveEmi={handleSaveEmi}
              onDeleteEmi={handleDeleteEmi}
              onRecordPayment={handleRecordEmiPayment}
              selectedMonth={selectedMonth}
              language={language}
              familyMembers={familyMembers}
              memberConfigs={memberConfigs}
            />
          )}

          {activeTab === 'debts' && (
            <DebtTrackerView
              debts={debts}
              familyMembers={familyMembers}
              activeMember={activeMember}
              memberConfigs={memberConfigs}
              theme={theme}
              language={language}
              onSaveDebt={handleSaveDebt}
              onDeleteDebt={handleDeleteDebt}
              onLogDebtPayment={handleLogDebtPayment}
            />
          )}

          {activeTab === 'android-guide' && (
            <AndroidGuideView />
          )}

          {/* Bottom App Footer Section with Export / Import */}
          <div className="mt-10 pt-6 pb-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Family Expense Tracker</span>
              <span>•</span>
              <span>Data Export & Backup Tools</span>
            </div>

            <button
              type="button"
              onClick={() => setIsExportImportModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                theme === 'dark'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/90 hover:bg-emerald-900'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Export or Import PDF/CSV reports and backup data"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export & Import Data (PDF / CSV)</span>
            </button>
          </div>

        </main>

        {/* Persistent Bottom Sticky Bar (Mobile Nav + Running Financial Quote Ticker) */}
        <footer className="sticky bottom-0 left-0 right-0 z-40 w-full shrink-0 shadow-lg">
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsAddModalOpen(true);
            }}
            theme={theme}
            language={language}
            activeEmisCount={emis.filter(e => e.status === 'active').length}
            activeSipsCount={sips.filter(s => s.status === 'active' || !s.status).length}
            activeDebtsCount={debts.filter(d => d.status === 'active').length}
          />
          <RunningTicker theme={theme} />
        </footer>

      </div>

      {/* Modal for Adding / Editing Expense */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        onSaveExpense={handleSaveExpense}
        activeMember={activeMember}
        initialData={editingExpense}
        language={language}
        familyMembers={familyMembers}
        memberConfigs={memberConfigs}
      />

      {/* Manage Family Members Modal */}
      <ManageMembersModal
        isOpen={isManageMembersModalOpen}
        onClose={() => setIsManageMembersModalOpen(false)}
        familyMembers={familyMembers}
        memberConfigs={memberConfigs}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onUpdateMember={handleUpdateMember}
        adminPin={adminPin}
        theme={theme}
        onOpenChangePinModal={handleOpenChangePinModal}
        expenses={expenses}
        memberBankAmounts={memberBankAmounts}
        emis={emis}
      />

      {/* Admin Security PIN Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={handleConfirmAdminSwitch}
        currentAdminPin={adminPin}
        onUpdatePin={handleUpdateAdminPin}
        adminName={ADMIN_MEMBER}
        theme={theme}
        initialMode={adminPinModalMode}
      />

      {/* Export & Import Data Modal */}
      <ExportImportModal
        isOpen={isExportImportModalOpen}
        onClose={() => setIsExportImportModalOpen(false)}
        expenses={expenses}
        selectedMonth={selectedMonth}
        monthlyBudget={monthlyBudget}
        memberTotals={familyMembers.reduce((acc, m) => {
          acc[m] = {
            amount: memberTotals[m] || 0,
            count: currentMonthExpenses.filter(e => e.paidBy === m).length
          };
          return acc;
        }, {} as Record<string, { amount: number; count: number }>)}
        allTimeMemberTotals={allTimeMemberTotals}
        memberBankAmounts={memberBankAmounts}
        emis={emis}
        activeMember={activeMember}
        theme={theme}
        language={language}
        familyMembers={familyMembers}
        memberConfigs={memberConfigs}
        onResetApp={handleResetApp}
      />

      {/* Family Web App Link & QR Share Modal */}
      <WebAppLinkModal
        isOpen={isWebAppLinkModalOpen}
        onClose={() => setIsWebAppLinkModalOpen(false)}
        theme={theme}
        language={language}
      />

      {/* 20 App Theme Variations Modal */}
      <ThemeVariationsModal
        isOpen={isThemeVariationsModalOpen}
        onClose={() => setIsThemeVariationsModalOpen(false)}
        currentVariationId={appVariation}
        onSelectVariation={(id) => {
          setAppVariation(id);
        }}
        language={language}
      />

      {/* App Letters & Typography Settings Modal (Bold, Thin, Cases) */}
      <TypographyModal
        isOpen={isTypographyModalOpen}
        onClose={() => setIsTypographyModalOpen(false)}
        language={language}
      />

      {/* Unified App Settings & Preferences Modal */}
      <AppSettingsModal
        isOpen={isAppSettingsModalOpen}
        onClose={() => setIsAppSettingsModalOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        appVariation={appVariation}
        onOpenThemeVariations={() => setIsThemeVariationsModalOpen(true)}
        onOpenTypography={() => setIsTypographyModalOpen(true)}
        isRatio916={isRatio916}
        onToggleRatio916={handleToggleRatio916}
        activeMember={activeMember}
        familyMembers={familyMembers}
        memberConfigs={memberConfigs}
        onSelectMember={handleSelectMember}
        onOpenManageMembers={() => setIsManageMembersModalOpen(true)}
        adminPin={adminPin}
        onOpenChangePinModal={handleOpenChangePinModal}
        onOpenExportImport={() => setIsExportImportModalOpen(true)}
        onOpenPdfSummary={() => {
          setActiveTab('dashboard');
          setIsPdfModalOpen(true);
        }}
        onOpenWebLinkModal={() => setIsWebAppLinkModalOpen(true)}
        brandingSettings={brandingSettings}
        onUpdateBrandingSettings={handleUpdateBrandingSettings}
      />

      {/* Bank to Bank Transfer Modal */}
      <BankTransferModal
        isOpen={isBankTransferModalOpen}
        onClose={() => setIsBankTransferModalOpen(false)}
        familyMembers={familyMembers}
        memberConfigs={memberConfigs}
        memberBankAmounts={memberBankAmounts}
        onUpdateBankAmount={handleUpdateMemberBankAmount}
        onSaveExpense={handleSaveExpense}
        activeMember={activeMember}
        language={language}
        theme={theme}
      />

    </div>
  );
}
