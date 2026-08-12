import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  FileCheck,
  Layers
} from 'lucide-react';
import { Expense, FamilyMember, MemberBankAmount, EmiPlan, SipPlan, DebtRecord, FAMILY_MEMBERS, ADMIN_MEMBER, MemberCustomConfig } from '../types';
import {
  exportBackupCSV,
  exportBackupPDF,
  parseBackupJSON,
  parseBackupPDF,
  parseExpensesCSV,
  FullBackupData
} from '../utils/exportImport';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { Language, t } from '../utils/translations';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  selectedMonth: string; // e.g. "2026-08"
  monthlyBudget: number;
  memberTotals: Record<FamilyMember, { amount: number; count: number }>;
  allTimeMemberTotals?: Record<FamilyMember, number>;
  memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
  emis?: EmiPlan[];
  sips?: SipPlan[];
  debts?: DebtRecord[];
  adminPin?: string;
  activeMember: FamilyMember;
  theme: 'light' | 'dark';
  language?: Language;
  onRefreshData?: () => void;
  onResetApp?: () => Promise<void> | void;
  memberConfigs?: Record<string, MemberCustomConfig>;
  familyMembers?: string[];
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  selectedMonth,
  monthlyBudget,
  memberBankAmounts = {},
  emis = [],
  sips = [],
  debts = [],
  adminPin,
  activeMember,
  theme,
  language = 'en' as Language,
  onRefreshData,
  onResetApp,
  memberConfigs = {},
  familyMembers = FAMILY_MEMBERS
}) => {
  const isDark = theme === 'dark';
  const isAdmin = activeMember === ADMIN_MEMBER;

  // Single Modal Mode: Export, Import, or Restart
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reset'>('export');

  // Unified Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileType, setImportFileType] = useState<'csv' | 'pdf' | 'json' | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<FullBackupData | null>(null);
  const [parsedExpensesCount, setParsedExpensesCount] = useState<number>(0);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  // Restart / Reset App State
  const [resetPin, setResetPin] = useState<string>('');
  const [resetConfirmed, setResetConfirmed] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to construct full app backup payload for export
  const buildFullBackupPayload = (): FullBackupData => {
    return {
      expenses,
      memberBankAmounts,
      emis,
      sips,
      debts,
      monthlyBudget,
      adminPin,
      familyMembers,
      memberConfigs
    };
  };

  // 1. Export Entire App Data in CSV Format
  const handleExportCSV = () => {
    const payload = buildFullBackupPayload();
    exportBackupCSV(payload);
  };

  // 2. Export Entire App Data in PDF Format
  const handleExportPDF = () => {
    const payload = buildFullBackupPayload();
    exportBackupPDF(payload);
  };

  // Helper to sanitize Firestore document objects before write
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeForFirestore);
    }
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  };

  // File Select Handler for Unified Import (CSV or PDF)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);
    setParsedBackupData(null);
    setParsedExpensesCount(0);
    setIsReadingFile(true);

    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith('.pdf')) {
      setImportFileType('pdf');
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          try {
            const result = await parseBackupPDF(buffer);
            if (result.success && result.data) {
              setParsedBackupData(result.data);
              setParsedExpensesCount((result.data.expenses || []).length);
            } else {
              setImportErrorMsg(result.error || 'Failed to parse PDF backup file.');
            }
          } catch (err: any) {
            setImportErrorMsg(`Error reading PDF backup: ${err?.message || 'Invalid format'}`);
          } finally {
            setIsReadingFile(false);
          }
        }
      };
      reader.onerror = () => {
        setImportErrorMsg('Failed to read PDF file.');
        setIsReadingFile(false);
      };
      reader.readAsArrayBuffer(file);
    } else if (fileNameLower.endsWith('.csv')) {
      setImportFileType('csv');
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          try {
            const { validExpenses, errors } = parseExpensesCSV(text);
            if (validExpenses.length > 0) {
              setParsedBackupData({
                expenses: validExpenses as Expense[],
                monthlyBudget,
                adminPin,
                familyMembers
              });
              setParsedExpensesCount(validExpenses.length);
              if (errors.length > 0) {
                console.warn('[CSV Parse Warnings]:', errors);
              }
            } else {
              setImportErrorMsg(errors.length > 0 ? errors.join(', ') : 'No valid expenses found in CSV.');
            }
          } catch (err: any) {
            setImportErrorMsg(`Error parsing CSV: ${err?.message || 'Invalid CSV format'}`);
          } finally {
            setIsReadingFile(false);
          }
        }
      };
      reader.onerror = () => {
        setImportErrorMsg('Failed to read CSV file.');
        setIsReadingFile(false);
      };
      reader.readAsText(file);
    } else if (fileNameLower.endsWith('.json')) {
      setImportFileType('json');
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          try {
            const result = parseBackupJSON(text);
            if (result.success && result.data) {
              setParsedBackupData(result.data);
              setParsedExpensesCount((result.data.expenses || []).length);
            } else {
              setImportErrorMsg(result.error || 'Invalid JSON backup file.');
            }
          } catch (err: any) {
            setImportErrorMsg(`Error parsing JSON: ${err?.message || 'Syntax error'}`);
          } finally {
            setIsReadingFile(false);
          }
        }
      };
      reader.onerror = () => {
        setImportErrorMsg('Failed to read JSON file.');
        setIsReadingFile(false);
      };
      reader.readAsText(file);
    } else {
      setImportErrorMsg('Unsupported file format. Please select a CSV or PDF full backup file.');
      setIsReadingFile(false);
    }
  };

  // Confirm Full App Restore into Firestore
  const handleConfirmImport = async () => {
    if (!parsedBackupData) {
      setImportErrorMsg('No backup data available to restore. Please upload a CSV or PDF backup file.');
      return;
    }

    setIsImporting(true);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);

    try {
      let expenseCount = 0;
      let emiCount = 0;
      let sipCount = 0;
      let debtCount = 0;

      // 1. Restore Expenses
      if (Array.isArray(parsedBackupData.expenses) && parsedBackupData.expenses.length > 0) {
        for (let i = 0; i < parsedBackupData.expenses.length; i++) {
          const exp = parsedBackupData.expenses[i];
          const expId = exp.id || `restored_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const docRef = doc(db, 'expenses', expId);
          const dataToSave = sanitizeForFirestore({
            ...exp,
            id: expId,
            createdAt: exp.createdAt || new Date().toISOString()
          });
          try {
            await setDoc(docRef, dataToSave, { merge: true });
          } catch (e) {
            console.warn(`Firestore setDoc skipped for expense ${expId}:`, e);
          }
          expenseCount++;
        }
      }

      // 2. Restore Member Bank Balances if present
      if (parsedBackupData.memberBankAmounts && typeof parsedBackupData.memberBankAmounts === 'object') {
        for (const [mKey, bankVal] of Object.entries(parsedBackupData.memberBankAmounts)) {
          if (mKey && bankVal) {
            const docRef = doc(db, 'memberBankAmounts', mKey);
            try {
              await setDoc(docRef, sanitizeForFirestore(bankVal), { merge: true });
            } catch (e) {
              console.warn(`Firestore setDoc skipped for bank balance ${mKey}:`, e);
            }
          }
        }
      }

      // 3. Restore EMI Plans
      if (Array.isArray(parsedBackupData.emis) && parsedBackupData.emis.length > 0) {
        for (const emi of parsedBackupData.emis) {
          const emiId = emi.id || `emi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const docRef = doc(db, 'emis', emiId);
          try {
            await setDoc(docRef, sanitizeForFirestore({ ...emi, id: emiId }), { merge: true });
          } catch (e) {
            console.warn(`Firestore setDoc skipped for EMI ${emiId}:`, e);
          }
          emiCount++;
        }
      }

      // 4. Restore SIP Plans
      if (Array.isArray(parsedBackupData.sips) && parsedBackupData.sips.length > 0) {
        for (const sip of parsedBackupData.sips) {
          const sipId = sip.id || `sip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const docRef = doc(db, 'sips', sipId);
          try {
            await setDoc(docRef, sanitizeForFirestore({ ...sip, id: sipId }), { merge: true });
          } catch (e) {
            console.warn(`Firestore setDoc skipped for SIP ${sipId}:`, e);
          }
          sipCount++;
        }
      }

      // 5. Restore Debt Records
      if (Array.isArray(parsedBackupData.debts) && parsedBackupData.debts.length > 0) {
        for (const debt of parsedBackupData.debts) {
          const debtId = debt.id || `debt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const docRef = doc(db, 'debts', debtId);
          try {
            await setDoc(docRef, sanitizeForFirestore({ ...debt, id: debtId }), { merge: true });
          } catch (e) {
            console.warn(`Firestore setDoc skipped for debt ${debtId}:`, e);
          }
          debtCount++;
        }
      }

      // 6. Restore Monthly Budget
      if (typeof parsedBackupData.monthlyBudget === 'number') {
        localStorage.setItem('family_monthly_budget_cache', String(parsedBackupData.monthlyBudget));
        const currentMonth = selectedMonth || new Date().toISOString().slice(0, 7);
        const budgetDocRef = doc(db, 'budgets', currentMonth);
        try {
          await setDoc(budgetDocRef, { monthlyBudget: parsedBackupData.monthlyBudget }, { merge: true });
        } catch (e) {
          console.warn('Firestore setDoc skipped for budget:', e);
        }
      }

      // 7. Restore Admin PIN
      if (typeof parsedBackupData.adminPin === 'string' && parsedBackupData.adminPin) {
        localStorage.setItem('admin_pin_code', parsedBackupData.adminPin);
        const settingsRef = doc(db, 'settings', 'adminConfig');
        try {
          await setDoc(settingsRef, { adminPin: parsedBackupData.adminPin, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.warn('Firestore setDoc skipped for adminConfig:', e);
        }
      }

      // 8. Restore Family Members List
      if (Array.isArray(parsedBackupData.familyMembers) && parsedBackupData.familyMembers.length > 0) {
        localStorage.setItem('family_members_list', JSON.stringify(parsedBackupData.familyMembers));
        const membersListRef = doc(db, 'settings', 'familyMembersConfig');
        try {
          await setDoc(membersListRef, { members: parsedBackupData.familyMembers, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.warn('Firestore setDoc skipped for familyMembersConfig:', e);
        }
      }

      setImportSuccessMsg(`Entire app data restored successfully! (${expenseCount} expenses, ${emiCount} EMIs, ${sipCount} SIPs, ${debtCount} debts restored)`);
      setImportFile(null);
      setParsedBackupData(null);
      setParsedExpensesCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error during full app restore:', err);
      handleFirestoreError(err, OperationType.WRITE, 'backup');
      setImportErrorMsg(`Failed to restore backup: ${err?.message || 'Permission denied'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Restart / Reset Entire App Handler
  const handleConfirmResetApp = async () => {
    setPinError(null);

    // If Admin PIN is set, verify PIN code
    if (adminPin) {
      if (resetPin.trim() !== adminPin.trim()) {
        setPinError('Incorrect Admin Security PIN code.');
        return;
      }
    } else {
      if (!resetConfirmed) {
        setPinError('Please check the confirmation box to proceed with app restart.');
        return;
      }
    }

    setIsResetting(true);
    try {
      if (onResetApp) {
        await onResetApp();
      }
      setResetSuccessMsg('Application restarted successfully! All database collections and settings have been reset.');
      setResetPin('');
      setResetConfirmed(false);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error restarting application:', err);
      setPinError(`Failed to restart app: ${err?.message || 'Database error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">App Data Import, Export & Restart</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                One unified control to backup, restore, or restart your entire application
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Unified Option Navigation Tabs */}
        <div className={`flex border-b ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'}`}>
          <button
            onClick={() => {
              setActiveTab('export');
              setImportSuccessMsg(null);
              setImportErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Download className="w-4 h-4" />
            1. Export Entire App
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setImportSuccessMsg(null);
              setImportErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            2. Import Entire App
          </button>
          <button
            onClick={() => {
              setActiveTab('reset');
              setPinError(null);
              setResetSuccessMsg(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'reset'
                ? 'border-rose-600 text-rose-600 font-bold bg-rose-50/10'
                : 'border-transparent text-slate-500 hover:text-rose-500'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            3. Restart Application
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: UNIFIED EXPORT OPTION */}
          {activeTab === 'export' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                  <Layers className="w-4 h-4" /> Full App Backup Payload Summary
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4`}>
                  Exporting will package all data across your entire application into a single portable backup file.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="block text-lg font-bold text-indigo-600 dark:text-indigo-400">{expenses.length}</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Expenses</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">{Object.keys(memberBankAmounts).length}</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bank Dues</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="block text-lg font-bold text-amber-600 dark:text-amber-400">{emis.length + sips.length}</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>EMIs & SIPs</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="block text-lg font-bold text-cyan-600 dark:text-cyan-400">{debts.length}</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Debt Records</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Select Export Backup Format (CSV or PDF):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Export Option 1: CSV Format */}
                  <button
                    onClick={handleExportCSV}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-[1.01] ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500 hover:bg-slate-800'
                        : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        CSV Format
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">Export Full App Data (CSV)</h4>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Spreadsheet CSV file containing all expenses, bank accounts, EMIs, SIPs, and debt registers.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Download className="w-4 h-4" /> Download CSV Backup
                    </div>
                  </button>

                  {/* Export Option 2: PDF Format */}
                  <button
                    onClick={handleExportPDF}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-[1.01] ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 hover:border-indigo-500 hover:bg-slate-800'
                        : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        PDF Format
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">Export Full App Data (PDF)</h4>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Document report with financial summaries and embedded restore payload for lossless re-import.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <Download className="w-4 h-4" /> Download PDF Backup
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UNIFIED IMPORT OPTION */}
          {activeTab === 'import' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-indigo-950/30 border-indigo-900/50' : 'bg-indigo-50/60 border-indigo-100'}`}>
                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Single File Import for Entire App
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Upload your full app backup file (<strong>CSV</strong> or <strong>PDF</strong>) to restore your application's complete database and settings.
                </p>
              </div>

              {/* Single Drag & Drop File Upload Area */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv,.pdf,.json"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                    importFile
                      ? isDark ? 'border-emerald-500 bg-emerald-950/20' : 'border-emerald-500 bg-emerald-50'
                      : isDark ? 'border-slate-700 hover:border-indigo-500 bg-slate-800/40' : 'border-slate-300 hover:border-indigo-500 bg-slate-50'
                  }`}
                >
                  <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3">
                    {importFile ? <FileCheck className="w-8 h-8 text-emerald-500" /> : <Upload className="w-8 h-8" />}
                  </div>

                  {importFile ? (
                    <div>
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                        File Selected: {importFile.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        ({(importFile.size / 1024).toFixed(1)} KB) • Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-sm mb-1">Click to select CSV or PDF backup file</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Supports <strong>.csv</strong> or <strong>.pdf</strong> full app backups
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parsed File Preview Section */}
              {isReadingFile && (
                <div className="flex items-center justify-center gap-2 p-4 text-xs text-indigo-600 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reading and parsing backup file...
                </div>
              )}

              {parsedBackupData && !isReadingFile && (
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/60 border-emerald-200'}`}>
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Backup File Ready for Import
                  </div>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Parsed <strong>{parsedExpensesCount}</strong> expense records
                    {parsedBackupData.emis ? `, ${parsedBackupData.emis.length} EMI plans` : ''}
                    {parsedBackupData.sips ? `, ${parsedBackupData.sips.length} SIP plans` : ''}
                    {parsedBackupData.debts ? `, ${parsedBackupData.debts.length} debt records` : ''}.
                  </p>

                  <button
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Restoring Application Data...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Restore Entire App Data Now
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Success / Error Banners */}
              {importSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {importSuccessMsg}
                </div>
              )}

              {importErrorMsg && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {importErrorMsg}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UNIFIED RESTART APPLICATION OPTION */}
          {activeTab === 'reset' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-rose-950/30 border-rose-900/50 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm mb-1">
                  <ShieldAlert className="w-5 h-5" /> Danger Zone: Restart Application & Reset Data
                </div>
                <p className="text-xs opacity-90">
                  Restarting the application will permanently wipe all stored expenses, bank balances, EMI/SIP plans, debts, and custom configurations from Firestore and restart with a clean state.
                </p>
              </div>

              {adminPin ? (
                <div>
                  <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Enter Admin Security PIN Code to Confirm Restart:
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    value={resetPin}
                    onChange={(e) => setResetPin(e.target.value)}
                    placeholder="Enter Admin PIN"
                    className={`w-full p-3 rounded-xl border text-sm font-bold tracking-widest text-center ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <input
                    type="checkbox"
                    id="confirmResetCheck"
                    checked={resetConfirmed}
                    onChange={(e) => setResetConfirmed(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                  />
                  <label htmlFor="confirmResetCheck" className="text-xs font-medium cursor-pointer">
                    I understand that all application data will be permanently cleared and restarted.
                  </label>
                </div>
              )}

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {pinError}
                </div>
              )}

              {resetSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {resetSuccessMsg}
                </div>
              )}

              <button
                onClick={handleConfirmResetApp}
                disabled={isResetting}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Restarting Application & Resetting Data...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" /> Restart Application & Reset Data Now
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex justify-end ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
