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
  FileJson,
  Calendar,
  Layers,
  RefreshCw,
  ArrowRight,
  RotateCcw,
  Users
} from 'lucide-react';
import { Expense, FamilyMember, MemberBankAmount, EmiPlan, FAMILY_MEMBERS, ADMIN_MEMBER, MemberCustomConfig } from '../types';
import {
  exportExpensesToCSV,
  exportBankBalancesToCSV,
  exportBackupJSON,
  exportBackupPDF,
  exportExpensesToPDF,
  exportMemberDataToCSV,
  exportMemberDataToJSON,
  exportMemberDataToPDF,
  parseExpensesCSV,
  parseBackupJSON,
  parseBackupPDF,
  parseExpensesPDF
} from '../utils/exportImport';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { Language, t } from '../utils/translations';
import { MemberAvatar } from './MemberAvatar';

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
  memberTotals,
  allTimeMemberTotals,
  memberBankAmounts,
  emis = [],
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

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reset'>('export');

  // Export Filter State
  const [exportMonthRange, setExportMonthRange] = useState<'current' | 'all'>('current');

  // CSV Import State
  const [csvPreviewData, setCsvPreviewData] = useState<Omit<Expense, 'id'>[] | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  // JSON Import State
  const [jsonBackupData, setJsonBackupData] = useState<any | null>(null);
  const [jsonFileName, setJsonFileName] = useState<string>('');

  // PDF Import State
  const [pdfPreviewData, setPdfPreviewData] = useState<Omit<Expense, 'id'>[] | null>(null);
  const [pdfErrors, setPdfErrors] = useState<string[]>([]);
  const [pdfFileName, setPdfFileName] = useState<string>('');

  // Reset Tab PIN Code State
  const [resetPin, setResetPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const pdfBackupFileInputRef = useRef<HTMLInputElement>(null);

  // Automated Weekly PDF Backup State
  const [autoWeeklyBackupEnabled, setAutoWeeklyBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('auto_weekly_pdf_backup_enabled') !== 'false';
  });

  const [autoWeeklyLastTime, setAutoWeeklyLastTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('auto_weekly_pdf_backup_last_time');
    return saved ? Number(saved) : null;
  });

  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Expenses filtered for current selection
  const currentMonthExpenses = expenses.filter(
    e => e.month === selectedMonth || (e.date && e.date.startsWith(selectedMonth))
  );

  const expensesToExport = exportMonthRange === 'current' ? currentMonthExpenses : expenses;

  // Handle Export Actions
  const handleExportCSV = () => {
    exportExpensesToCSV(
      expensesToExport,
      exportMonthRange === 'current' ? selectedMonth : 'all_time'
    );
  };

  const handleExportPDF = () => {
    exportExpensesToPDF({
      expenses: currentMonthExpenses,
      selectedMonth,
      monthlyBudget,
      memberTotals,
      allTimeMemberTotals,
      memberBankAmounts,
      language
    });
  };

  const handleExportBankCSV = () => {
    if (memberBankAmounts) {
      exportBankBalancesToCSV(memberBankAmounts);
    }
  };

  const handleExportJSON = () => {
    exportBackupJSON({
      expenses,
      memberBankAmounts,
      emis,
      monthlyBudget
    });
  };

  const handleToggleAutoWeeklyBackup = () => {
    const nextState = !autoWeeklyBackupEnabled;
    setAutoWeeklyBackupEnabled(nextState);
    localStorage.setItem('auto_weekly_pdf_backup_enabled', String(nextState));
  };

  const handleTriggerWeeklyBackupNow = () => {
    exportBackupPDF({
      expenses,
      memberBankAmounts,
      emis,
      monthlyBudget
    });
    const now = Date.now();
    setAutoWeeklyLastTime(now);
    localStorage.setItem('auto_weekly_pdf_backup_last_time', String(now));
  };

  const handleExportPDFBackup = () => {
    exportBackupPDF({
      expenses,
      memberBankAmounts,
      emis,
      monthlyBudget
    });
  };

  // Handle CSV File Selection
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const { validExpenses, errors } = parseExpensesCSV(text);
        setCsvPreviewData(validExpenses);
        setCsvErrors(errors);
      }
    };
    reader.onerror = () => {
      setImportErrorMsg('Failed to read CSV file.');
    };
    reader.readAsText(file);
  };

  // Confirm CSV Import into Firestore
  const handleConfirmCSVImport = async () => {
    if (!csvPreviewData || csvPreviewData.length === 0) return;

    setIsImporting(true);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);

    try {
      const expensesRef = collection(db, 'expenses');
      let count = 0;

      for (const item of csvPreviewData) {
        await addDoc(expensesRef, {
          ...item,
          createdAt: new Date().toISOString()
        });
        count++;
      }

      setImportSuccessMsg(`Successfully imported ${count} expense records into Firestore database!`);
      setCsvPreviewData(null);
      setCsvErrors([]);
      setCsvFileName('');
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error importing CSV to Firestore:', err);
      setImportErrorMsg(`Failed to save records to Firestore: ${err?.message || 'Permission denied'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle JSON Backup File Selection
  const handleJSONFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonFileName(file.name);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = parseBackupJSON(text);
        if (result.success && result.data) {
          setJsonBackupData(result.data);
        } else {
          setImportErrorMsg(result.error || 'Invalid JSON file.');
          setJsonBackupData(null);
        }
      }
    };
    reader.readAsText(file);
  };

  // Handle PDF Backup File Selection
  const handlePDFBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonFileName(file.name);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        try {
          const result = await parseBackupPDF(buffer);
          if (result.success && result.data) {
            setJsonBackupData(result.data);
          } else {
            setImportErrorMsg(result.error || 'Invalid backup PDF file.');
            setJsonBackupData(null);
          }
        } catch (err: any) {
          setImportErrorMsg(`Failed to parse backup PDF: ${err?.message || 'Unknown error'}`);
          setJsonBackupData(null);
        } finally {
          setIsImporting(false);
        }
      }
    };
    reader.onerror = () => {
      setImportErrorMsg('Failed to read PDF backup file.');
      setIsImporting(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirm JSON Restore into Firestore
  const handleConfirmJSONRestore = async () => {
    if (!jsonBackupData) return;

    setIsImporting(true);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);

    try {
      let expenseCount = 0;

      // Restore Expenses
      if (Array.isArray(jsonBackupData.expenses) && jsonBackupData.expenses.length > 0) {
        const expensesRef = collection(db, 'expenses');
        for (const exp of jsonBackupData.expenses) {
          const { id, ...cleanExp } = exp;
          await addDoc(expensesRef, {
            ...cleanExp,
            createdAt: cleanExp.createdAt || new Date().toISOString()
          });
          expenseCount++;
        }
      }

      // Restore Member Bank Amounts if present
      if (jsonBackupData.memberBankAmounts && typeof jsonBackupData.memberBankAmounts === 'object') {
        for (const m of FAMILY_MEMBERS) {
          if (jsonBackupData.memberBankAmounts[m]) {
            const docRef = doc(db, 'memberBankAmounts', m);
            await setDoc(docRef, jsonBackupData.memberBankAmounts[m], { merge: true });
          }
        }
      }

      setImportSuccessMsg(`Full backup restored successfully! (${expenseCount} expenses added to Firestore)`);
      setJsonBackupData(null);
      setJsonFileName('');
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error restoring JSON backup:', err);
      setImportErrorMsg(`Failed to restore backup: ${err?.message || 'Permission denied'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle PDF Statement Selection
  const handlePDFFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        try {
          const { validExpenses, errors } = await parseExpensesPDF(buffer);
          setPdfPreviewData(validExpenses);
          setPdfErrors(errors);
        } catch (err: any) {
          setImportErrorMsg(`Failed to parse PDF file: ${err?.message || 'Unknown error'}`);
          setPdfPreviewData(null);
        } finally {
          setIsImporting(false);
        }
      }
    };
    reader.onerror = () => {
      setImportErrorMsg('Failed to read PDF file.');
      setIsImporting(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirm PDF Expenses Import into Firestore
  const handleConfirmPDFImport = async () => {
    if (!pdfPreviewData || pdfPreviewData.length === 0) return;

    setIsImporting(true);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);

    try {
      const expensesRef = collection(db, 'expenses');
      let count = 0;

      for (const item of pdfPreviewData) {
        await addDoc(expensesRef, {
          ...item,
          createdAt: new Date().toISOString()
        });
        count++;
      }

      setImportSuccessMsg(`Successfully imported ${count} expense records from PDF statement into Firestore!`);
      setPdfPreviewData(null);
      setPdfErrors([]);
      setPdfFileName('');
      if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error importing PDF expenses to Firestore:', err);
      setImportErrorMsg(`Failed to save PDF records to Firestore: ${err?.message || 'Permission denied'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className={`w-full max-w-3xl rounded-3xl p-5 sm:p-6 shadow-2xl border my-auto transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
      }`}>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl tracking-tight">Export & Import Family Data</h2>
              <p className="text-xs text-slate-400 font-medium">
                Download PDF/CSV reports or import CSV/JSON files directly into Firestore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'export'
                ? isDark
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-white text-indigo-700 shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export Reports (PDF / CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'import'
                ? isDark
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-white text-indigo-700 shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Import Data</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'reset'
                ? isDark
                  ? 'bg-rose-900 text-rose-100 shadow-md'
                  : 'bg-rose-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Reset App</span>
          </button>
        </div>

        {/* Notification Banners */}
        {importSuccessMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {importErrorMsg && (
          <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{importErrorMsg}</span>
          </div>
        )}

        {/* TAB 1: EXPORT DATA */}
        {activeTab === 'export' && (
          <div className="space-y-5 mt-5">
            
            {/* Range Selector */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Select Data Range to Export:
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  {exportMonthRange === 'current' ? `Month: ${selectedMonth} (${currentMonthExpenses.length} entries)` : `All-Time (${expenses.length} entries)`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportMonthRange('current')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                    exportMonthRange === 'current'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Selected Month ({selectedMonth})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportMonthRange('all')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                    exportMonthRange === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>All-Time Expenses ({expenses.length})</span>
                </button>
              </div>
            </div>

            {/* Export Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* PDF Financial Report Export */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Monthly PDF Summary Report</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Formatted statement with overview cards, family breakdown, and transactions table
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-red-600/20 active:scale-95 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Report ({selectedMonth})</span>
                </button>
              </div>

              {/* CSV Expenses Export */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Expenses CSV Spreadsheet</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Spreadsheet file compatible with Excel, Google Sheets, or Apple Numbers
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Expenses CSV ({expensesToExport.length} entries)</span>
                </button>
              </div>

              {/* Bank Balances CSV Export */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Bank Dues & Balances (CSV)</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Member pending bank dues, UPI IDs, notes, and custom override numbers
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBankCSV}
                  disabled={!memberBankAmounts}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Bank Balances CSV</span>
                </button>
              </div>

              {/* Full Application Backup Export (JSON + PDF) */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Full Application Backup (PDF & JSON)</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Complete snapshot containing all expenses, budget limits, EMIs & bank states
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer transition-all"
                    title="Download raw JSON backup file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDFBackup}
                    className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer transition-all"
                    title="Download complete PDF backup document with restore data"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Backup</span>
                  </button>
                </div>
              </div>

              {/* Automated Weekly PDF Backup Schedule Settings Card */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 md:col-span-2 ${
                isDark ? 'bg-rose-950/30 border-rose-900/60' : 'bg-rose-50/80 border-rose-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-rose-100">
                          Automated Weekly PDF Backup (Every 7 Days)
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                          autoWeeklyBackupEnabled
                            ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {autoWeeklyBackupEnabled ? 'Active (7 Days)' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Automatically exports and downloads a complete PDF snapshot document containing all expenses, bank dues, and EMI plans every 7 days when you open the app.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={autoWeeklyBackupEnabled}
                      onChange={handleToggleAutoWeeklyBackup}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Last Auto Backup</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {autoWeeklyLastTime
                          ? new Date(autoWeeklyLastTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Not run yet'}
                      </span>
                    </div>

                    <div className="h-6 w-px bg-rose-200 dark:bg-rose-900/60"></div>

                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Next Scheduled</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {autoWeeklyBackupEnabled
                          ? (autoWeeklyLastTime
                              ? new Date(autoWeeklyLastTime + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'Next App Launch')
                          : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerWeeklyBackupNow}
                    className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Weekly PDF Backup Now</span>
                  </button>
                </div>
              </div>

              {/* Main Single-File Web App HTML Download */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 md:col-span-2 ${
                isDark ? 'bg-indigo-950/40 border-indigo-900/60' : 'bg-indigo-50/80 border-indigo-200/80'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-indigo-950 dark:text-indigo-200">Main Single-File Web App (HTML)</h3>
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                        Self-Contained
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Download a single self-contained HTML file that runs the complete React app in any web browser without needing Node.js or a server.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <a
                    href="/standalone.html"
                    download="family_expense_tracker_app.html"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Main HTML Web App</span>
                  </a>
                  <a
                    href="/standalone.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
                  >
                    <span>Launch in New Tab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Download Individual Member Data Section */}
              <div className={`p-4 rounded-2xl border md:col-span-2 space-y-3 ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">Download Each Member's Data</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Export complete expense transactions, EMI plans, bank dues, and financial summary for each family member
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  {familyMembers.map((member) => {
                    const memberExpList = expenses.filter(e => e.paidBy === member);
                    const totalSpent = memberExpList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                    const bankData = memberBankAmounts?.[member];

                    return (
                      <div
                        key={member}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MemberAvatar
                            member={member}
                            memberConfigs={memberConfigs}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black truncate">{member}</p>
                            <p className="text-[10px] text-slate-400 font-semibold truncate">
                              {memberExpList.length} expenses • ₹{totalSpent.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => exportMemberDataToPDF(member, expenses, bankData, memberConfigs[member], emis)}
                            className="p-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                            title={`Download ${member}'s official PDF statement`}
                          >
                            <Download className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span className="text-[10px] font-black">PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => exportMemberDataToCSV(member, expenses, bankData, memberConfigs[member], emis)}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                            title={`Download ${member}'s CSV statement`}
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] font-black">CSV</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => exportMemberDataToJSON(member, expenses, bankData, memberConfigs[member], emis)}
                            className="p-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                            title={`Download ${member}'s JSON data`}
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[10px] font-black">JSON</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: IMPORT DATA */}
        {activeTab === 'import' && (
          <div className="space-y-5 mt-5">

            {/* Option 1: CSV Expenses Import */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-sm sm:text-base">1. Import Expenses from CSV File</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium mb-3">
                Upload a CSV spreadsheet with columns for <span className="font-bold text-slate-300">Date, Amount, Paid By, Category, Notes</span>.
              </p>

              <input
                type="file"
                ref={csvFileInputRef}
                accept=".csv,text/csv"
                onChange={handleCSVFileChange}
                className="hidden"
                id="csv-file-input"
              />

              <div className="flex items-center gap-3">
                <label
                  htmlFor="csv-file-input"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>{csvFileName ? 'Choose Different CSV' : 'Select CSV File'}</span>
                </label>
                {csvFileName && (
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    📄 {csvFileName}
                  </span>
                )}
              </div>

              {/* CSV Preview Table */}
              {csvPreviewData && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Found {csvPreviewData.length} valid rows to import
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCsvPreviewData(null);
                        setCsvFileName('');
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear Preview
                    </button>
                  </div>

                  {/* Warning Messages */}
                  {csvErrors.length > 0 && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-[11px] space-y-1 font-medium">
                      <span className="font-bold block">Warnings ({csvErrors.length}):</span>
                      {csvErrors.slice(0, 3).map((err, idx) => (
                        <div key={idx}>• {err}</div>
                      ))}
                      {csvErrors.length > 3 && <div>...and {csvErrors.length - 3} more.</div>}
                    </div>
                  )}

                  {/* Scrollable Preview Table */}
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className={`sticky top-0 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        <tr>
                          <th className="p-2 font-bold">Date</th>
                          <th className="p-2 font-bold">Paid By</th>
                          <th className="p-2 font-bold">Category</th>
                          <th className="p-2 font-bold">Amount</th>
                          <th className="p-2 font-bold">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {csvPreviewData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                            <td className="p-2 font-mono text-[11px]">{row.date}</td>
                            <td className="p-2 font-bold">{row.paidBy}</td>
                            <td className="p-2 text-slate-400">{row.category}</td>
                            <td className="p-2 font-black font-mono text-emerald-600 dark:text-emerald-400">₹{row.amount}</td>
                            <td className="p-2 truncate max-w-[120px] text-slate-400">{row.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmCSVImport}
                    disabled={isImporting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-98 transition-all"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Records to Firestore...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Import {csvPreviewData.length} Expenses to Firestore</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Option 2: Full Application Backup Restore (JSON or PDF) */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <FileJson className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm sm:text-base">2. Restore Full App Backup (JSON or PDF)</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium mb-3">
                Upload a previously saved <span className="font-bold text-slate-300">backup.json</span> or <span className="font-bold text-slate-300">full_backup.pdf</span> file to restore complete application database and settings.
              </p>

              <input
                type="file"
                ref={jsonFileInputRef}
                accept=".json,application/json"
                onChange={handleJSONFileChange}
                className="hidden"
                id="json-file-input"
              />

              <input
                type="file"
                ref={pdfBackupFileInputRef}
                accept=".pdf,application/pdf"
                onChange={handlePDFBackupFileChange}
                className="hidden"
                id="pdf-backup-file-input"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <label
                  htmlFor="json-file-input"
                  className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-600/20 active:scale-95 shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>{jsonFileName && jsonFileName.endsWith('.json') ? 'Change JSON' : 'Select Backup JSON'}</span>
                </label>

                <label
                  htmlFor="pdf-backup-file-input"
                  className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-rose-600/20 active:scale-95 shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>{jsonFileName && jsonFileName.endsWith('.pdf') ? 'Change PDF' : 'Select Backup PDF'}</span>
                </label>

                {jsonFileName && (
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 truncate">
                    📄 {jsonFileName}
                  </span>
                )}
              </div>

              {/* JSON / PDF Backup Summary */}
              {jsonBackupData && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1">
                    <div className="font-black text-amber-900 dark:text-amber-200">
                      Backup File Contents Ready to Restore:
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-medium">
                      • Expenses Count: <span className="font-bold">{jsonBackupData.expenses?.length || 0}</span>
                    </div>
                    {jsonBackupData.memberBankAmounts && (
                      <div className="text-slate-600 dark:text-slate-300 font-medium">
                        • Member Bank Dues: <span className="font-bold">{Object.keys(jsonBackupData.memberBankAmounts).length} records</span>
                      </div>
                    )}
                    {jsonBackupData.emis && jsonBackupData.emis.length > 0 && (
                      <div className="text-slate-600 dark:text-slate-300 font-medium">
                        • Active EMI Plans: <span className="font-bold">{jsonBackupData.emis.length} plans</span>
                      </div>
                    )}
                    {jsonBackupData.monthlyBudget && (
                      <div className="text-slate-600 dark:text-slate-300 font-medium">
                        • Monthly Budget: <span className="font-bold">₹{jsonBackupData.monthlyBudget}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmJSONRestore}
                    disabled={isImporting}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer active:scale-98 transition-all"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Restoring Backup to Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Restore Full Backup to Database</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Option 3: PDF Statement Import */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-sm sm:text-base">3. Import Expenses from PDF Statement</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium mb-3">
                Upload a PDF financial report, exported member statement, or bank PDF statement to extract and import expense transactions.
              </p>

              <input
                type="file"
                ref={pdfFileInputRef}
                accept=".pdf,application/pdf"
                onChange={handlePDFFileChange}
                className="hidden"
                id="pdf-file-input"
              />

              <div className="flex items-center gap-3">
                <label
                  htmlFor="pdf-file-input"
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-rose-600/20 active:scale-95 shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>{pdfFileName ? 'Choose Different PDF' : 'Select PDF Statement'}</span>
                </label>
                {pdfFileName && (
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 truncate">
                    📄 {pdfFileName}
                  </span>
                )}
              </div>

              {/* PDF Preview Table */}
              {pdfPreviewData && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Found {pdfPreviewData.length} expense transactions in PDF
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfPreviewData(null);
                        setPdfFileName('');
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear Preview
                    </button>
                  </div>

                  {/* Warning Messages */}
                  {pdfErrors.length > 0 && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-[11px] space-y-1 font-medium">
                      <span className="font-bold block">Parsing Details ({pdfErrors.length}):</span>
                      {pdfErrors.slice(0, 3).map((err, idx) => (
                        <div key={idx}>• {err}</div>
                      ))}
                    </div>
                  )}

                  {/* Scrollable Preview Table */}
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className={`sticky top-0 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        <tr>
                          <th className="p-2 font-bold">Date</th>
                          <th className="p-2 font-bold">Paid By</th>
                          <th className="p-2 font-bold">Category</th>
                          <th className="p-2 font-bold">Amount</th>
                          <th className="p-2 font-bold">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {pdfPreviewData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                            <td className="p-2 font-mono text-[11px]">{row.date}</td>
                            <td className="p-2 font-bold">{row.paidBy}</td>
                            <td className="p-2 text-slate-400">{row.category}</td>
                            <td className="p-2 font-black font-mono text-rose-600 dark:text-rose-400">₹{row.amount}</td>
                            <td className="p-2 truncate max-w-[120px] text-slate-400">{row.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmPDFImport}
                    disabled={isImporting}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer active:scale-98 transition-all"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving PDF Records to Firestore...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Import {pdfPreviewData.length} PDF Expenses to Firestore</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'reset' && (
          <div className="space-y-5 mt-4">
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-rose-950/30 border-rose-900/60' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-rose-900 dark:text-rose-100">Reset Entire Application Data</h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                    Permanently wipe all Expenses, EMI Plans, SIP Investments, Debts, Bank Balances, and custom settings across Firestore and local cache.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/80 space-y-4 shadow-xs">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Enter Security PIN Code (Default: 1234):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={resetPin}
                    onChange={(e) => {
                      setResetPin(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="Enter 4-digit PIN (e.g. 1234)"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold tracking-widest focus:outline-none transition-all ${
                      pinError
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-rose-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-600'
                    }`}
                  />
                  {pinError && (
                    <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{pinError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isResetting}
                  onClick={async () => {
                    if (resetPin.trim() === '1234') {
                      setIsResetting(true);
                      if (onResetApp) {
                        await onResetApp();
                      }
                      setIsResetting(false);
                      onClose();
                    } else {
                      setPinError('Incorrect PIN code! The default PIN is 1234.');
                    }
                  }}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer active:scale-98 transition-all"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Wiping Application Data...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Confirm & Reset Entire App Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs rounded-2xl cursor-pointer transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
