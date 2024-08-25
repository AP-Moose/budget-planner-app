import { categorizeTransactions } from '../../utils/reportUtils';

const calculateOpeningBalance = (card, transactions, statementStartDate) => {
  const cardStartDate = new Date(card.startDate);
  const relevantTransactions = transactions.filter(t => 
    t.creditCardId === card.id &&
    new Date(t.date) >= cardStartDate &&
    new Date(t.date) < statementStartDate
  );

  let balance = Number(card.startingBalance) || 0;
  relevantTransactions.forEach(t => {
    if (t.type === 'expense' && !t.isCardPayment) {
      balance += Number(t.amount);
    } else if (t.isCardPayment || t.type === 'income') {
      balance -= Number(t.amount);
    }
  });

  return balance;
};

export const generateCreditCardStatement = (transactions, creditCards, startDate, endDate) => {
  console.log('Generating credit card statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const creditCardStatement = {};

    creditCards.forEach(card => {
      const cardTransactions = transactions.filter(t => 
        t.creditCardId === card.id &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );

      const openingBalance = calculateOpeningBalance(card, transactions, startDate);
      let closingBalance = openingBalance;

      const purchases = cardTransactions.filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const payments = cardTransactions.filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const income = cardTransactions.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      closingBalance += purchases - payments - income;

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