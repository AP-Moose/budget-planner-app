import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateCashFlowStatement = (transactions) => {
  console.log('Generating cash flow statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    return {
      cashInflow: totals.totalRegularIncome + totals.totalCreditCardIncome,
      cashOutflow: totals.totalRegularExpenses,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments,
      netCashFlow: totals.totalRegularIncome + totals.totalCreditCardIncome - totals.totalRegularExpenses - totals.totalCreditCardPayments
    };
  } catch (error) {
    console.error('Error in generateCashFlowStatement:', error);
    throw error;
  }
};