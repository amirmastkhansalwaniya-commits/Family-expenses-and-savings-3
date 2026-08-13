import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';
import { Expense, FamilyMember, FAMILY_MEMBERS, MemberBankAmount, EmiPlan, SipPlan, DebtRecord, CATEGORIES, CategoryId, MemberCustomConfig } from '../types';
import { formatINR } from './formatters';
import { Language, t } from './translations';

export interface ExportPDFParams {
  expenses: Expense[];
  selectedMonth: string; // e.g. "2026-08"
  monthlyBudget: number;
  memberTotals: Record<FamilyMember, { amount: number; count: number }>;
  allTimeMemberTotals?: Record<FamilyMember, number>;
  memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
  language?: Language;
}

// Utility to trigger browser file download
export const triggerDownload = (content: string | Blob, fileName: string, mimeType: string) => {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (err) {
    console.warn('Trigger download error, trying data URI fallback:', err);
    if (typeof content === 'string') {
      const dataUri = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
};

// Clean string for CSV formatting
const escapeCSVField = (field: any): string => {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * EXPORT EXPENSES TO CSV
 */
export const exportExpensesToCSV = (expenses: Expense[], monthFilterLabel?: string) => {
  const headers = [
    'ID',
    'Date',
    'Amount (INR)',
    'Paid By',
    'Category',
    'Notes / Description',
    'Is EMI Payment',
    'Created At'
  ];

  const rows = expenses.map(exp => [
    escapeCSVField(exp.id || ''),
    escapeCSVField(exp.date || ''),
    escapeCSVField(exp.amount || 0),
    escapeCSVField(exp.paidBy || ''),
    escapeCSVField(exp.category || ''),
    escapeCSVField(exp.notes || ''),
    escapeCSVField(exp.isEmiPayment ? 'Yes' : 'No'),
    escapeCSVField(exp.createdAt || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = monthFilterLabel
    ? `family_expenses_${monthFilterLabel}_${dateStr}.csv`
    : `family_expenses_all_time_${dateStr}.csv`;

  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * EXPORT MEMBER BANK BALANCES TO CSV
 */
export const exportBankBalancesToCSV = (memberBankAmounts: Record<FamilyMember, MemberBankAmount>) => {
  const headers = [
    'Family Member',
    'Pending Bank Amount (INR)',
    'Bank Name',
    'UPI ID',
    'Status',
    'Last Updated',
    'Notes',
    'Custom Total Spent Override (INR)',
    'Custom Month Spent Override (INR)'
  ];

  const rows = FAMILY_MEMBERS.map(m => {
    const item: Partial<MemberBankAmount> = memberBankAmounts[m] || {};
    return [
      escapeCSVField(m),
      escapeCSVField(item.pendingBankAmount || 0),
      escapeCSVField(item.bankName || ''),
      escapeCSVField(item.upiId || ''),
      escapeCSVField(item.status || 'pending'),
      escapeCSVField(item.lastUpdated || ''),
      escapeCSVField(item.notes || ''),
      escapeCSVField(item.customTotalSpentOverride ?? ''),
      escapeCSVField(item.customMonthSpentOverride ?? '')
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(csvContent, `family_bank_balances_${dateStr}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * EXPORT INDIVIDUAL FAMILY MEMBER DATA (CSV)
 */
export const exportMemberDataToCSV = (
  member: FamilyMember,
  expenses: Expense[] = [],
  bankAmount?: MemberBankAmount,
  config?: MemberCustomConfig,
  emis: EmiPlan[] = []
) => {
  const memberExpenses = expenses.filter(e => e.paidBy === member);
  const memberEmis = emis.filter(e => e.paidBy === member);
  const totalSpentAllTime = memberExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const dateStr = new Date().toISOString().split('T')[0];

  const sections: string[] = [];

  // Section 1: Member Profile Summary
  sections.push('--- MEMBER PROFILE SUMMARY ---');
  sections.push('Member Name,Total Spent (INR),Transactions Count,Pending Bank Amount (INR),Bank Name,UPI ID,Bank Status,Last Updated');
  sections.push([
    escapeCSVField(member),
    escapeCSVField(totalSpentAllTime),
    escapeCSVField(memberExpenses.length),
    escapeCSVField(bankAmount?.pendingBankAmount || 0),
    escapeCSVField(bankAmount?.bankName || 'N/A'),
    escapeCSVField(bankAmount?.upiId || 'N/A'),
    escapeCSVField(bankAmount?.status || 'pending'),
    escapeCSVField(bankAmount?.lastUpdated || dateStr)
  ].join(','));

  sections.push(''); // Blank row

  // Section 2: Member Expenses List
  sections.push('--- MEMBER EXPENSE TRANSACTIONS ---');
  sections.push('ID,Date,Amount (INR),Category,Notes,Is EMI Payment,Created At');
  if (memberExpenses.length === 0) {
    sections.push('No expenses logged for this member yet.');
  } else {
    memberExpenses.forEach(exp => {
      sections.push([
        escapeCSVField(exp.id || ''),
        escapeCSVField(exp.date || ''),
        escapeCSVField(exp.amount || 0),
        escapeCSVField(exp.category || ''),
        escapeCSVField(exp.notes || ''),
        escapeCSVField(exp.isEmiPayment ? 'Yes' : 'No'),
        escapeCSVField(exp.createdAt || '')
      ].join(','));
    });
  }

  sections.push(''); // Blank row

  // Section 3: Member EMI Plans
  sections.push('--- MEMBER EMI PLANS ---');
  sections.push('ID,Title,Category,Total Amount (INR),Monthly EMI (INR),Tenure (Months),Paid Months,Status,Start Month');
  if (memberEmis.length === 0) {
    sections.push('No EMI plans for this member.');
  } else {
    memberEmis.forEach(emi => {
      sections.push([
        escapeCSVField(emi.id || ''),
        escapeCSVField(emi.title || ''),
        escapeCSVField(emi.category || ''),
        escapeCSVField(emi.totalAmount || 0),
        escapeCSVField(emi.emiAmount || 0),
        escapeCSVField(emi.tenureMonths || 0),
        escapeCSVField(emi.paidMonths || 0),
        escapeCSVField(emi.status || ''),
        escapeCSVField(emi.startMonth || '')
      ].join(','));
    });
  }

  const csvContent = sections.join('\n');
  const safeName = member.toLowerCase().replace(/\s+/g, '_');
  triggerDownload(csvContent, `${safeName}_expense_statement_${dateStr}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * EXPORT INDIVIDUAL FAMILY MEMBER DATA (JSON)
 */
export const exportMemberDataToJSON = (
  member: FamilyMember,
  expenses: Expense[] = [],
  bankAmount?: MemberBankAmount,
  config?: MemberCustomConfig,
  emis: EmiPlan[] = []
) => {
  const memberExpenses = expenses.filter(e => e.paidBy === member);
  const memberEmis = emis.filter(e => e.paidBy === member);
  const totalSpentAllTime = memberExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const dateStr = new Date().toISOString().split('T')[0];

  const payload = {
    app: 'Family Expense Tracker',
    member,
    exportDate: new Date().toISOString(),
    profileConfig: config || {},
    summary: {
      totalSpentAllTime,
      totalExpensesCount: memberExpenses.length,
      pendingBankAmount: bankAmount?.pendingBankAmount || 0,
      bankName: bankAmount?.bankName || '',
      upiId: bankAmount?.upiId || '',
      bankStatus: bankAmount?.status || 'pending',
      lastUpdated: bankAmount?.lastUpdated || dateStr
    },
    expenses: memberExpenses,
    emis: memberEmis
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const safeName = member.toLowerCase().replace(/\s+/g, '_');
  triggerDownload(jsonStr, `${safeName}_data_${dateStr}.json`, 'application/json');
};

/**
 * EXPORT INDIVIDUAL FAMILY MEMBER STATEMENT (PDF)
 */
export const exportMemberDataToPDF = (
  member: FamilyMember,
  expenses: Expense[] = [],
  bankAmount?: MemberBankAmount,
  config?: MemberCustomConfig,
  emis: EmiPlan[] = []
) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const memberExpenses = expenses.filter(e => e.paidBy === member);
  const memberEmis = emis.filter(e => e.paidBy === member);
  const totalSpentAllTime = memberExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const getCatLabel = (catId: string) => {
    const found = CATEGORIES.find(c => c.id === catId);
    return found ? found.label : catId;
  };

  // Header Banner
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`FINANCIAL STATEMENT - ${member.toUpperCase()}`, 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Family Expense Tracker | Statement Date: ${dateStr}`, 14, 20);

  let currentY = 35;

  // Profile & Financial Summary Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 3, 3, 'D');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');

  doc.text('TOTAL SPENT (ALL TIME)', 20, currentY + 7);
  doc.text('TOTAL TRANSACTIONS', 80, currentY + 7);
  doc.text('PENDING BANK DUE', 135, currentY + 7);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(`Rs. ${totalSpentAllTime.toLocaleString('en-IN')}`, 20, currentY + 16);

  doc.setTextColor(15, 23, 42);
  doc.text(`${memberExpenses.length} entries`, 80, currentY + 16);

  if (bankAmount?.pendingBankAmount) {
    doc.setTextColor(220, 38, 38);
    doc.text(`Rs. ${bankAmount.pendingBankAmount.toLocaleString('en-IN')} (${bankAmount.bankName || 'Bank'})`, 135, currentY + 16);
  } else {
    doc.setTextColor(16, 185, 129);
    doc.text('Rs. 0 (No Pending Dues)', 135, currentY + 16);
  }

  currentY += 32;

  // Table 1: Expense Transactions
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Expense Transactions (${memberExpenses.length})`, 14, currentY);
  currentY += 4;

  const expenseRows = memberExpenses.map((exp, index) => [
    (index + 1).toString(),
    exp.date || '-',
    getCatLabel(exp.category),
    exp.notes || 'No note',
    exp.isEmiPayment ? 'EMI' : 'Regular',
    `Rs. ${(Number(exp.amount) || 0).toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Category', 'Notes', 'Type', 'Amount']],
    body: expenseRows.length > 0 ? expenseRows : [['-', '-', 'No expenses recorded for this member', '-', '-', 'Rs. 0']],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 32 },
      3: { cellWidth: 65 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Table 2: EMI Plans if any
  if (memberEmis.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Active EMI Plans (${memberEmis.length})`, 14, currentY);
    currentY += 4;

    const emiRows = memberEmis.map((emi, idx) => [
      (idx + 1).toString(),
      emi.title || 'EMI',
      getCatLabel(emi.category),
      `Rs. ${(emi.emiAmount || 0).toLocaleString('en-IN')}`,
      `${emi.paidMonths || 0}/${emi.tenureMonths || 0} Mo.`,
      (emi.status || 'active').toUpperCase(),
      `Rs. ${(emi.totalAmount || 0).toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Title', 'Category', 'Monthly EMI', 'Progress', 'Status', 'Total Cost']],
      body: emiRows,
      theme: 'striped',
      headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 28 },
        4: { cellWidth: 22 },
        5: { cellWidth: 22 },
        6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer Note
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Family Expense Tracker - Statement for ${member} - Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
  }

  const safeName = member.toLowerCase().replace(/\s+/g, '_');
  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`${safeName}_statement_${fileDate}.pdf`);
};

export interface FullBackupData {
  expenses: Expense[];
  memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
  emis?: EmiPlan[];
  sips?: SipPlan[];
  debts?: DebtRecord[];
  monthlyBudget?: number;
  adminPin?: string;
  familyMembers?: string[];
  memberConfigs?: Record<string, MemberCustomConfig>;
}

/**
 * EXPORT FULL APPLICATION BACKUP JSON
 */
export const exportBackupJSON = (backupData: FullBackupData) => {
  try {
    const sanitizedExpenses = (backupData.expenses || []).map(e => ({
      id: e.id,
      date: e.date || new Date().toISOString().split('T')[0],
      amount: Number(e.amount) || 0,
      paidBy: e.paidBy || 'Amir Khan',
      category: e.category || 'Others',
      notes: e.notes || '',
      isEmiPayment: Boolean(e.isEmiPayment),
      createdAt: e.createdAt || new Date().toISOString()
    }));

    const payload = {
      app: 'Family Expense Tracker',
      version: '2.0',
      exportDate: new Date().toISOString(),
      monthlyBudget: backupData.monthlyBudget || 50000,
      adminPin: backupData.adminPin || '1234',
      familyMembers: backupData.familyMembers || FAMILY_MEMBERS,
      memberConfigs: backupData.memberConfigs || {},
      expensesCount: sanitizedExpenses.length,
      expenses: sanitizedExpenses,
      memberBankAmounts: backupData.memberBankAmounts || {},
      emis: backupData.emis || [],
      sips: backupData.sips || [],
      debts: backupData.debts || []
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    triggerDownload(jsonStr, `family_expense_tracker_full_backup_${dateStr}.json`, 'application/json');
  } catch (err: any) {
    console.error('Failed to export backup JSON:', err);
    alert(`Export JSON failed: ${err?.message || 'Unknown error'}`);
  }
};

/**
 * EXPORT FULL APPLICATION BACKUP CSV
 */
export const exportBackupCSV = (backupData: FullBackupData) => {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const sections: string[] = [];

    // Section 1: Application Settings & Overview
    sections.push('--- APP FULL BACKUP METADATA ---');
    sections.push('App,Version,Export Date,Monthly Budget,Admin PIN');
    sections.push([
      escapeCSVField('Family Expense Tracker'),
      escapeCSVField('2.0'),
      escapeCSVField(new Date().toISOString()),
      escapeCSVField(backupData.monthlyBudget || 50000),
      escapeCSVField(backupData.adminPin || '1234')
    ].join(','));

    sections.push(''); // Blank spacer row

    // Section 2: Expenses Collection
    sections.push('--- EXPENSES REGISTER ---');
    sections.push('ID,Date,Amount (INR),Paid By,Category,Notes / Description,Is EMI Payment,Created At');
    (backupData.expenses || []).forEach(exp => {
      sections.push([
        escapeCSVField(exp.id || ''),
        escapeCSVField(exp.date || ''),
        escapeCSVField(exp.amount || 0),
        escapeCSVField(exp.paidBy || 'Amir Khan'),
        escapeCSVField(exp.category || 'Others'),
        escapeCSVField(exp.notes || ''),
        escapeCSVField(exp.isEmiPayment ? 'Yes' : 'No'),
        escapeCSVField(exp.createdAt || '')
      ].join(','));
    });

    sections.push('');

    // Section 3: Member Bank Accounts & Dues
    sections.push('--- MEMBER BANK BALANCES ---');
    sections.push('Member,Pending Bank Amount (INR),Bank Name,UPI ID,Status,Last Updated,Notes');
    if (backupData.memberBankAmounts) {
      Object.entries(backupData.memberBankAmounts).forEach(([m, b]) => {
        sections.push([
          escapeCSVField(m),
          escapeCSVField(b.pendingBankAmount || 0),
          escapeCSVField(b.bankName || ''),
          escapeCSVField(b.upiId || ''),
          escapeCSVField(b.status || 'pending'),
          escapeCSVField(b.lastUpdated || ''),
          escapeCSVField(b.notes || '')
        ].join(','));
      });
    }

    sections.push('');

    // Section 4: EMI Plans
    sections.push('--- EMI PLANS ---');
    sections.push('ID,Title,Paid By,Category,Total Amount,Monthly EMI,Tenure Months,Paid Months,Status,Start Month');
    (backupData.emis || []).forEach(e => {
      sections.push([
        escapeCSVField(e.id || ''),
        escapeCSVField(e.title || ''),
        escapeCSVField(e.paidBy || ''),
        escapeCSVField(e.category || ''),
        escapeCSVField(e.totalAmount || 0),
        escapeCSVField(e.emiAmount || 0),
        escapeCSVField(e.tenureMonths || 0),
        escapeCSVField(e.paidMonths || 0),
        escapeCSVField(e.status || ''),
        escapeCSVField(e.startMonth || '')
      ].join(','));
    });

    sections.push('');

    // Section 5: SIP Plans
    sections.push('--- SIP PLANS ---');
    sections.push('ID,Title,Paid By,Monthly Amount,Fund Category,Completed Months,Status,Start Date');
    (backupData.sips || []).forEach(s => {
      sections.push([
        escapeCSVField(s.id || ''),
        escapeCSVField(s.title || ''),
        escapeCSVField(s.paidBy || ''),
        escapeCSVField(s.monthlyAmount || 0),
        escapeCSVField(s.fundCategory || ''),
        escapeCSVField(s.completedMonths || 0),
        escapeCSVField(s.status || ''),
        escapeCSVField((s as any).startDate || s.startMonth || '')
      ].join(','));
    });

    sections.push('');

    // Section 6: Debt Records
    sections.push('--- DEBT RECORDS ---');
    sections.push('ID,Title,Person Name,Type,Total Amount,Remaining Amount,Status,Date');
    (backupData.debts || []).forEach(d => {
      sections.push([
        escapeCSVField(d.id || ''),
        escapeCSVField(d.title || ''),
        escapeCSVField(d.personName || ''),
        escapeCSVField(d.type || 'borrowed'),
        escapeCSVField(d.totalAmount || 0),
        escapeCSVField(d.remainingAmount || 0),
        escapeCSVField(d.status || ''),
        escapeCSVField(d.startDate || '')
      ].join(','));
    });

    const csvContent = sections.join('\n');
    triggerDownload(csvContent, `family_expense_tracker_full_backup_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  } catch (err: any) {
    console.error('Failed to export backup CSV:', err);
    alert(`Export CSV failed: ${err?.message || 'Unknown error'}`);
  }
};

/**
 * EXPORT FULL APPLICATION BACKUP PDF
 */
export const exportBackupPDF = (backupData: FullBackupData) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const sanitizedExpenses = (backupData.expenses || []).map(e => ({
    id: e.id,
    date: e.date || new Date().toISOString().split('T')[0],
    amount: Number(e.amount) || 0,
    paidBy: e.paidBy || 'Amir Khan',
    category: e.category || 'Others',
    notes: e.notes || '',
    isEmiPayment: Boolean(e.isEmiPayment),
    createdAt: e.createdAt || new Date().toISOString()
  }));

  const payload = {
    app: 'Family Expense Tracker',
    version: '2.0',
    exportDate: new Date().toISOString(),
    monthlyBudget: backupData.monthlyBudget || 50000,
    adminPin: backupData.adminPin || '1234',
    familyMembers: backupData.familyMembers || FAMILY_MEMBERS,
    memberConfigs: backupData.memberConfigs || {},
    expensesCount: sanitizedExpenses.length,
    expenses: sanitizedExpenses,
    memberBankAmounts: backupData.memberBankAmounts || {},
    emis: backupData.emis || [],
    sips: backupData.sips || [],
    debts: backupData.debts || []
  };

  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Page 1: Header Banner
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('FAMILY EXPENSE TRACKER - COMPLETE APPLICATION BACKUP', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Full Database Backup Document | Created On: ${dateStr}`, 14, 20);

  let currentY = 35;

  // Overview Summary Cards
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 3, 3, 'D');

  const totalSpent = sanitizedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL EXPENSES', 20, currentY + 7);
  doc.text('TOTAL SPENT', 75, currentY + 7);
  doc.text('ACTIVE EMIS & SIPS', 125, currentY + 7);
  doc.text('MONTHLY BUDGET', 170, currentY + 7);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${sanitizedExpenses.length} records`, 20, currentY + 16);
  doc.setTextColor(79, 70, 229);
  doc.text(`Rs. ${totalSpent.toLocaleString('en-IN')}`, 75, currentY + 16);
  doc.setTextColor(15, 23, 42);
  doc.text(`${(backupData.emis || []).length} EMI / ${(backupData.sips || []).length} SIP`, 125, currentY + 16);
  doc.text(`Rs. ${(backupData.monthlyBudget || 50000).toLocaleString('en-IN')}`, 170, currentY + 16);

  currentY += 32;

  // Table 1: Expenses
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Expenses Register (${sanitizedExpenses.length} Records)`, 14, currentY);
  currentY += 4;

  const expenseRows = sanitizedExpenses.map((exp, idx) => [
    (idx + 1).toString(),
    exp.date || '-',
    exp.paidBy || '-',
    exp.category || '-',
    exp.notes || '-',
    `Rs. ${(Number(exp.amount) || 0).toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Paid By', 'Category', 'Notes', 'Amount']],
    body: expenseRows.length > 0 ? expenseRows : [['-', '-', '-', 'No expenses recorded', '-', 'Rs. 0']],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 24 },
      2: { cellWidth: 26 },
      3: { cellWidth: 30 },
      4: { cellWidth: 62 },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Table 2: Member Bank Accounts
  if (backupData.memberBankAmounts && Object.keys(backupData.memberBankAmounts).length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. Member Bank Accounts & Dues', 14, currentY);
    currentY += 4;

    const bankRows = Object.entries(backupData.memberBankAmounts).map(([m, b], i) => [
      (i + 1).toString(),
      m,
      b.bankName || 'Default Bank',
      `Rs. ${(b.pendingBankAmount || 0).toLocaleString('en-IN')}`,
      b.notes || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Member', 'Bank Name', 'Pending Bank Due', 'Notes']],
      body: bankRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 45 },
        3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 52 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Table 3: EMI Plans
  if (backupData.emis && backupData.emis.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`3. Active EMI Plans (${backupData.emis.length})`, 14, currentY);
    currentY += 4;

    const emiRows = backupData.emis.map((emi, idx) => [
      (idx + 1).toString(),
      emi.title || '-',
      emi.paidBy || '-',
      `Rs. ${(emi.emiAmount || 0).toLocaleString('en-IN')}`,
      `${emi.paidMonths || 0}/${emi.tenureMonths || 0} Mo`,
      (emi.status || 'active').toUpperCase(),
      `Rs. ${(emi.totalAmount || 0).toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Title', 'Paid By', 'Monthly EMI', 'Progress', 'Status', 'Total Cost']],
      body: emiRows,
      theme: 'striped',
      headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Table 4: SIP Investment Plans
  if (backupData.sips && backupData.sips.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`4. Active SIP Investments (${backupData.sips.length})`, 14, currentY);
    currentY += 4;

    const sipRows = backupData.sips.map((sip, idx) => [
      (idx + 1).toString(),
      sip.title || '-',
      sip.paidBy || '-',
      `Rs. ${(sip.monthlyAmount || 0).toLocaleString('en-IN')}`,
      sip.fundCategory || 'Mutual Fund',
      `${sip.completedMonths || 0} Mo`,
      (sip.status || 'active').toUpperCase()
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Fund Title', 'Paid By', 'Monthly SIP', 'Category', 'Paid Mo', 'Status']],
      body: sipRows,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Table 5: Debt / Loan Records
  if (backupData.debts && backupData.debts.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`5. Debt & Loan Records (${backupData.debts.length})`, 14, currentY);
    currentY += 4;

    const debtRows = backupData.debts.map((debt, idx) => [
      (idx + 1).toString(),
      debt.title || '-',
      debt.personName || '-',
      debt.type === 'borrowed' ? 'Borrowed' : 'Given',
      `Rs. ${(debt.totalAmount || 0).toLocaleString('en-IN')}`,
      `Rs. ${(debt.remainingAmount || 0).toLocaleString('en-IN')}`,
      (debt.status || 'active').toUpperCase()
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Title', 'Person / Bank', 'Type', 'Total Debt', 'Remaining', 'Status']],
      body: debtRows,
      theme: 'striped',
      headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Embed restore Base64 payload block across dedicated page(s)
  doc.addPage();
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SYSTEM RESTORE DATA PAYLOAD (DO NOT EDIT)', 14, 15);

  const jsonStr = JSON.stringify(payload);
  const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
  const headerMarker = '===FULL_BACKUP_DATA_START===';
  const footerMarker = '===FULL_BACKUP_DATA_END===';

  doc.setFont('courier', 'normal');
  doc.setFontSize(4);
  doc.setTextColor(180, 180, 180);

  const chunks = base64Data.match(/.{1,90}/g) || [base64Data];
  const payloadLines = [headerMarker, ...chunks, footerMarker];

  let lineY = 22;
  const pageHeight = doc.internal.pageSize.getHeight();
  for (const line of payloadLines) {
    if (lineY > pageHeight - 15) {
      doc.addPage();
      lineY = 20;
      doc.setFont('courier', 'normal');
      doc.setFontSize(4);
      doc.setTextColor(180, 180, 180);
    }
    doc.text(line, 14, lineY);
    lineY += 2.2;
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Family Expense Tracker - Full Backup PDF - Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
  }

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`family_expense_tracker_full_backup_${fileDate}.pdf`);
};

/**
 * EXPORT PDF REPORT (jsPDF + autotable)
 */
export const exportExpensesToPDF = (params: ExportPDFParams) => {
  const {
    expenses,
    selectedMonth,
    monthlyBudget,
    memberTotals,
    allTimeMemberTotals,
    memberBankAmounts,
    language = 'en'
  } = params;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FAMILY EXPENSE TRACKER - FINANCIAL REPORT', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | Period: ${selectedMonth}`, 14, 20);

  let currentY = 35;

  // Monthly Overview Card Summary
  const totalMonthSpent = Object.values(memberTotals || {}).reduce((sum, item) => sum + (item?.amount || 0), 0);
  const safeBudget = monthlyBudget || 0;
  const remainingBudget = safeBudget - totalMonthSpent;
  const budgetUsagePercent = safeBudget > 0 ? Math.round((totalMonthSpent / safeBudget) * 100) : 0;

  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 3, 3, 'D');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');

  // Stat Columns
  doc.text('MONTHLY EXPENSES', 20, currentY + 7);
  doc.text('MONTHLY BUDGET', 75, currentY + 7);
  doc.text('REMAINING BUDGET', 130, currentY + 7);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text(`Rs. ${totalMonthSpent.toLocaleString('en-IN')}`, 20, currentY + 16);

  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(`Rs. ${safeBudget.toLocaleString('en-IN')}`, 75, currentY + 16);

  if (remainingBudget >= 0) {
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`Rs. ${remainingBudget.toLocaleString('en-IN')} (${100 - budgetUsagePercent}% free)`, 130, currentY + 16);
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text(`Rs. ${remainingBudget.toLocaleString('en-IN')} (Overbudget)`, 130, currentY + 16);
  }

  currentY += 32;

  // Member Summary Breakdown Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Family Member Spending Breakdown', 14, currentY);

  currentY += 4;

  const memberTableData = FAMILY_MEMBERS.map(m => {
    const monthSpent = memberTotals[m]?.amount || 0;
    const expCount = memberTotals[m]?.count || 0;
    const allTimeSpent = allTimeMemberTotals ? (allTimeMemberTotals[m] || 0) : monthSpent;
    const bankObj = memberBankAmounts ? memberBankAmounts[m] : undefined;
    const pendingDues = bankObj?.pendingBankAmount || 0;

    return [
      m,
      `Rs. ${monthSpent.toLocaleString('en-IN')}`,
      `${expCount} items`,
      `Rs. ${allTimeSpent.toLocaleString('en-IN')}`,
      `Rs. ${pendingDues.toLocaleString('en-IN')}`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Member', 'Spent This Month', 'Transactions', 'All-Time Total Spent', 'Pending Bank Dues']],
    body: memberTableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Detailed Transactions Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Transaction Details (${expenses.length} Entries)`, 14, currentY);

  currentY += 4;

  const expenseRows = expenses.map(exp => [
    exp.date,
    exp.paidBy,
    exp.category,
    exp.notes || '-',
    `Rs. ${Number(exp.amount).toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Paid By', 'Category', 'Notes / Details', 'Amount']],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 32 },
      2: { cellWidth: 36 },
      3: { cellWidth: 58 },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} - Family Expenses and Savings`, pageWidth - 14, 288, { align: 'right' });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`family_expenses_report_${selectedMonth}_${dateStr}.pdf`);
};

/**
 * PARSE CSV TEXT INTO EXPENSE OBJECTS
 */
export const parseExpensesCSV = (csvText: string): { validExpenses: Omit<Expense, 'id'>[]; errors: string[] } => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { validExpenses: [], errors: ['CSV file appears empty or missing header row.'] };
  }

  // Simple CSV line splitter respecting quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          cur += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headerLine = lines[0].toLowerCase();
  const rawHeaders = parseCSVLine(headerLine);

  // Column index finder helper
  const findColIndex = (keywords: string[]): number => {
    return rawHeaders.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const dateIdx = findColIndex(['date', 'दिनांक', 'time']);
  const amountIdx = findColIndex(['amount', 'price', 'inr', 'rs', 'रुपये', 'राशि']);
  const paidByIdx = findColIndex(['paidby', 'paid by', 'member', 'who', 'सदस्य']);
  const categoryIdx = findColIndex(['category', 'type', 'श्रेणी']);
  const notesIdx = findColIndex(['notes', 'description', 'title', 'detail', 'विवरण', 'नोट्स']);

  const validExpenses: Omit<Expense, 'id'>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0 || cols.every(c => c === '')) continue;

    const rawDate = dateIdx !== -1 ? cols[dateIdx] : new Date().toISOString().split('T')[0];
    const rawAmount = amountIdx !== -1 ? cols[amountIdx] : '0';
    const rawPaidBy = paidByIdx !== -1 ? cols[paidByIdx] : FAMILY_MEMBERS[0];
    const rawCategory = categoryIdx !== -1 ? cols[categoryIdx] : 'Others';
    const rawNotes = notesIdx !== -1 ? cols[notesIdx] : '';

    // Parse amount
    const cleanAmountStr = rawAmount.replace(/[^0-9.]/g, '');
    const amount = parseFloat(cleanAmountStr);

    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${i + 1}: Invalid or missing amount "${rawAmount}". Skipped.`);
      continue;
    }

    // Match paidBy member
    const matchedMember = FAMILY_MEMBERS.find(
      m => m.toLowerCase() === rawPaidBy.toLowerCase() || rawPaidBy.toLowerCase().includes(m.toLowerCase())
    ) || FAMILY_MEMBERS[0];

    // Match CategoryId
    const matchedCategory = (CATEGORIES.find(
      c => c.id.toLowerCase() === rawCategory.toLowerCase() || c.label.toLowerCase().includes(rawCategory.toLowerCase())
    )?.id || 'Others') as CategoryId;

    // Standardize date YYYY-MM-DD
    let formattedDate = rawDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      const parsedD = new Date(rawDate);
      if (!isNaN(parsedD.getTime())) {
        formattedDate = parsedD.toISOString().split('T')[0];
      } else {
        formattedDate = new Date().toISOString().split('T')[0];
      }
    }

    validExpenses.push({
      date: formattedDate,
      amount,
      paidBy: matchedMember,
      category: matchedCategory,
      notes: rawNotes.trim(),
      createdAt: new Date().toISOString()
    });
  }

  return { validExpenses, errors };
};

/**
 * PARSE FULL BACKUP CSV FILE
 */
export const parseBackupCSV = (csvText: string): {
  success: boolean;
  data: FullBackupData | null;
  error: string | null;
} => {
  try {
    const { validExpenses, errors } = parseExpensesCSV(csvText);
    if (validExpenses.length === 0) {
      return {
        success: false,
        data: null,
        error: errors.length > 0 ? errors.join('; ') : 'No valid records could be extracted from CSV file.'
      };
    }

    return {
      success: true,
      data: {
        expenses: validExpenses as Expense[],
      },
      error: null
    };
  } catch (e: any) {
    return {
      success: false,
      data: null,
      error: `Failed to parse CSV backup: ${e?.message || 'Invalid format'}`
    };
  }
};

/**
 * PARSE JSON BACKUP FILE
 */
export const parseBackupJSON = (jsonText: string) => {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
      throw new Error('Invalid or empty JSON format.');
    }

    let expenses: Expense[] = [];
    let memberBankAmounts: Record<FamilyMember, MemberBankAmount> | undefined = undefined;
    let emis: EmiPlan[] | undefined = undefined;
    let sips: SipPlan[] | undefined = undefined;
    let debts: DebtRecord[] | undefined = undefined;
    let monthlyBudget: number | undefined = undefined;
    let adminPin: string | undefined = undefined;
    let familyMembers: string[] | undefined = undefined;
    let memberConfigs: Record<string, MemberCustomConfig> | undefined = undefined;

    // Case A: Direct Array of Expense objects
    if (Array.isArray(parsed)) {
      expenses = parsed.map((item: any, idx: number) => ({
        id: item.id || `json_exp_${Date.now()}_${idx}`,
        date: item.date || item.createdDate || new Date().toISOString().split('T')[0],
        amount: Number(item.amount || item.price || item.cost || 0),
        paidBy: item.paidBy || item.member || item.paid_by || 'Amir Khan',
        category: item.category || item.type || 'Others',
        notes: item.notes || item.description || item.title || '',
        isEmiPayment: Boolean(item.isEmiPayment || item.is_emi),
        createdAt: item.createdAt || new Date().toISOString()
      })).filter((e: any) => e.amount > 0);
    }
    // Case B: JSON Object
    else if (typeof parsed === 'object') {
      const rawExpensesList = Array.isArray(parsed.expenses)
        ? parsed.expenses
        : Array.isArray(parsed.data)
        ? parsed.data
        : Array.isArray(parsed.transactions)
        ? parsed.transactions
        : Array.isArray(parsed.records)
        ? parsed.records
        : Array.isArray(parsed.items)
        ? parsed.items
        : [];

      expenses = rawExpensesList.map((item: any, idx: number) => ({
        id: item.id || `json_exp_${Date.now()}_${idx}`,
        date: item.date || item.createdDate || new Date().toISOString().split('T')[0],
        amount: Number(item.amount || item.price || item.cost || 0),
        paidBy: item.paidBy || item.member || item.paid_by || parsed.member || 'Amir Khan',
        category: item.category || item.type || 'Others',
        notes: item.notes || item.description || item.title || '',
        isEmiPayment: Boolean(item.isEmiPayment || item.is_emi),
        createdAt: item.createdAt || new Date().toISOString()
      })).filter((e: any) => e.amount > 0);

      if (parsed.memberBankAmounts && typeof parsed.memberBankAmounts === 'object') {
        memberBankAmounts = parsed.memberBankAmounts;
      }
      if (Array.isArray(parsed.emis)) emis = parsed.emis;
      if (Array.isArray(parsed.sips)) sips = parsed.sips;
      if (Array.isArray(parsed.debts)) debts = parsed.debts;
      if (typeof parsed.monthlyBudget === 'number') monthlyBudget = parsed.monthlyBudget;
      if (typeof parsed.adminPin === 'string') adminPin = parsed.adminPin;
      if (Array.isArray(parsed.familyMembers)) familyMembers = parsed.familyMembers;
      if (parsed.memberConfigs && typeof parsed.memberConfigs === 'object') memberConfigs = parsed.memberConfigs;
    }

    if (expenses.length === 0 && !memberBankAmounts && !emis && !sips && !debts) {
      return {
        success: false,
        data: null,
        error: 'JSON file does not contain any recognizable expenses, bank balances, or backup records.'
      };
    }

    return {
      success: true,
      data: {
        expenses,
        memberBankAmounts,
        emis,
        sips,
        debts,
        monthlyBudget,
        adminPin,
        familyMembers,
        memberConfigs
      },
      error: null
    };
  } catch (e: any) {
    return {
      success: false,
      data: null,
      error: `Failed to parse JSON file: ${e?.message || 'Syntax error'}`
    };
  }
};

/**
 * PARSE PDF TEXT LINES INTO EXPENSE OBJECTS
 */
export const parseExpensesFromTextLines = (lines: string[]): { validExpenses: Omit<Expense, 'id'>[]; errors: string[] } => {
  const validExpenses: Omit<Expense, 'id'>[] = [];
  const errors: string[] = [];

  console.log(`[PDF Text Line Parser] Analyzing ${lines.length} text lines extracted from PDF...`);

  const dateRegex = /\b(\d{4}[-/. ]\d{1,2}[-/. ]\d{1,2}|\d{1,2}[-/. ]\d{1,2}[-/. ]\d{2,4}|\d{1,2}[-/. ](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/. ]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/i;

  const standardizeDateStr = (rawDateStr: string): string => {
    if (!rawDateStr) return new Date().toISOString().split('T')[0];
    const clean = rawDateStr.trim().replace(/\./g, '-').replace(/\//g, '-');
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    
    const matchYMD = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (matchYMD) {
      return `${matchYMD[1]}-${matchYMD[2].padStart(2, '0')}-${matchYMD[3].padStart(2, '0')}`;
    }

    const matchDMY = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (matchDMY) {
      let day = parseInt(matchDMY[1], 10);
      let month = parseInt(matchDMY[2], 10);
      let year = parseInt(matchDMY[3], 10);
      if (year < 100) year += 2000;
      if (month > 12 && day <= 12) {
        const tmp = day; day = month; month = tmp;
      }
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const parsed = new Date(rawDateStr.replace(/-/g, ' '));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  lines.forEach((line, index) => {
    if (/TOTAL|SUMMARY|BREAKDOWN|PAGE\s+\d+|FINANCIAL\s+REPORT|STATEMENT\s+DATE/i.test(line) && !dateRegex.test(line)) {
      console.log(`[PDF Line ${index + 1}] Header/summary line skipped: "${line}"`);
      return;
    }

    const dateMatch = line.match(dateRegex);
    if (!dateMatch) {
      return;
    }

    const tokens = line.split(/\s+/);
    let foundAmount: number | null = null;
    let rawAmountStr = '';

    for (const token of tokens) {
      if (/(?:Rs\.?|₹|INR|\$)?\d/i.test(token)) {
        const clean = token.replace(/[^0-9.]/g, '');
        const val = parseFloat(clean);
        if (!isNaN(val) && val > 0 && val < 10000000) {
          if (val >= 2020 && val <= 2030 && !token.includes('.') && !token.includes(',') && !/(?:Rs\.?|₹)/i.test(line)) {
            continue;
          }
          foundAmount = val;
          rawAmountStr = token;
          break;
        }
      }
    }

    if (!foundAmount) {
      console.log(`[PDF Line ${index + 1}] Date found (${dateMatch[0]}) but no valid amount in line: "${line}"`);
      return;
    }

    const formattedDate = standardizeDateStr(dateMatch[1]);

    const matchedMember = FAMILY_MEMBERS.find(m =>
      line.toLowerCase().includes(m.toLowerCase())
    ) || FAMILY_MEMBERS[0];

    const matchedCategory = (CATEGORIES.find(c =>
      line.toLowerCase().includes(c.id.toLowerCase()) || line.toLowerCase().includes(c.label.toLowerCase())
    )?.id || 'Others') as CategoryId;

    let notes = line
      .replace(dateMatch[0], '')
      .replace(rawAmountStr, '')
      .replace(/Rs\.?|₹|INR/gi, '')
      .replace(new RegExp(matchedMember, 'gi'), '')
      .replace(/\b(?:Regular|EMI|Entry|Items|No note|No notes|Details)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!notes || notes.length < 2) {
      notes = `${matchedCategory} expense`;
    }

    const expenseRecord = {
      date: formattedDate,
      amount: foundAmount,
      paidBy: matchedMember,
      category: matchedCategory,
      notes: notes,
      createdAt: new Date().toISOString()
    };

    console.log(`[PDF Line ${index + 1}] Parsed expense:`, expenseRecord);
    validExpenses.push(expenseRecord);
  });

  if (validExpenses.length === 0) {
    errors.push('No valid expense entries with dates and amounts found in PDF statement.');
  }

  console.log(`[PDF Text Line Parser] Completed. Matched ${validExpenses.length} valid expenses.`);
  return { validExpenses, errors };
};

/**
 * PARSE PDF FILE INTO EXPENSES
 */
export const parseExpensesPDF = async (fileBuffer: ArrayBuffer): Promise<{ validExpenses: Omit<Expense, 'id'>[]; errors: string[] }> => {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
    const pdfDoc = await loadingTask.promise;

    const allLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      const lineMap: Record<number, { x: number; text: string }[]> = {};
      for (const item of textContent.items as any[]) {
        if (!item.str || !item.str.trim()) continue;
        const transform = item.transform;
        const y = Math.round(transform[5]);
        const x = transform[4];

        const existingY = Object.keys(lineMap).find(k => Math.abs(Number(k) - y) < 4);
        const targetY = existingY ? Number(existingY) : y;

        if (!lineMap[targetY]) {
          lineMap[targetY] = [];
        }
        lineMap[targetY].push({ x, text: item.str });
      }

      const sortedY = Object.keys(lineMap).map(Number).sort((a, b) => b - a);

      for (const y of sortedY) {
        const lineItems = lineMap[y].sort((a, b) => a.x - b.x);
        const lineText = lineItems.map(i => i.text.trim()).join('  ');
        if (lineText.trim()) {
          allLines.push(lineText.trim());
        }
      }
    }

    return parseExpensesFromTextLines(allLines);
  } catch (err: any) {
    return { validExpenses: [], errors: [`Failed to parse PDF file: ${err?.message || 'Invalid or encrypted PDF'}`] };
  }
};

/**
 * PARSE BACKUP PDF FILE
 */
export const parseBackupPDF = async (fileBuffer: ArrayBuffer): Promise<{
  success: boolean;
  data: {
    expenses: Expense[];
    memberBankAmounts?: Record<FamilyMember, MemberBankAmount>;
    emis?: EmiPlan[];
    sips?: SipPlan[];
    debts?: DebtRecord[];
    monthlyBudget?: number;
    adminPin?: string;
    familyMembers?: string[];
    memberConfigs?: Record<string, MemberCustomConfig>;
  } | null;
  error: string | null;
}> => {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
    const pdfDoc = await loadingTask.promise;

    let fullText = '';
    const allLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((i: any) => i.str).join(' ');
      fullText += pageText + ' ';

      const lineMap: Record<number, { x: number; text: string }[]> = {};
      for (const item of textContent.items as any[]) {
        if (!item.str || !item.str.trim()) continue;
        const transform = item.transform;
        const y = Math.round(transform[5]);
        const x = transform[4];

        const existingY = Object.keys(lineMap).find(k => Math.abs(Number(k) - y) < 4);
        const targetY = existingY ? Number(existingY) : y;

        if (!lineMap[targetY]) {
          lineMap[targetY] = [];
        }
        lineMap[targetY].push({ x, text: item.str });
      }

      const sortedY = Object.keys(lineMap).map(Number).sort((a, b) => b - a);

      for (const y of sortedY) {
        const lineItems = lineMap[y].sort((a, b) => a.x - b.x);
        const lineText = lineItems.map(i => i.text.trim()).join('  ');
        if (lineText.trim()) {
          allLines.push(lineText.trim());
        }
      }
    }

    // 1. Check for Base64 embedded payload markers
    const startIdx = fullText.indexOf('===FULL_BACKUP_DATA_START===');
    const endIdx = fullText.indexOf('===FULL_BACKUP_DATA_END===');

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const rawSegment = fullText.substring(startIdx + '===FULL_BACKUP_DATA_START==='.length, endIdx);
      const cleanBase64 = rawSegment.replace(/\s+/g, '');
      try {
        const decodedJsonStr = decodeURIComponent(escape(atob(cleanBase64)));
        const parsed = JSON.parse(decodedJsonStr);
        const result = parseBackupJSON(JSON.stringify(parsed));
        if (result.success && result.data) {
          return result;
        }
      } catch (err) {
        console.warn('Failed to decode Base64 backup payload from PDF:', err);
      }
    }

    // 2. Check for legacy raw JSON embedded payload
    const legacyMatch = fullText.match(/---\s*BACKUP_DATA_START\s*---\s*(\{[\s\S]*?\})\s*---\s*BACKUP_DATA_END\s*---/i) ||
                        fullText.match(/(\{[\s\S]*?"expenses"\s*:[\s\S]*?\})/);

    if (legacyMatch && legacyMatch[1]) {
      try {
        const parsed = JSON.parse(legacyMatch[1].trim());
        const result = parseBackupJSON(JSON.stringify(parsed));
        if (result.success && result.data) {
          return result;
        }
      } catch (err) {
        console.warn('Failed to parse legacy embedded PDF backup payload');
      }
    }

    // 3. Fallback: Parse expenses from text lines
    const { validExpenses, errors } = parseExpensesFromTextLines(allLines);
    if (validExpenses.length > 0) {
      return {
        success: true,
        data: {
          expenses: validExpenses as Expense[],
          memberBankAmounts: undefined,
          emis: undefined,
          monthlyBudget: undefined
        },
        error: errors.length > 0 ? errors.join(', ') : null
      };
    }

    return {
      success: false,
      data: null,
      error: 'Could not extract valid backup data or expense items from PDF file.'
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: `Failed to process PDF backup file: ${err?.message || 'Invalid or encrypted PDF'}`
    };
  }
};


