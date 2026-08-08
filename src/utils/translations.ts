export type Language = 'en' | 'hi' | 'pa' | 'hi-Latn';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'hi-Latn', name: 'Hinglish', nativeName: 'Hinglish' },
];

export const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'Family Expenses and Savings',
    currencyTag: '₹ INR',
    realtimeSync: 'Real-time Sync Active',
    syncing: 'Syncing...',
    entries: 'Entries',
    addExpense: 'Add Expense',
    addInr: 'Add ₹',
    language: 'Language',
    activeMember: 'Active Family Profile',
    switchMember: 'Logged in as',
    
    // Tabs
    tabDashboard: 'Overview & Analytics',
    tabTransactions: 'Expense Log',
    tabGrocery: 'Smart Grocery Manager',
    tabSips: 'SIP & Investments',
    tabEmis: 'EMI Tracker',
    tabDebts: 'Debt Tracker',
    tabSettlement: 'Split & Settle',
    tabAndroidGuide: 'Android App Source',

    // Dashboard
    totalExpenses: 'Total Monthly Expenses',
    monthlyBudget: 'Monthly Budget',
    remainingBudget: 'Remaining Budget',
    savingsGoal: 'Family Savings Goal',
    overBudgetAlert: 'Monthly Family Budget Limit Exceeded!',
    summaryReportBtn: 'Monthly Summary PDF Report',
    downloadPdf: 'Download PDF File',
    generatingPdf: 'Generating PDF...',
    printPdf: 'Print Report',
    activeEmisCount: 'Active Family EMIs',
    activeSipsCount: 'Active SIP Investments',
    activeDebtsCount: 'Active Debts',
    categoryBreakdown: 'Expenses by Category',
    memberSpending: 'Spending by Family Member',
    recentTransactions: 'Recent Family Expenses',
    editBudget: 'Edit Budget',
    saveBudget: 'Save Budget',
    cancel: 'Cancel',
    loggedGroceryExps: 'Logged Grocery Expenses',

    // Active Member Bar & Profiles
    memberProfiles: 'Family Member Profiles',
    manageMembers: 'Manage Members',
    restartsOnFirst: 'Spent of this month restarts from ₹0 on 1st of every month',
    spentThisMonth: 'Spent of this month',
    totalSpent: 'Total Spent',
    records: 'Records',
    bankSettled: 'Bank: Settled',
    bankPending: 'Bank Dues',
    monthlyRecordsTitle: "'s Monthly Records",
    monthlyRecordsSub: 'All-time monthly spending history maintained till date',
    totalSpentTillDate: 'Total Spent Till Date',
    downloadPdfStatement: 'Download PDF',
    downloadCsvStatement: 'Download CSV',
    updateBankDetails: 'Update Member Bank & Pending Dues',
    bankName: 'Bank Name / UPI ID',
    pendingBankDues: 'Pending Bank Transfer Dues',
    updateTotalSpent: 'Update Total Spent',
    updateMonthSpent: 'Update Month Spent',
    saveChanges: 'Save Changes',
    resetToCalculated: 'Reset to Calculated',

    // Grocery & Ration Section
    grocerySectionTitle: 'Smart Grocery & Ration Manager',
    grocerySectionSub: 'Log monthly bulk ration, kirana, and mandi purchases directly',
    totalGrocerySpent: 'Total Grocery Spent',
    bulkRation: 'Bulk Ration',
    kiranaSpices: 'Kirana & Spices',
    mandiVeggies: 'Mandi Veggies & Dairy',
    viewGroceryLog: 'View Full Grocery Log',

    // Add Expense Modal
    logExpenseTitle: 'Log Family Expense (₹)',
    editExpenseTitle: 'Edit Expense Record',
    amountLabel: 'Amount (₹ INR)',
    paidByLabel: 'Paid By Member',
    categoryLabel: 'Category',
    dateLabel: 'Date',
    timeLabel: 'Time',
    notesLabel: 'Notes / Details (Optional)',
    saveExpense: 'Save Expense Record',
    updateExpense: 'Update Expense',
    groceryType: 'Grocery',
    sipType: 'SIP / Mutual Fund',

    // SIP & Investment View
    sipTitle: 'Family SIP & Mutual Funds',
    sipSubtitle: 'Monthly SIP & Wealth Growth Tracker',
    totalMonthlySip: 'Total Monthly SIP',
    activePlans: 'Active Plans',
    totalInvestedValue: 'Total Invested Value',
    projectedWealth: 'Projected Wealth (10 Yrs)',
    newSipPlan: '+ New SIP Plan',
    sipCalculator: 'SIP Calculator',

    // EMI Tracker View
    emiTrackerTitle: 'Family EMI & Loan Tracker',
    addEmiPlan: 'Add New EMI Plan',
    totalMonthlyBurden: 'Total Active Monthly EMI Burden',
    totalOutstandingLoan: 'Total Outstanding Loan Amount',
    payEmiBtn: "Pay This Month's EMI",
    emiCompleted: 'EMI Completed',

    // Debt Tracker View
    debtTrackerTitle: 'Family Debt & Credit Tracker',
    addDebtRecord: 'Add Debt Record',
    youOwe: 'You Owe (Payable)',
    youAreOwed: 'You Are Owed (Receivable)',
    totalOwed: 'Total You Owe',
    totalReceivable: 'Total You Will Receive',
    settleDebt: 'Settle Debt',

    // Transactions
    searchPlaceholder: 'Search by notes, category or member...',
    allMembers: 'All Family Members',
    allCategories: 'All Categories',
    exportCsv: 'Export CSV',
    noExpensesFound: 'No Expenses Found',
    resetFilters: 'Reset Filters',

    // Settlement
    fairShareTitle: 'Fair Share Split & Settlement Calculator',
    fairShareSub: 'Calculates equal splitting across pre-configured family members.',
    totalFamilyExpense: 'Total Family Expense',
    equalShare: 'Equal Share / Member',
    suggestedSettlement: 'Suggested Instant Settlement Steps',
    allSettled: 'All family members have paid equal shares! No pending balances.',
    getsBack: 'Gets back',
    owesPool: 'Owes pool',
    settledZero: 'Settled (₹0)',
    pendingBankAmount: 'Pending Bank Amount',
    editBankDetails: 'Update Member Bank & Pending Dues',
    totalPendingBank: 'Total Family Bank Dues Pending',
    bankDuesLabel: 'Bank Dues / Transfer Pending',
    markBankCleared: 'Mark Bank Amount Cleared',

    // Savings & Trend
    quickAddSavings: 'Quick Add Savings',
    trendTitle: '6-Month Expense Trend & Member Comparison',

    // Common UI
    close: 'Close',
    actions: 'Actions',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    status: 'Status',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    paid: 'Paid',
    pending: 'Pending',
    cleared: 'Cleared',
    settled: 'Settled',

    // Categories
    catGrocery: 'Groceries',
    catSip: 'SIP & Investments',
    catEmi: 'EMI & Loans',
    catBills: 'Utilities & Bills',
    catMedical: 'Medical',
    catFuel: 'Fuel',
    catRent: 'Rent & Housing',
    catDining: 'Dining',
    catShopping: 'Shopping',
    catHousehold: 'Household',
    catEducation: 'Education',
    catOthers: 'Others',
  },

  hi: {
    appName: 'पारिवारिक खर्च और बचत',
    currencyTag: '₹ भारतीय रुपया',
    realtimeSync: 'रियल-टाइम सिंक सक्रिय',
    syncing: 'सिंक हो रहा है...',
    entries: 'प्रविष्टियाँ',
    addExpense: 'खर्च दर्ज करें',
    addInr: 'जोड़ें ₹',
    language: 'भाषा',
    activeMember: 'सक्रिय परिवार प्रोफाइल',
    switchMember: 'लॉग इन किया गया:',

    // Tabs
    tabDashboard: 'अवलोकन और विश्लेषण',
    tabTransactions: 'खर्च लॉग',
    tabGrocery: 'स्मार्ट राशन व ग्रॉसरी मैनेजर',
    tabSips: 'एसआईपी और निवेश',
    tabEmis: 'ईएमआई ट्रैकर',
    tabDebts: 'कर्ज व उधारी ट्रैकर',
    tabSettlement: 'हिसाब और चुकता',
    tabAndroidGuide: 'एंड्रॉइड ऐप',

    // Dashboard
    totalExpenses: 'कुल मासिक खर्च',
    monthlyBudget: 'मासिक बजट',
    remainingBudget: 'शेष बजट',
    savingsGoal: 'पारिवारिक बचत लक्ष्य',
    overBudgetAlert: 'मासिक पारिवारिक बजट सीमा पार हो गई है!',
    summaryReportBtn: 'मासिक सारांश पीडीएफ रिपोर्ट',
    downloadPdf: 'पीडीएफ डाउनलोड करें',
    generatingPdf: 'पीडीएफ बन रहा है...',
    printPdf: 'रिपोर्ट प्रिंट करें',
    activeEmisCount: 'सक्रिय पारिवारिक ईएमआई',
    activeSipsCount: 'सक्रिय एसआईपी व निवेश',
    activeDebtsCount: 'कुल बकाया कर्ज',
    categoryBreakdown: 'श्रेणी के अनुसार खर्च',
    memberSpending: 'सदस्य के अनुसार खर्च',
    recentTransactions: 'हाल के पारिवारिक खर्च',
    editBudget: 'बजट बदलें',
    saveBudget: 'बजट सहेजें',
    cancel: 'रद्द करें',
    loggedGroceryExps: 'दर्ज राशन खर्च',

    // Active Member Bar & Profiles
    memberProfiles: 'परिवार के सदस्य प्रोफाइल',
    manageMembers: 'सदस्य प्रबंधित करें',
    restartsOnFirst: 'हर महीने की 1 तारीख को इस महीने का खर्च ₹0 से शुरू होता है',
    spentThisMonth: 'इस महीने का खर्च',
    totalSpent: 'कुल खर्च',
    records: 'रिकॉर्ड',
    bankSettled: 'बैंक: चुकता',
    bankPending: 'बैंक बकाया',
    monthlyRecordsTitle: ' का मासिक खर्च रिकॉर्ड',
    monthlyRecordsSub: 'अब तक का मासिक खर्च इतिहास',
    totalSpentTillDate: 'अब तक का कुल खर्च',
    downloadPdfStatement: 'पीडीएफ डाउनलोड करें',
    downloadCsvStatement: 'सीएसवी डाउनलोड करें',
    updateBankDetails: 'सदस्य बैंक विवरण और बकाया बदलें',
    bankName: 'बैंक नाम / यूपीआई आईडी',
    pendingBankDues: 'बकाया बैंक ट्रांसफर',
    updateTotalSpent: 'कुल खर्च बदलें',
    updateMonthSpent: 'इस महीने का खर्च बदलें',
    saveChanges: 'बदलाव सहेजें',
    resetToCalculated: 'वास्तविक गणना पर रीसेट करें',

    // Grocery & Ration Section
    grocerySectionTitle: 'स्मार्ट राशन व ग्रॉसरी मैनेजर',
    grocerySectionSub: 'महीने का राशन, किराना और सब्जी मंडी का खर्च दर्ज करें',
    totalGrocerySpent: 'कुल राशन खर्च',
    bulkRation: 'मासिक राशन',
    kiranaSpices: 'किराना व मसाले',
    mandiVeggies: 'मंडी सब्जी व दूध',
    viewGroceryLog: 'राशन खर्च देखें',

    // Add Expense Modal
    logExpenseTitle: 'पारिवारिक खर्च दर्ज करें (₹)',
    editExpenseTitle: 'खर्च रिकॉर्ड संपादित करें',
    amountLabel: 'राशि (₹ रुपये)',
    paidByLabel: 'किस सदस्य ने भुगतान किया',
    categoryLabel: 'श्रेणी',
    dateLabel: 'दिनांक',
    timeLabel: 'समय',
    notesLabel: 'विवरण / नोट्स (वैकल्पिक)',
    saveExpense: 'खर्च सहेजें',
    updateExpense: 'अपडेट करें',
    groceryType: 'राशन व किराना',
    sipType: 'एसआईपी और म्यूचुअल फंड',

    // SIP & Investment View
    sipTitle: 'पारिवारिक एसआईपी और म्यूचुअल फंड',
    sipSubtitle: 'मासिक एसआईपी और धन वृद्धि ट्रैकर',
    totalMonthlySip: 'कुल मासिक एसआईपी',
    activePlans: 'सक्रिय योजनाएं',
    totalInvestedValue: 'कुल निवेशित मूल्य',
    projectedWealth: 'अनुमानित संपत्ति (10 वर्ष)',
    newSipPlan: '+ नई एसआईपी योजना',
    sipCalculator: 'एसआईपी कैलकुलेटर',

    // EMI Tracker View
    emiTrackerTitle: 'पारिवारिक ईएमआई और ऋण ट्रैकर',
    addEmiPlan: 'नई ईएमआई योजना जोड़ें',
    totalMonthlyBurden: 'कुल सक्रिय मासिक ईएमआई बोझ',
    totalOutstandingLoan: 'कुल बकाया लोन राशि',
    payEmiBtn: 'इस महीने की ईएमआई दें',
    emiCompleted: 'ईएमआई पूरी हो गई',

    // Debt Tracker View
    debtTrackerTitle: 'पारिवारिक कर्ज व उधारी ट्रैकर',
    addDebtRecord: 'कर्ज रिकॉर्ड जोड़ें',
    youOwe: 'देना बकाया (देय)',
    youAreOwed: 'वापस मिलना है (प्राप्य)',
    totalOwed: 'कुल देना बकाया',
    totalReceivable: 'कुल वापस मिलना है',
    settleDebt: 'कर्ज चुकता करें',

    // Transactions
    searchPlaceholder: 'नोट्स, श्रेणी या सदस्य से खोजें...',
    allMembers: 'सभी परिवार के सदस्य',
    allCategories: 'सभी श्रेणियां',
    exportCsv: 'सीएसवी डाउनलोड',
    noExpensesFound: 'कोई खर्च नहीं मिला',
    resetFilters: 'फ़िल्टर हटाएं',

    // Settlement
    fairShareTitle: 'बराबर हिस्सा विभाजन और भुगतान कैलकुलेटर',
    fairShareSub: 'परिवार के सभी सदस्यों के बीच बराबर विभाजन की गणना करता है।',
    totalFamilyExpense: 'कुल पारिवारिक खर्च',
    equalShare: 'बराबर हिस्सा / सदस्य',
    suggestedSettlement: 'सुझाए गए तुरंत भुगतान कदम',
    allSettled: 'सभी सदस्यों ने बराबर हिस्सा दिया है! कोई बकाया नहीं।',
    getsBack: 'वापस मिलेगा',
    owesPool: 'देना होगा',
    settledZero: 'बराबर (₹0)',
    pendingBankAmount: 'बकाया बैंक राशि',
    editBankDetails: 'सदस्य बैंक व बकाया राशि बदलें',
    totalPendingBank: 'कुल पारिवारिक बैंक बकाया',
    bankDuesLabel: 'बैंक ट्रांसफर / बकाया',
    markBankCleared: 'बैंक राशि चुकता दर्ज करें',

    // Savings & Trend
    quickAddSavings: 'बचत में जोड़ें',
    trendTitle: '6 महीने का खर्च रुझान व सदस्य तुलना',

    // Common UI
    close: 'बंद करें',
    actions: 'कार्रवाई',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    save: 'सहेजें',
    status: 'स्थिति',
    active: 'सक्रिय',
    paused: 'रुकी हुई',
    completed: 'पूरी हुई',
    paid: 'भुगतान किया',
    pending: 'बकाया',
    cleared: 'चुकता',
    settled: 'बराबर',

    // Categories
    catGrocery: 'राशन व किराना',
    catSip: 'एसआईपी और निवेश',
    catEmi: 'ईएमआई व ऋण',
    catBills: 'बिल व बिजली',
    catMedical: 'दवाई व इलाज',
    catFuel: 'ईंधन / पेट्रोल',
    catRent: 'किराया व आवास',
    catDining: 'खान-पान',
    catShopping: 'खरीदारी',
    catHousehold: 'घरेलू सामान',
    catEducation: 'शिक्षा व फीस',
    catOthers: 'अन्य',
  },

  pa: {
    appName: 'ਪਰਿਵਾਰਕ ਖਰਚੇ ਅਤੇ ਬਚਤ',
    currencyTag: '₹ ਭਾਰਤੀ ਰੁਪਇਆ',
    realtimeSync: 'ਰਿਅਲ-ਟਾਈਮ ਸਿੰਕ ਚਾਲੂ',
    syncing: 'ਸਿੰਕ ਹੋ ਰਿਹਾ ਹੈ...',
    entries: 'ਦਰਜਾਂ',
    addExpense: 'ਖਰਚਾ ਜੋੜੋ',
    addInr: 'ਜੋੜੋ ₹',
    language: 'ਭਾਸ਼ਾ',
    activeMember: 'ਸਰਗਰਮ ਪਰਿਵਾਰਕ ਪ੍ਰੋਫਾਈਲ',
    switchMember: 'ਲਾਗਇਨ ਕੀਤਾ:',

    // Tabs
    tabDashboard: 'ਸੰਖੇਪ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ',
    tabTransactions: 'ਖਰਚਾ ਲੌਗ',
    tabGrocery: 'ਸਮਾਰਟ ਰਾਸ਼ਨ ਅਤੇ ਗ੍ਰੋਸਰੀ ਮੈਨੇਜਰ',
    tabSips: 'ਐਸਆਈਪੀ ਅਤੇ ਨਿਵੇਸ਼',
    tabEmis: 'ਈਐਮਆਈ ਟ੍ਰੈਕਰ',
    tabDebts: 'ਕਰਜ਼ਾ ਟ੍ਰੈਕਰ',
    tabSettlement: 'ਹਿਸਾਬ ਅਤੇ ਨਿਪਟਾਰਾ',
    tabAndroidGuide: 'ਐਂਡਰਾਇਡ ਐਪ',

    // Dashboard
    totalExpenses: 'ਕੁੱਲ ਮਹੀਨਾਵਾਰ ਖਰਚੇ',
    monthlyBudget: 'ਮਹੀਨਾਵਾਰ ਬਜਟ',
    remainingBudget: 'ਬਾਕੀ ਬਜਟ',
    savingsGoal: 'ਪਰਿਵਾਰਕ ਬਚਤ ਟੀਚਾ',
    overBudgetAlert: 'ਮਹੀਨਾਵਾਰ ਪਰਿਵਾਰਕ ਬਜਟ ਸੀਮਾ ਪਾਰ ਹੋ ਗਈ ਹੈ!',
    summaryReportBtn: 'ਮਹੀਨਾਵਾਰ ਸੰਖੇਪ ਪੀਡੀਐਫ ਰਿਪੋਰਟ',
    downloadPdf: 'ਪੀਡੀਐਫ ਫਾਈਲ ਡਾਊਨਲੋਡ ਕਰੋ',
    generatingPdf: 'ਪੀਡੀਐਫ ਬਣ ਰਹੀ ਹੈ...',
    printPdf: 'ਰਿਪੋਰਟ ਪ੍ਰਿੰਟ ਕਰੋ',
    activeEmisCount: 'ਸਰਗਰਮ ਪਰਿਵਾਰਕ ਈਐਮਆਈ',
    activeSipsCount: 'ਸਰਗਰਮ ਐਸਆਈਪੀ',
    activeDebtsCount: 'ਕੁੱਲ ਕਰਜ਼ਾ',
    categoryBreakdown: 'ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਖਰਚੇ',
    memberSpending: 'ਮੈਂਬਰ ਅਨੁਸਾਰ ਖਰਚੇ',
    recentTransactions: 'ਤਾਜ਼ਾ ਪਰਿਵਾਰਕ ਖਰਚੇ',
    editBudget: 'ਬਜਟ ਬਦਲੋ',
    saveBudget: 'ਬਜਟ ਸੰਭਾਲੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    loggedGroceryExps: 'ਦਰਜ ਰਾਸ਼ਨ ਖਰਚਾ',

    // Active Member Bar & Profiles
    memberProfiles: 'ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਪ੍ਰੋਫਾਈਲ',
    manageMembers: 'ਮੈਂਬਰ ਪ੍ਰਬੰਧਿਤ ਕਰੋ',
    restartsOnFirst: 'ਹਰ ਮਹੀਨੇ ਦੀ 1 ਤਾਰੀਖ ਨੂੰ ਇਸ ਮਹੀਨੇ ਦਾ ਖਰਚਾ ₹0 ਤੋਂ ਸ਼ੁਰੂ ਹੁੰਦਾ ਹੈ',
    spentThisMonth: 'ਇਸ ਮਹੀਨੇ ਦਾ ਖਰਚਾ',
    totalSpent: 'ਕੁੱਲ ਖਰਚਾ',
    records: 'ਰਿਕਾਰਡ',
    bankSettled: 'ਬੈਂਕ: ਨਿਪਟਾਰਾ',
    bankPending: 'ਬੈਂਕ ਬਕਾਇਆ',
    monthlyRecordsTitle: ' ਦਾ ਮਹੀਨਾਵਾਰ ਖਰਚਾ ਰਿਕਾਰਡ',
    monthlyRecordsSub: 'ਹੁਣ ਤੱਕ ਦਾ ਮਹੀਨਾਵਾਰ ਖਰਚਾ ਇਤਿਹਾਸ',
    totalSpentTillDate: 'ਹੁਣ ਤੱਕ ਦਾ ਕੁੱਲ ਖਰਚਾ',
    downloadPdfStatement: 'ਪੀਡੀਐਫ ਡਾਊਨਲੋਡ ਕਰੋ',
    downloadCsvStatement: 'ਸੀਐਸਵੀ ਡਾਊਨਲੋਡ ਕਰੋ',
    updateBankDetails: 'ਮੈਂਬਰ ਬੈਂਕ ਵੇਰਵੇ ਤੇ ਬਕਾਇਆ ਬਦਲੋ',
    bankName: 'ਬੈਂਕ ਨਾਂ / ਯੂਪੀਆਈ ਆਈਡੀ',
    pendingBankDues: 'ਬਕਾਇਆ ਬੈਂਕ ਟਰਾਂਸਫਰ',
    updateTotalSpent: 'ਕੁੱਲ ਖਰਚਾ ਬਦਲੋ',
    updateMonthSpent: 'ਇਸ ਮਹੀਨੇ ਦਾ ਖਰਚਾ ਬਦਲੋ',
    saveChanges: 'ਬਦਲਾਅ ਸੰਭਾਲੋ',
    resetToCalculated: 'ਅਸਲ ਗਣਨਾ ਤੇ ਰੀਸੈਟ ਕਰੋ',

    // Grocery & Ration Section
    grocerySectionTitle: 'ਸਮਾਰਟ ਰਾਸ਼ਨ ਅਤੇ ਗ੍ਰੋਸਰੀ ਮੈਨੇਜਰ',
    grocerySectionSub: 'ਮਹੀਨੇ ਦਾ ਰਾਸ਼ਨ, ਕਰਿਆਨਾ ਅਤੇ ਸਬਜ਼ੀ ਮੰਡੀ ਦਾ ਖਰਚਾ ਦਰਜ ਕਰੋ',
    totalGrocerySpent: 'ਕੁੱਲ ਰਾਸ਼ਨ ਖਰਚਾ',
    bulkRation: 'ਮਹੀਨਾਵਾਰ ਰਾਸ਼ਨ',
    kiranaSpices: 'ਕਰਿਆਨਾ ਤੇ ਮਸਾਲੇ',
    mandiVeggies: 'ਮੰਡੀ ਸਬਜ਼ੀ ਤੇ ਦੁੱਧ',
    viewGroceryLog: 'ਰਾਸ਼ਨ ਖਰਚਾ ਵੇਖੋ',

    // Add Expense Modal
    logExpenseTitle: 'ਪਰਿਵਾਰਕ ਖਰਚਾ ਦਰਜ ਕਰੋ (₹)',
    editExpenseTitle: 'ਖਰਚਾ ਰਿਕਾਰਡ ਸੋਧੋ',
    amountLabel: 'ਰਕਮ (₹ ਰੁਪਏ)',
    paidByLabel: 'ਕਿਸ ਮੈਂਬਰ ਨੇ ਭੁਗਤਾਨ ਕੀਤਾ',
    categoryLabel: 'ਸ਼੍ਰੇਣੀ',
    dateLabel: 'ਮਿਤੀ',
    timeLabel: 'ਸਮਾਂ',
    notesLabel: 'ਵੇਰਵਾ / ਨੋਟਸ (ਵਿਕਲਪਿਕ)',
    saveExpense: 'ਖਰਚਾ ਸੰਭਾਲੋ',
    updateExpense: 'ਅਪਡੇਟ ਕਰੋ',
    groceryType: 'ਰਾਸ਼ਨ ਤੇ ਕਰਿਆਨਾ',
    sipType: 'ਐਸਆਈਪੀ ਅਤੇ ਨਿਵੇਸ਼',

    // SIP & Investment View
    sipTitle: 'ਪਰਿਵਾਰਕ ਐਸਆਈਪੀ ਅਤੇ ਨਿਵੇਸ਼',
    sipSubtitle: 'ਮਹੀਨਾਵਾਰ ਐਸਆਈਪੀ ਟ੍ਰੈਕਰ',
    totalMonthlySip: 'ਕੁੱਲ ਮਹੀਨਾਵਾਰ ਐਸਆਈਪੀ',
    activePlans: 'ਸਰਗਰਮ ਯੋਜਨਾਵਾਂ',
    totalInvestedValue: 'ਕੁੱਲ ਨਿਵੇਸ਼ ਕੀਤਾ ਮੁੱਲ',
    projectedWealth: 'ਅਨੁਮਾਨਿਤ ਸੰਪਤੀ (10 ਸਾਲ)',
    newSipPlan: '+ ਨਵੀਂ ਐਸਆਈਪੀ ਯੋਜਨਾ',
    sipCalculator: 'ਐਸਆਈਪੀ ਕੈਲਕੁਲੇਟਰ',

    // EMI Tracker View
    emiTrackerTitle: 'ਪਰਿਵਾਰਕ ਈਐਮਆਈ ਅਤੇ ਲੋਨ ਟ੍ਰੈਕਰ',
    addEmiPlan: 'ਨਵੀਂ ਈਐਮਆਈ ਯੋਜਨਾ ਜੋੜੋ',
    totalMonthlyBurden: 'ਕੁੱਲ ਸਰਗਰਮ ਮਹੀਨਾਵਾਰ ਈਐਮਆਈ ਬੋਝ',
    totalOutstandingLoan: 'ਕੁੱਲ ਬਕਾਇਆ ਲੋਨ ਰਕਮ',
    payEmiBtn: 'ਇਸ ਮਹੀਨੇ ਦੀ ਈਐਮਆਈ ਦਿਓ',
    emiCompleted: 'ਈਐਮਆਈ ਪੂਰੀ ਹੋ ਗਈ',

    // Debt Tracker View
    debtTrackerTitle: 'ਪਰਿਵਾਰਕ ਕਰਜ਼ਾ ਟ੍ਰੈਕਰ',
    addDebtRecord: 'ਕਰਜ਼ਾ ਰਿਕਾਰਡ ਜੋੜੋ',
    youOwe: 'ਦੇਣਾ ਬਕਾਇਆ',
    youAreOwed: 'ਵਾਪਸ ਮਿਲਣਾ ਹੈ',
    totalOwed: 'ਕੁੱਲ ਦੇਣਾ ਬਕਾਇਆ',
    totalReceivable: 'ਕੁੱਲ ਵਾਪਸ ਮਿਲਣਾ ਹੈ',
    settleDebt: 'ਕਰਜ਼ਾ ਨਿਪਟਾਓ',

    // Transactions
    searchPlaceholder: 'ਨੋਟਸ, ਸ਼੍ਰੇਣੀ ਜਾਂ ਮੈਂਬਰ ਤੋਂ ਲੱਭੋ...',
    allMembers: 'ਸਾਰੇ ਪਰਿਵਾਰਕ ਮੈਂਬਰ',
    allCategories: 'ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ',
    exportCsv: 'ਸੀਐਸਵੀ ਨਿਰਯਾਤ',
    noExpensesFound: 'ਕੋਈ ਖਰਚਾ ਨਹੀਂ ਮਿਲਿਆ',
    resetFilters: 'ਫਿਲਟਰ ਹਟਾਓ',

    // Settlement
    fairShareTitle: 'ਬਰਾਬਰ ਹਿੱਸਾ ਵੰਡ ਅਤੇ ਨਿਪਟਾਰਾ ਕੈਲਕੁਲੇਟਰ',
    fairShareSub: 'ਪਰਿਵਾਰ ਦੇ ਸਾਰੇ ਮੈਂਬਰਾਂ ਵਿਚਕਾਰ ਬਰਾਬਰ ਵੰਡ ਦੀ ਗਣਨਾ ਕਰਦਾ ਹੈ।',
    totalFamilyExpense: 'ਕੁੱਲ ਪਰਿਵਾਰਕ ਖਰਚਾ',
    equalShare: 'ਬਰਾਬਰ ਹਿੱਸਾ / ਮੈਂਬਰ',
    suggestedSettlement: 'ਤੁਰੰਤ ਹਿਸਾਬ ਦੇ ਸੁਝਾਏ ਕਦਮ',
    allSettled: 'ਸਾਰੇ ਮੈਂਬਰਾਂ ਨੇ ਬਰਾਬਰ ਹਿੱਸਾ ਦਿੱਤਾ ਹੈ! ਕੋਈ ਬਕਾਇਆ ਨਹੀਂ।',
    getsBack: 'ਵਾਪਸ ਮਿਲੇਗਾ',
    owesPool: 'ਦੇਣਾ ਪਵੇਗਾ',
    settledZero: 'ਹਿਸਾਬ ਬਰਾਬਰ (₹0)',
    pendingBankAmount: 'ਬਕਾਇਆ ਬੈਂਕ ਰਕਮ',
    editBankDetails: 'ਮੈਂਬਰ ਬੈਂਕ ਤੇ ਬਕਾਇਆ ਬਦਲੋ',
    totalPendingBank: 'ਕੁੱਲ ਪਰਿਵਾਰਕ ਬੈਂਕ ਬਕਾਇਆ',
    bankDuesLabel: 'ਬੈਂਕ ਟਰਾਂਸਫਰ / ਬਕਾਇਆ',
    markBankCleared: 'ਬੈਂਕ ਰਕਮ ਨਿਪਟਾਰਾ ਚਿੰਨ੍ਹਿਤ ਕਰੋ',

    // Savings & Trend
    quickAddSavings: 'ਬਚਤ ਵਿੱਚ ਜੋੜੋ',
    trendTitle: '6 ਮਹੀਨੇ ਦਾ ਖਰਚਾ ਰੁਝਾਨ ਤੇ ਮੈਂਬਰ ਤੁਲਨਾ',

    // Common UI
    close: 'ਬੰਦ ਕਰੋ',
    actions: 'ਕਾਰਵਾਈ',
    delete: 'ਹਟਾਓ',
    edit: 'ਸੋਧੋ',
    save: 'ਸੰਭਾਲੋ',
    status: 'ਸਥਿਤੀ',
    active: 'ਸਰਗਰਮ',
    paused: 'ਰੋਕੀ ਗਈ',
    completed: 'ਪੂਰੀ ਹੋਈ',
    paid: 'ਭੁਗਤਾਨ ਕੀਤਾ',
    pending: 'ਬਕਾਇਆ',
    cleared: 'ਨਿਪਟਾਇਆ',
    settled: 'ਬਰਾਬਰ',

    // Categories
    catGrocery: 'ਕਰਿਆਨਾ ਤੇ ਰਾਸ਼ਨ',
    catSip: 'ਐਸਆਈਪੀ ਤੇ ਨਿਵੇਸ਼',
    catEmi: 'ਈਐਮਆਈ ਤੇ ਲੋਨ',
    catBills: 'ਬਿੱਲ ਤੇ ਬਿਜਲੀ',
    catMedical: 'ਦਵਾਈ ਤੇ ਇਲਾਜ',
    catFuel: 'ਤੇਲ / ਪੈਟਰੋਲ',
    catRent: 'ਕਿਰਾਇਆ ਤੇ ਆਵਾਸ',
    catDining: 'ਖਾਣਾ-ਪੀਣਾ',
    catShopping: 'ਖਰੀਦਦਾਰੀ',
    catHousehold: 'ਘਰੇਲੂ ਸਾਮਾਨ',
    catEducation: 'ਸਿੱਖਿਆ ਤੇ ਫੀਸ',
    catOthers: 'ਹੋਰ',
  },

  'hi-Latn': {
    appName: 'Parivar Kharcha & Savings',
    currencyTag: '₹ INR',
    realtimeSync: 'Real-time Sync Active',
    syncing: 'Sync ho raha hai...',
    entries: 'Entries',
    addExpense: 'Expense Jodo',
    addInr: 'Jodo ₹',
    language: 'Bhasha',
    activeMember: 'Active Family Profile',
    switchMember: 'Logged in as',

    // Tabs
    tabDashboard: 'Overview & Analytics',
    tabTransactions: 'Expense Log',
    tabGrocery: 'Smart Grocery Manager',
    tabSips: 'SIP & Investments',
    tabEmis: 'EMI Tracker',
    tabDebts: 'Debt Tracker',
    tabSettlement: 'Hisab & Settlement',
    tabAndroidGuide: 'Android App',

    // Dashboard
    totalExpenses: 'Total Monthly Expense',
    monthlyBudget: 'Monthly Budget',
    remainingBudget: 'Baki Budget',
    savingsGoal: 'Family Savings Goal',
    overBudgetAlert: 'Monthly Family Budget Limit Exceed ho gayi hai!',
    summaryReportBtn: 'Monthly Summary PDF Report',
    downloadPdf: 'PDF File Download Karein',
    generatingPdf: 'PDF Ban Raha Hai...',
    printPdf: 'Print Report',
    activeEmisCount: 'Active Family EMIs',
    activeSipsCount: 'Active SIP Investments',
    activeDebtsCount: 'Active Debts',
    categoryBreakdown: 'Category ke hisab se Expense',
    memberSpending: 'Member ke hisab se Expense',
    recentTransactions: 'Haal ke Family Expenses',
    editBudget: 'Budget Badlein',
    saveBudget: 'Budget Save Karein',
    cancel: 'Cancel',
    loggedGroceryExps: 'Logged Grocery Expenses',

    // Active Member Bar & Profiles
    memberProfiles: 'Family Member Profiles',
    manageMembers: 'Members Manage Karein',
    restartsOnFirst: 'Har month ki 1st ko is month ka expense ₹0 se restart hota hai',
    spentThisMonth: 'Is Month Ka Spent',
    totalSpent: 'Total Spent',
    records: 'Records',
    bankSettled: 'Bank: Settled',
    bankPending: 'Bank Dues',
    monthlyRecordsTitle: ' ka Monthly Records',
    monthlyRecordsSub: 'Ab tak ka monthly spending history',
    totalSpentTillDate: 'Ab tak ka Total Spent',
    downloadPdfStatement: 'PDF Download Karein',
    downloadCsvStatement: 'CSV Download Karein',
    updateBankDetails: 'Member Bank & Pending Amount Badlein',
    bankName: 'Bank Name / UPI ID',
    pendingBankDues: 'Pending Bank Transfer Dues',
    updateTotalSpent: 'Total Spent Badlein',
    updateMonthSpent: 'Is Month Ka Spent Badlein',
    saveChanges: 'Save Karein',
    resetToCalculated: 'Reset Karein',

    // Grocery & Ration Section
    grocerySectionTitle: 'Smart Grocery & Ration Manager',
    grocerySectionSub: 'Month ka bulk ration, kirana aur mandi expense log karein',
    totalGrocerySpent: 'Total Grocery Spent',
    bulkRation: 'Bulk Ration',
    kiranaSpices: 'Kirana & Spices',
    mandiVeggies: 'Mandi Veggies & Dairy',
    viewGroceryLog: 'Grocery Log Dekhein',

    // Add Expense Modal
    logExpenseTitle: 'Family Expense Log Karein (₹)',
    editExpenseTitle: 'Expense Edit Karein',
    amountLabel: 'Amount (₹ INR)',
    paidByLabel: 'Kis Member ne Pay Kiya',
    categoryLabel: 'Category',
    dateLabel: 'Date',
    timeLabel: 'Time',
    notesLabel: 'Details / Notes (Optional)',
    saveExpense: 'Expense Save Karein',
    updateExpense: 'Update Karein',
    groceryType: 'Grocery',
    sipType: 'SIP / Mutual Fund',

    // SIP & Investment View
    sipTitle: 'Family SIP & Mutual Funds',
    sipSubtitle: 'Monthly SIP & Wealth Growth Tracker',
    totalMonthlySip: 'Total Monthly SIP',
    activePlans: 'Active Plans',
    totalInvestedValue: 'Total Invested Value',
    projectedWealth: 'Projected Wealth (10 Yrs)',
    newSipPlan: '+ Nayi SIP Plan',
    sipCalculator: 'SIP Calculator',

    // EMI Tracker View
    emiTrackerTitle: 'Family EMI & Loan Tracker',
    addEmiPlan: 'Nayi EMI Plan Jodo',
    totalMonthlyBurden: 'Total Active Monthly EMI Burden',
    totalOutstandingLoan: 'Total Outstanding Loan Amount',
    payEmiBtn: 'Is Month Ki EMI Pay Karein',
    emiCompleted: 'EMI Complete Ho Gayi',

    // Debt Tracker View
    debtTrackerTitle: 'Family Debt Tracker',
    addDebtRecord: 'Debt Record Jodo',
    youOwe: 'You Owe (Dena hai)',
    youAreOwed: 'You Are Owed (Milna hai)',
    totalOwed: 'Total You Owe',
    totalReceivable: 'Total You Will Receive',
    settleDebt: 'Settle Karein',

    // Transactions
    searchPlaceholder: 'Notes, category ya member search karein...',
    allMembers: 'Sabhi Family Members',
    allCategories: 'Sabhi Categories',
    exportCsv: 'Export CSV',
    noExpensesFound: 'Koi Expense Nahi Mila',
    resetFilters: 'Filters Reset Karein',

    // Settlement
    fairShareTitle: 'Fair Share Split & Hisab Calculator',
    fairShareSub: 'Family members ke beech equal split calculate karta hai.',
    totalFamilyExpense: 'Total Family Expense',
    equalShare: 'Equal Share / Member',
    suggestedSettlement: 'Instant Settlement Steps',
    allSettled: 'Sabhi members ne equal pay kiya hai! Koi pending balance nahi.',
    getsBack: 'Wapas milega',
    owesPool: 'Dena hai',
    settledZero: 'Hisab Barabar (₹0)',
    pendingBankAmount: 'Pending Bank Amount',
    editBankDetails: 'Member Bank & Pending Amount Badlein',
    totalPendingBank: 'Total Family Bank Dues Pending',
    bankDuesLabel: 'Bank Transfer / Dues',
    markBankCleared: 'Bank Amount Clear Karein',

    // Savings & Trend
    quickAddSavings: 'Savings me Jodo',
    trendTitle: '6-Month Expense Trend & Member Comparison',

    // Common UI
    close: 'Close',
    actions: 'Actions',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    status: 'Status',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    paid: 'Paid',
    pending: 'Pending',
    cleared: 'Cleared',
    settled: 'Settled',

    // Categories
    catGrocery: 'Grocery',
    catSip: 'SIP & Investments',
    catEmi: 'EMI & Loans',
    catBills: 'Bills & Utilities',
    catMedical: 'Medical',
    catFuel: 'Fuel',
    catRent: 'Rent & Housing',
    catDining: 'Dining',
    catShopping: 'Shopping',
    catHousehold: 'Household',
    catEducation: 'Education',
    catOthers: 'Others',
  }
};

// Direct translation phrase mapping for raw English strings
const EXACT_PHRASE_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    'Debts': 'कर्ज व उधारी',
    'Debt Tracker': 'कर्ज व उधारी ट्रैकर',
    'SIP': 'एसआईपी',
    'SIP & Investments': 'एसआईपी और निवेश',
    'SIP / Mutual Fund': 'एसआईपी और म्यूचुअल फंड',
    'Grocery': 'राशन व किराना',
    'Groceries': 'राशन व किराना',
    'Groceries & Family Ration': 'राशन और घरेलू राशन',
    'Overview & Analytics': 'अवलोकन और विश्लेषण',
    'Expense Log': 'खर्च लॉग',
    'EMI Tracker': 'ईएमआई ट्रैकर',
    'Split & Settle': 'हिसाब और चुकता',
    'Android App': 'एंड्रॉइड ऐप',
    'Family Expenses and Savings': 'पारिवारिक खर्च और बचत',
    'Family Expenses & Wealth': 'पारिवारिक खर्च और बचत',
    'Total Monthly Expenses': 'कुल मासिक खर्च',
    'Monthly Budget': 'मासिक बजट',
    'Remaining Budget': 'शेष बजट',
    'Family Savings Goal': 'पारिवारिक बचत लक्ष्य',
    'Expenses by Category': 'श्रेणी के अनुसार खर्च',
    'Spending by Family Member': 'सदस्य के अनुसार खर्च',
    'Recent Family Expenses': 'हाल के पारिवारिक खर्च',
    'Log Family Expense (₹)': 'पारिवारिक खर्च दर्ज करें (₹)',
    'Log Expense': 'खर्च दर्ज करें',
    'Add Expense': 'खर्च जोड़ें',
    'Edit Expense Record': 'खर्च रिकॉर्ड संपादित करें',
    'Amount (₹ INR)': 'राशि (₹ रुपये)',
    'Paid By Member': 'किस सदस्य ने भुगतान किया',
    'Category': 'श्रेणी',
    'Date': 'दिनांक',
    'Time': 'समय',
    'Notes / Details (Optional)': 'विवरण / नोट्स (वैकल्पिक)',
    'Notes': 'विवरण / नोट्स',
    'Save Expense Record': 'खर्च सहेजें',
    'Update Expense': 'अपडेट करें',
    'Cancel': 'रद्द करें',
    'Edit': 'संपादित करें',
    'Delete': 'हटाएं',
    'Search': 'खोजें',
    'All Family Members': 'सभी परिवार के सदस्य',
    'All Categories': 'सभी श्रेणियां',
    'Export CSV': 'सीएसवी डाउनलोड',
    'No Expenses Found': 'कोई खर्च नहीं मिला',
    'Reset Filters': 'फ़िल्टर हटाएं',
    'Active Family EMIs': 'सक्रिय पारिवारिक ईएमआई',
    'Active SIP Investments': 'सक्रिय एसआईपी और निवेश',
    'Active Debts': 'कुल बकाया कर्ज',
    'Paid': 'भुगतान किया',
    'Pending': 'बकाया',
    'Cleared': 'चुकता',
    'Settled': 'बराबर',
    'Active': 'सक्रिय',
    'Paused': 'रुकी हुई',
    'Completed': 'पूरी हुई',
    'Close': 'बंद करें',
    'Save': 'सहेजें',
    'Members': 'सदस्य',
    'Manage Members': 'सदस्य प्रबंधित करें',
    'Export / Import': 'निर्यात / आयात',
    'Web App Link': 'वेब ऐप लिंक',
    'Language': 'भाषा',
    'Profile': 'प्रोफाइल',
    'Clean Light': 'लाइट मोड',
    'Modern Dark': 'डार्क मोड',
    '9:16 Phone View': 'फोन व्यू',
    'Full Screen': 'फुल स्क्रीन',
  },
  pa: {
    'Debts': 'ਕਰਜ਼ਾ',
    'Debt Tracker': 'ਕਰਜ਼ਾ ਟ੍ਰੈਕਰ',
    'SIP': 'ਐਸਆਈਪੀ',
    'SIP & Investments': 'ਐਸਆਈਪੀ ਅਤੇ ਨਿਵੇਸ਼',
    'Grocery': 'ਰਾਸ਼ਨ ਤੇ ਕਰਿਆਨਾ',
    'Groceries': 'ਰਾਸ਼ਨ ਤੇ ਕਰਿਆਨਾ',
    'Overview & Analytics': 'ਸੰਖੇਪ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ',
    'Expense Log': 'ਖਰਚਾ ਲੌਗ',
    'EMI Tracker': 'ਈਐਮਆਈ ਟ੍ਰੈਕਰ',
    'Split & Settle': 'ਹਿਸਾਬ ਅਤੇ ਨਿਪਟਾਰਾ',
    'Total Monthly Expenses': 'ਕੁੱਲ ਮਹੀਨਾਵਾਰ ਖਰਚੇ',
    'Monthly Budget': 'ਮਹੀਨਾਵਾਰ ਬਜਟ',
    'Remaining Budget': 'ਬਾਕੀ ਬਜਟ',
    'Expenses by Category': 'ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਖਰਚੇ',
    'Spending by Family Member': 'ਮੈਂਬਰ ਅਨੁਸਾਰ ਖਰਚੇ',
    'Log Family Expense (₹)': 'ਪਰਿਵਾਰਕ ਖਰਚਾ ਦਰਜ ਕਰੋ (₹)',
    'Amount (₹ INR)': 'ਰਕਮ (₹ ਰੁਪਏ)',
    'Paid By Member': 'ਕਿਸ ਮੈਂਬਰ ਨੇ ਭੁਗਤਾਨ ਕੀਤਾ',
    'Category': 'ਸ਼੍ਰੇਣੀ',
    'Date': 'ਮਿਤੀ',
    'Time': 'ਸਮਾਂ',
    'Notes': 'ਨੋਟਸ',
    'Cancel': 'ਰੱਦ ਕਰੋ',
    'Edit': 'ਸੋਧੋ',
    'Delete': 'ਹਟਾਓ',
  },
  'hi-Latn': {
    'Debts': 'Debt Tracker',
    'SIP': 'SIP & Investment',
    'Grocery': 'Grocery',
    'Cancel': 'Cancel',
  }
};

export function t(key: string, lang: Language | string = 'en'): string {
  const code = (lang && lang in translations ? lang : 'en') as Language;
  
  // 1. Check exact key in translations map
  const langDict = translations[code] || translations.en;
  if (langDict[key]) {
    return langDict[key];
  }

  // 2. Check exact phrase translations map
  if (code in EXACT_PHRASE_TRANSLATIONS && EXACT_PHRASE_TRANSLATIONS[code][key]) {
    return EXACT_PHRASE_TRANSLATIONS[code][key];
  }

  // 3. Check English fallback
  if (translations.en[key]) {
    return translations.en[key];
  }

  return key;
}

export function translateMemberName(memberName: string, lang: Language | string = 'en'): string {
  if (lang !== 'hi' && lang !== 'pa') return memberName;
  const map: Record<string, Record<string, string>> = {
    hi: {
      'Aamir Khan': 'आमिर खान',
      'Amir Khan': 'आमिर खान',
      'Angrej Singh': 'अंगरेज सिंह',
      'Kajal': 'काजल',
      'Shahnaz': 'शहनाज़',
      'Sonam': 'सोनम',
      'Papa': 'पापा',
      'Mummy': 'मम्मी',
      'Admin': 'एडमिन',
    },
    pa: {
      'Aamir Khan': 'ਆਮਿਰ ਖਾਨ',
      'Amir Khan': 'ਆਮਿਰ ਖਾਨ',
      'Angrej Singh': 'ਅੰਗਰੇਜ਼ ਸਿੰਘ',
      'Kajal': 'ਕਾਜਲ',
      'Shahnaz': 'ਸ਼ਹਿਨਾਜ਼',
      'Sonam': 'ਸੋਨਮ',
      'Papa': 'ਪਾਪਾ',
      'Mummy': 'ਮੰਮੀ',
      'Admin': 'ਐਡਮਿਨ',
    }
  };
  return map[lang]?.[memberName] || memberName;
}

export function translateCategoryLabel(categoryId: string, lang: Language | string = 'en'): string {
  const norm = categoryId === 'Grocery' ? 'Groceries' : categoryId;
  switch (norm) {
    case 'Groceries':
      return t('catGrocery', lang) || 'राशन व किराना';
    case 'SIP':
      return t('catSip', lang) || 'एसआईपी और निवेश';
    case 'EMI':
      return t('catEmi', lang) || 'ईएमआई व ऋण';
    case 'Utilities':
      return t('catBills', lang) || 'बिल व बिजली';
    case 'Medical':
      return t('catMedical', lang) || 'दवाई व इलाज';
    case 'Fuel':
      return t('catFuel', lang) || 'ईंधन / पेट्रोल';
    case 'Rent':
      return t('catRent', lang) || 'किराया व आवास';
    case 'Dining':
      return t('catDining', lang) || 'खान-पान';
    case 'Education':
      return t('catEducation', lang) || 'शिक्षा व फीस';
    case 'Shopping':
      return t('catShopping', lang) || 'खरीदारी';
    case 'Entertainment':
      return t('catEntertainment', lang) || 'मनोरंजन';
    case 'Household':
      return t('catHousehold', lang) || 'घरेलू सामान';
    case 'Others':
      return t('catOthers', lang) || 'अन्य';
    default:
      return t(categoryId, lang);
  }
}

export function getCategoryLabel(categoryId: string, lang: Language | string = 'en'): string {
  return translateCategoryLabel(categoryId, lang);
}
