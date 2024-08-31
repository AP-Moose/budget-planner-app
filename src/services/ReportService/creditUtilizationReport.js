import { getCreditCards, getTransactions } from '../FirebaseService';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

export const generateCreditUtilizationReport = async (startDate, endDate) => {
  console.log('Generating credit utilization report');
  try {
    const creditCards = await getCreditCards(); // Fetch credit cards from the database
    const transactions = await getTransactions(); // Fetch transactions from the database

    // Adjust start and end dates to cover the full day in UTC
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setUTCHours(0, 0, 0, 0);

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setUTCHours(23, 59, 59, 999);

    console.log('Adjusted Start Date:', adjustedStartDate.toISOString());
    console.log('Adjusted End Date:', adjustedEndDate.toISOString());

    // Check if dates are valid
    if (isNaN(adjustedStartDate.getTime()) || isNaN(adjustedEndDate.getTime())) {
      throw new Error('Invalid start or end date');
    }

    // Filter transactions within the date range
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date); // Ensure it's treated as a Date object
      return transactionDate >= adjustedStartDate && transactionDate <= adjustedEndDate;
    });

    console.log('Filtered Transactions:', filteredTransactions);

    const report = {};

    for (const card of creditCards) {
      const currentBalance = calculateCreditCardBalance(card, filteredTransactions); // Use filtered transactions
      const limit = card.limit > 0 ? card.limit : 1; // Prevent division by zero
      const utilization = currentBalance >= 0 ? (currentBalance / limit) * 100 : 0;

      console.log(`Utilization for card ${card.name}: ${utilization}`);

      report[card.name] = {
        limit: card.limit,
        currentBalance: currentBalance.toFixed(2),
        availableCredit: (limit - currentBalance).toFixed(2),
        utilization: utilization.toFixed(2), // Ensure utilization is formatted as a string
      };
    }

    console.log('Generated report:', JSON.stringify(report, null, 2));
    return report;
  } catch (error) {
    console.error('Error in generateCreditUtilizationReport:', error);
    throw error;
  }
};






