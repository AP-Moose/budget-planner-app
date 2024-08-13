export const categorizeTransactions = (transactions) => {
    return {
      regularIncome: transactions.filter(t => t.type === 'income' && !t.creditCard),
      regularExpenses: transactions.filter(t => t.type === 'expense' && !t.creditCard),
      creditCardPurchases: transactions.filter(t => t.type === 'expense' && t.creditCard && !t.isCardPayment),
      creditCardPayments: transactions.filter(t => t.type === 'expense' && t.creditCard && t.isCardPayment),
      creditCardIncome: transactions.filter(t => t.type === 'income' && t.creditCard),
    };
  };
  
  export const calculateTotals = (categorizedTransactions) => {
    const sumAmount = (transactions) => transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  
    return {
      totalRegularIncome: sumAmount(categorizedTransactions.regularIncome),
      totalRegularExpenses: sumAmount(categorizedTransactions.regularExpenses),
      totalCreditCardPurchases: sumAmount(categorizedTransactions.creditCardPurchases),
      totalCreditCardPayments: sumAmount(categorizedTransactions.creditCardPayments),
      totalCreditCardIncome: sumAmount(categorizedTransactions.creditCardIncome),
    };
  };