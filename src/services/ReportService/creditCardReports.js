import { categorizeTransactions } from '../../utils/reportUtils';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

export const generateCreditCardStatement = (transactions, creditCards, startDate, endDate) => {
  console.log('Generating credit card statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const creditCardStatement = {};

    creditCards.forEach(card => {
      const openingBalance = calculateCreditCardBalance(card, transactions.filter(t => new Date(t.date) < startDate));
      const closingBalance = calculateCreditCardBalance(card, transactions.filter(t => new Date(t.date) <= endDate));

      const cardTransactions = transactions.filter(t => 
        t.creditCardId === card.id &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );

      const purchases = cardTransactions.filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const payments = cardTransactions.filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const income = cardTransactions.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      creditCardStatement[card.name] = {
        openingBalance: openingBalance.toFixed(2),
        purchases: purchases.toFixed(2),
        payments: payments.toFixed(2),
        income: income.toFixed(2),
        closingBalance: closingBalance.toFixed(2),
        transactions: cardTransactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount.toFixed(2),
          type: t.type,
          isCardPayment: t.isCardPayment
        }))
      };
    });

    return creditCardStatement;
  } catch (error) {
    console.error('Error in generateCreditCardStatement:', error);
    throw error;
  }
};

export default {
  generateCreditCardStatement
};