import { getCreditCards } from '../FirebaseService';

export const generateCreditUtilizationReport = async (transactions) => {
  console.log('Generating credit utilization report');
  try {
    const creditCards = await getCreditCards();
    const report = {};

    for (const card of creditCards) {
      const cardTransactions = transactions.filter(t => t.creditCardId === card.id);
      const purchases = cardTransactions
        .filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const payments = cardTransactions
        .filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const currentBalance = card.balance + purchases - payments;
      const utilization = (currentBalance / card.limit) * 100;

      report[card.name] = {
        limit: card.limit,
        currentBalance,
        availableCredit: card.limit - currentBalance,
        utilization: utilization.toFixed(2)
      };
    }

    return report;
  } catch (error) {
    console.error('Error in generateCreditUtilizationReport:', error);
    throw error;
  }
};