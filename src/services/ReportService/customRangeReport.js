import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

const filterTransactionsByDate = (transactions, startDate, endDate) => {
  return transactions.filter(t => 
    new Date(t.date) >= startDate && new Date(t.date) <= endDate
  );
};

export const generateCustomRangeReport = (transactions, startDate, endDate) => {
  console.log('Generating custom range report');
  try {
    const filteredTransactions = filterTransactionsByDate(transactions, startDate, endDate);
    const categorizedTransactions = categorizeTransactions(filteredTransactions);
    const totals = calculateTotals(categorizedTransactions);

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

    const topExpenses = Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const topExpenseCategory = topExpenses.length > 0 ? topExpenses[0].category : 'N/A';
    const topIncomeSource = Object.entries(incomeBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    
    return {
      totalIncome: totals.totalRegularIncome + totals.totalCreditCardIncome,
      totalExpenses: totals.totalRegularExpenses + totals.totalCreditCardPurchases,
      netSavings: totals.totalRegularIncome - totals.totalRegularExpenses,
      savingsRate: totals.totalRegularIncome > 0 ? (totals.totalRegularIncome - totals.totalRegularExpenses) / totals.totalRegularIncome * 100 : 0,
      topExpenses,
      topExpenseCategory,
      topIncomeSource
    };
  } catch (error) {
    console.error('Error in generateCustomRangeReport:', error);
    throw error;
  }
};
