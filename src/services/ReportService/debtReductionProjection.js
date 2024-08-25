import { getCreditCards } from '../FirebaseService';

const calculateMonthsBetweenDates = (date1, date2) => {
  return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
};

export const generateDebtReductionProjection = async (transactions) => {
  console.log('Generating debt reduction projection');
  try {
    const creditCards = await getCreditCards();
    const report = {};
    const currentDate = new Date();

    for (const card of creditCards) {
      const cardStartDate = new Date(card.startDate);
      const cardTransactions = transactions.filter(t => 
        t.creditCardId === card.id && new Date(t.date) >= cardStartDate
      );
      
      const monthsCovered = calculateMonthsBetweenDates(cardStartDate, currentDate);

      const totalPayments = cardTransactions
        .filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalSpending = cardTransactions
        .filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const averageMonthlyPayment = monthsCovered > 0 ? totalPayments / monthsCovered : 0;
      const averageMonthlySpending = monthsCovered > 0 ? totalSpending / monthsCovered : 0;

      const netMonthlyPayment = averageMonthlyPayment - averageMonthlySpending;
      const monthsToPayOff = netMonthlyPayment > 0 ? Math.ceil(card.balance / netMonthlyPayment) : Infinity;

      report[card.name] = {
        currentBalance: card.balance,
        startDate: card.startDate,
        averageMonthlyPayment: averageMonthlyPayment.toFixed(2),
        averageMonthlySpending: averageMonthlySpending.toFixed(2),
        netMonthlyPayment: netMonthlyPayment.toFixed(2),
        monthsToPayOff: monthsToPayOff === Infinity ? 'N/A' : monthsToPayOff,
        projectedPayoffDate: monthsToPayOff === Infinity ? 'N/A' : new Date(currentDate.getTime() + monthsToPayOff * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
    }

    return report;
  } catch (error) {
    console.error('Error in generateDebtReductionProjection:', error);
    throw error;
  }
};