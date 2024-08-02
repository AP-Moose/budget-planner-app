export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance/Contract Work',
  'Investments',
  'Gifts',
  'Other Income'
];

export const EXPENSE_CATEGORIES = [
  'Housing (Rent/Mortgage)',
  'Utilities',
  'Groceries',
  'Transportation',
  'Healthcare',
  'Insurance',
  'Dining Out/Takeaway',
  'Entertainment',
  'Shopping',
  'Education',
  'Debt Payments',
  'Savings/Investments',
  'Miscellaneous/Other'
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryType(category) {
  return INCOME_CATEGORIES.includes(category) ? 'income' : 'expense';
}

export function getCategoryName(category) {
  return ALL_CATEGORIES.find(cat => cat === category) || 'Unknown Category';
}