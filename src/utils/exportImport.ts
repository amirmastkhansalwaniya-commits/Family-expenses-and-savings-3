export const parseExpensesCSV = (csvText: string): { validExpenses: Omit<Expense, 'id'>[]; errors: string[] } => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { validExpenses: [], errors: ['CSV file appears empty or missing header row.'] };
  }

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

    const cleanAmountStr = rawAmount.replace(/[^0-9.]/g, '');
    let amount = parseFloat(cleanAmountStr);
    
    if (isNaN(amount)) {
      amount = 0; 
    }

    const matchedMember = FAMILY_MEMBERS.find(
      m => m.toLowerCase() === rawPaidBy.toLowerCase() || rawPaidBy.toLowerCase().includes(m.toLowerCase())
    ) || FAMILY_MEMBERS[0];

    const matchedCategory = (CATEGORIES.find(
      c => c.id.toLowerCase() === rawCategory.toLowerCase() || c.label.toLowerCase().includes(rawCategory.toLowerCase())
    )?.id || 'Others') as CategoryId;

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
      notes: rawNotes.trim() || 'Imported entry',
      createdAt: new Date().toISOString()
    });
  }

  return { validExpenses, errors };
};
