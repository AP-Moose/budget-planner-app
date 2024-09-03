import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

const filterTransactionsByDate = (transactions, startDate, endDate) => {
  return transactions.filter(t => 
    new Date(t.date) >= startDate && new Date(t.date) <= endDate
  );
};

export const generateMonthlySummary = (transactions, startDate, endDate) => {
  console.log('Generating monthly summary');

  try {
    // Ensure that startDate and endDate are defined
    if (!startDate || !endDate) {
      throw new Error('startDate or endDate is undefined');
    }

    // Normalize the startDate and endDate to the beginning and end of the day
    const normalizedStartDate = new Date(startDate);
    const normalizedEndDate = new Date(endDate);

    normalizedStartDate.setHours(0, 0, 0, 0);
    normalizedEndDate.setHours(23, 59, 59, 999);

    // Filter transactions based on the normalized startDate and endDate
    const filteredTransactions = filterTransactionsByDate(transactions, normalizedStartDate, normalizedEndDate);

    console.log(`Filtered Transactions: ${JSON.stringify(filteredTransactions, null, 2)}`);

    const categorizedTransactions = categorizeTransactions(filteredTransactions);
    const totals = calculateTotals(categorizedTransactions);

    const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const totalExpenses = totals.totalRegularExpenses + totals.totalCreditCardPurchases;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments,
    };
  } catch (error) {
    console.error('Error in generateMonthlySummary:', error);
    throw error;
  }
};
