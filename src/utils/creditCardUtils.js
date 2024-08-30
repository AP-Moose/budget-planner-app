export const calculateCreditCardBalance = (card, transactions) => {
  let balance = Number(card.startingBalance);
  const startDate = new Date(card.startDate);

  const relevantTransactions = transactions.filter(t => 
    t.creditCardId === card.id &&
    new Date(t.date) >= startDate
  );

  relevantTransactions.forEach(t => {
    if (t.type === 'expense' && !t.isCardPayment) {
      balance += Number(t.amount);
    } else if (t.isCardPayment || t.type === 'income') {
      balance -= Number(t.amount);
    }
  });

  return balance;
};