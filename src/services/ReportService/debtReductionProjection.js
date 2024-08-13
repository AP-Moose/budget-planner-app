import { getCreditCards } from '../FirebaseService';

export const generateDebtReductionProjection = async (transactions) => {
  console.log('Generating debt reduction projection');
  try {
    const creditCards = await getCreditCards();
    const report = {};

    for (const card of creditCards) {
      const cardTransactions = transactions.filter(t => t.creditCardId === card.id);
      const averageMonthlyPayment = cardTransactions
        .filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0) / (transactions.length > 0 ? transactions.length : 1);
      
      const averageMonthlySpending = cardTransactions
        .filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0) / (transactions.length > 0 ? transactions.length : 1);

      const netMonthlyPayment = averageMonthlyPayment - averageMonthlySpending;
      const monthsToPayOff = netMonthlyPayment > 0 ? Math.ceil(card.balance / netMonthlyPayment) : Infinity;

      report[card.name] = {
        currentBalance: card.balance,
        averageMonthlyPayment,
        averageMonthlySpending,
        netMonthlyPayment,
        monthsToPayOff: monthsToPayOff === Infinity ? 'N/A' : monthsToPayOff,
        projectedPayoffDate: monthsToPayOff === Infinity ? 'N/A' : new Date(Date.now() + monthsToPayOff * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
    }

    return report;
  } catch (error) {
    console.error('Error in generateDebtReductionProjection:', error);
    throw error;
  }
};