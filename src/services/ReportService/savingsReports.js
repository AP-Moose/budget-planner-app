import { categorizeTransactions, calculateTotals, calculateNetSavings, calculateSavingsRate } from '../../utils/reportUtils';

export const generateSavingsRateReport = (transactions) => {
  console.log('Generating savings rate report');
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
    console.error('Error in generateSavingsRateReport:', error);
    throw error;
  }
};