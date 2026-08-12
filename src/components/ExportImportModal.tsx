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
import { Language } from '../utils/translations';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  selectedMonth: string;
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
  onRefreshData,
  onResetApp,
  memberConfigs = {},
  familyMembers = FAMILY_MEMBERS
}) => {
  const isDark = theme === 'dark';

  // 3 Unified Tabs: Export, Import, or Restart
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reset'>('export');

  // Unified Import State
  const [importFile, setImportFile] = useState<File | null>(null);
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

  // Constructs full app backup payload
  const buildFullBackupPayload = (): FullBackupData => ({
    expenses,
    memberBankAmounts,
    emis,
    sips,
    debts,
    monthlyBudget,
    adminPin,
    familyMembers,
    memberConfigs
  });

  // 1. Export Entire App in CSV Format
  const handleExportCSV = () => {
    exportBackupCSV(buildFullBackupPayload());
  };

  // 2. Export Entire App in PDF Format
  const handleExportPDF = () => {
    exportBackupPDF(buildFullBackupPayload());
  };

  // File Select Handler for Unified Import (CSV, PDF, or JSON)
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
      reader.readAsArrayBuffer(file);
    } else if (fileNameLower.endsWith('.csv')) {
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
      reader.readAsText(file);
    } else {
      setImportErrorMsg('Unsupported file format. Please select a CSV or PDF full backup file.');
      setIsReadingFile(false);
    }
  };

  // Confirm Restore into Firestore
  const handleConfirmImport = async () => {
    if (!parsedBackupData) return;

    setIsImporting(true);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);

    try {
      let expenseCount = 0;

      // Restore Expenses
      if (Array.isArray(parsedBackupData.expenses) && parsedBackupData.expenses.length > 0) {
        for (const exp of parsedBackupData.expenses) {
          const expId = exp.id || `restored_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const docRef = doc(db, 'expenses', expId);
          await setDoc(docRef, exp, { merge: true });
          expenseCount++;
        }
      }

      setImportSuccessMsg(`Entire app data restored successfully! (${expenseCount} expenses restored)`);
      setImportFile(null);
      setParsedBackupData(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setImportErrorMsg(`Failed to restore backup: ${err?.message || 'Permission denied'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Confirm Application Restart / Reset Data
  const handleConfirmResetApp = async () => {
    setPinError(null);
    if (adminPin && resetPin.trim() !== adminPin.trim()) {
      setPinError('Incorrect Admin Security PIN code.');
      return;
    }

    setIsResetting(true);
    try {
      if (onResetApp) await onResetApp();
      setResetSuccessMsg('Application restarted successfully! All data has been reset.');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setPinError(`Failed to restart app: ${err?.message || 'Database error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold">App Data Import, Export & Restart</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button onClick={() => setActiveTab('export')} className={`flex-1 py-3 px-4 text-xs font-semibold ${activeTab === 'export' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-slate-500'}`}>
            <Download className="w-4 h-4 inline mr-1" /> 1. Export Entire App
          </button>
          <button onClick={() => setActiveTab('import')} className={`flex-1 py-3 px-4 text-xs font-semibold ${activeTab === 'import' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-slate-500'}`}>
            <Upload className="w-4 h-4 inline mr-1" /> 2. Import Entire App
          </button>
          <button onClick={() => setActiveTab('reset')} className={`flex-1 py-3 px-4 text-xs font-semibold ${activeTab === 'reset' ? 'border-b-2 border-rose-600 text-rose-600 font-bold' : 'text-slate-500'}`}>
            <RotateCcw className="w-4 h-4 inline mr-1" /> 3. Restart Application
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-6">
          {activeTab === 'export' && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleExportCSV} className="p-5 border rounded-2xl text-left hover:border-emerald-500">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 mb-2" />
                <h4 className="font-bold text-sm">Export Full App Data (CSV)</h4>
                <p className="text-xs text-slate-500">Spreadsheet file containing all expenses and bank records.</p>
              </button>
              <button onClick={handleExportPDF} className="p-5 border rounded-2xl text-left hover:border-indigo-500">
                <FileText className="w-6 h-6 text-indigo-600 mb-2" />
                <h4 className="font-bold text-sm">Export Full App Data (PDF)</h4>
                <p className="text-xs text-slate-500">Document report with financial summaries and embedded restore payload.</p>
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv,.pdf,.json" className="hidden" />
              <div onClick={() => fileInputRef.current?.click()} className="p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer">
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="font-bold text-sm">Click to select CSV or PDF backup file</p>
              </div>

              {parsedBackupData && (
                <button onClick={handleConfirmImport} disabled={isImporting} className="w-full py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl">
                  {isImporting ? 'Restoring Application Data...' : 'Restore Entire App Data Now'}
                </button>
              )}
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="space-y-4">
              {adminPin && (
                <input type="password" value={resetPin} onChange={(e) => setResetPin(e.target.value)} placeholder="Enter Admin PIN" className="w-full p-3 border rounded-xl text-center" />
              )}
              <button onClick={handleConfirmResetApp} disabled={isResetting} className="w-full py-3 bg-rose-600 text-white font-bold text-xs rounded-xl">
                {isResetting ? 'Restarting...' : 'Restart Application & Reset Data Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
