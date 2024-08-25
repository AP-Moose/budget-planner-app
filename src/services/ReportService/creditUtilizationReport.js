import { getCreditCards } from '../FirebaseService';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

export const generateCreditUtilizationReport = async (transactions) => {
  console.log('Generating credit utilization report');
  try {
    const creditCards = await getCreditCards();
    const report = {};

    for (const card of creditCards) {
      const currentBalance = calculateCreditCardBalance(card, transactions);
      const utilization = (currentBalance / card.limit) * 100;

      report[card.name] = {
        limit: card.limit,
        currentBalance: currentBalance.toFixed(2),
        availableCredit: (card.limit - currentBalance).toFixed(2),
        utilization: utilization.toFixed(2)
      };
    }

    return report;
  } catch (error) {
    console.error('Error in generateCreditUtilizationReport:', error);
    throw error;
  }
};