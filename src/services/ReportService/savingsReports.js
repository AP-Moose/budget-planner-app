import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateSavingsRateReport = (transactions, startDate, endDate) => {
  console.log('Generating savings rate report');

  try {
    // Set default date range to the first and last day of the current month if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    console.log('Using date range:', start, end);

    // Filter transactions by the date range
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });

    // Categorize the filtered transactions
    const categorizedTransactions = categorizeTransactions(filteredTransactions);
    const totals = calculateTotals(categorizedTransactions);

    const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const totalExpenses = totals.totalRegularExpenses +totals.totalCreditCardPurchases;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Calculate the number of months in the date range
    const monthsInRange = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

    const monthlyAverageSavings = monthsInRange > 0 ? netSavings / monthsInRange : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      monthlyAverageSavings,  // Include the calculated monthly average savings
    };
  } catch (error) {
    console.error('Error in generateSavingsRateReport:', error);
    throw error;
  }
};
