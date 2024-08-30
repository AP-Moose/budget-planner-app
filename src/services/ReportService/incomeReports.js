import { INCOME_CATEGORIES } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';

export const generateIncomeSourcesAnalysis = (transactions, startDate, endDate) => {
  console.log('Generating income sources analysis');

  // Adjust start and end dates to cover the full day in UTC
  const adjustedStartDate = new Date(startDate);
  adjustedStartDate.setUTCHours(0, 0, 0, 0);

  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setUTCHours(23, 59, 59, 999);

  console.log('Adjusted Start Date:', adjustedStartDate.toISOString());
  console.log('Adjusted End Date:', adjustedEndDate.toISOString());

  // Filter transactions within the date range
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date); // Ensure it's treated as a Date object
    console.log('Transaction Date (Local):', transactionDate.toString());
    console.log('Transaction Date (UTC):', transactionDate.toISOString());

    // Check if the transaction date is within the range
    return transactionDate >= adjustedStartDate && transactionDate <= adjustedEndDate;
  });

  // Debugging: Log filtered transactions
  console.log('Filtered Transactions:', filteredTransactions);

  // Categorize filtered transactions
  const categorizedTransactions = categorizeTransactions(filteredTransactions);
  const incomeSources = {};

  INCOME_CATEGORIES.forEach(category => {
    const regularIncome = categorizedTransactions.regularIncome
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const creditCardIncome = categorizedTransactions.creditCardIncome
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    incomeSources[category] = regularIncome + creditCardIncome;
  });

  console.log('Generated report:', incomeSources);

  return incomeSources;
};
