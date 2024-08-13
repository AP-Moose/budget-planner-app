import { categorizeTransactions } from '../../utils/reportUtils';

export const generateCreditCardStatement = (transactions, creditCards, startDate, endDate) => {
  console.log('Generating credit card statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const creditCardStatement = {};

    creditCards.forEach(card => {
      const cardTransactions = transactions.filter(t => t.creditCardId === card.id);
      const cardPurchases = categorizedTransactions.creditCardPurchases.filter(t => t.creditCardId === card.id);
      const cardPayments = categorizedTransactions.creditCardPayments.filter(t => t.creditCardId === card.id);
      const cardIncome = categorizedTransactions.creditCardIncome.filter(t => t.creditCardId === card.id);

      const purchases = cardPurchases.reduce((sum, t) => sum + Number(t.amount), 0);
      const payments = cardPayments.reduce((sum, t) => sum + Number(t.amount), 0);
      const income = cardIncome.reduce((sum, t) => sum + Number(t.amount), 0);

      creditCardStatement[card.name] = {
        openingBalance: card.balance, // Assuming the current balance is the opening balance
        purchases: purchases,
        payments: payments,
        income: income,
        closingBalance: card.balance + purchases - payments - income,
        transactions: cardTransactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: Number(t.amount),
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