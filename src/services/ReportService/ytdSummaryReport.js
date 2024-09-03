import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import { filterTransactionsByDate } from '../../utils/filterUtils.js'; 

export const generateYTDSummary = (transactions, startDate, endDate) => {
  console.log('Generating YTD summary');
  try {
    const filteredTransactions = filterTransactionsByDate(transactions, startDate, endDate);
    const summary = generateMonthlySummary(filteredTransactions, startDate, endDate);
    const categorizedTransactions = categorizeTransactions(filteredTransactions);

    const expenseBreakdown = {};
    const incomeBreakdown = {};

    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      expenseBreakdown[category] = regularExpenses + creditCardExpenses;
    });

    INCOME_CATEGORIES.forEach(category => {
      const regularIncome = categorizedTransactions.regularIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardIncome = categorizedTransactions.creditCardIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      incomeBreakdown[category] = regularIncome + creditCardIncome;
    });

    const topExpenseCategory = Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)[0][0];

    const topIncomeSource = Object.entries(incomeBreakdown)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      ...summary,
      topExpenseCategory,
      topIncomeSource
    };
  } catch (error) {
    console.error('Error in generateYTDSummary:', error);
    throw error;
  }
};
