import { categorizeTransactions, calculateTotals, calculateNetSavings, calculateSavingsRate } from '../../utils/reportUtils';
import { EXPENSE_CATEGORIES } from '../../utils/categories';

export const generateMonthlySummary = (transactions) => {
  console.log('Generating monthly summary');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);
    const netSavings = calculateNetSavings(totals);
    const savingsRate = calculateSavingsRate(totals);

    return {
      totalIncome: totals.totalRegularIncome + totals.totalCreditCardIncome,
      totalExpenses: totals.totalRegularExpenses + totals.totalCreditCardPurchases,
      netSavings: netSavings,
      savingsRate: savingsRate,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments
    };
  } catch (error) {
    console.error('Error in generateMonthlySummary:', error);
    throw error;
  }
};

export const generateCustomRangeReport = (transactions) => {
  console.log('Generating custom range report');
  try {
    const summary = generateMonthlySummary(transactions);
    const categorizedTransactions = categorizeTransactions(transactions);
    
    const expenseBreakdown = {};
    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      expenseBreakdown[category] = regularExpenses + creditCardExpenses;
    });

    const topExpenses = Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    return {
      ...summary,
      topExpenses
    };
  } catch (error) {
    console.error('Error in generateCustomRangeReport:', error);
    throw error;
  }
};