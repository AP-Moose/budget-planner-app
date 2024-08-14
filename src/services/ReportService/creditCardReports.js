import { categorizeTransactions } from '../../utils/reportUtils';

// Helper function to safely format numbers
const formatNumber = (num) => {
  return (parseFloat(num) || 0).toFixed(2);
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
      const cardPurchases = categorizedTransactions.creditCardPurchases.filter(t => 
        t.creditCardId === card.id &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );
      const cardPayments = categorizedTransactions.creditCardPayments.filter(t => 
        t.creditCardId === card.id &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );
      const cardIncome = categorizedTransactions.creditCardIncome.filter(t => 
        t.creditCardId === card.id &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );

      const purchases = cardPurchases.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const payments = cardPayments.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const income = cardIncome.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const openingBalance = calculateOpeningBalance(card, transactions, startDate);
      const closingBalance = openingBalance + purchases - payments - income;

      creditCardStatement[card.name] = {
        openingBalance: formatNumber(openingBalance),
        purchases: formatNumber(purchases),
        payments: formatNumber(payments),
        income: formatNumber(income),
        closingBalance: formatNumber(closingBalance),
        transactions: cardTransactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: formatNumber(t.amount),
          type: t.type
        }))
      };
    });

    return creditCardStatement;
  } catch (error) {
    console.error('Error in generateCreditCardStatement:', error);
    throw error;
  }
};

const calculateOpeningBalance = (card, transactions, statementStartDate) => {
  const previousTransactions = transactions.filter(t => 
    t.creditCardId === card.id &&
    new Date(t.date) < statementStartDate
  );

  const previousPurchases = previousTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const previousPayments = previousTransactions
    .filter(t => t.type === 'income' && t.isCardPayment)
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const previousIncome = previousTransactions
    .filter(t => t.type === 'income' && !t.isCardPayment)
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const startingBalance = parseFloat(card.startingBalance) || 0;
  const cardStartDate = new Date(card.startDate);
  
  if (cardStartDate > statementStartDate) {
    return startingBalance;
  }

  return startingBalance + previousPurchases - previousPayments - previousIncome;
};

export default {
  generateCreditCardStatement
};