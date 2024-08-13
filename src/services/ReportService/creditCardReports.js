import { getCategoryType } from '../../utils/categories';

export const generateCreditCardStatement = (transactions, creditCards, startDate, endDate) => {
  console.log('Generating credit card statement');
  try {
    const creditCardStatement = {};

    creditCards.forEach(card => {
      const cardTransactions = transactions.filter(t => t.creditCardId === card.id);
      const openingBalance = card.balance; // Assuming the current balance is the opening balance
      const purchases = cardTransactions
        .filter(t => getCategoryType(t.category) === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const payments = cardTransactions
        .filter(t => t.category === 'Debt Payment')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const closingBalance = openingBalance + purchases - payments;

      creditCardStatement[card.name] = {
        openingBalance,
        purchases,
        payments,
        closingBalance,
        transactions: cardTransactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: parseFloat(t.amount) || 0,
          type: getCategoryType(t.category)
        }))
      };
    });

    return creditCardStatement;
  } catch (error) {
    console.error('Error in generateCreditCardStatement:', error);
    throw error;
  }
};