import { getCreditCards, getTransactions } from '../FirebaseService';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

export const generateCreditUtilizationReport = async () => {
  console.log('Generating credit utilization report');
  try {
    const creditCards = await getCreditCards(); // Fetch credit cards from the database
    const transactions = await getTransactions(); // Fetch transactions from the database
    const report = {};

    for (const card of creditCards) {
      const currentBalance = calculateCreditCardBalance(card, transactions); // Calculate balance
      const limit = card.limit > 0 ? card.limit : 1; // Prevent division by zero
      let utilization = 0; // Default utilization

      if (currentBalance >= 0) {
        utilization = (currentBalance / limit) * 100; // Calculate utilization as a percentage
      }

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



