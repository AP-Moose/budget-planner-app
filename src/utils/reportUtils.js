// reportUtils.js

export const categorizeTransactions = (transactions) => {
  return {
    regularIncome: transactions.filter(t => t.type === 'income' && !t.creditCard && !t.isCashback),
    regularExpenses: transactions.filter(t => t.type === 'expense' && !t.creditCard && !t.isLoanPayment),
    creditCardPurchases: transactions.filter(t => t.type === 'expense' && t.creditCard && !t.isCardPayment),
    creditCardPayments: transactions.filter(t => t.type === 'expense' && t.creditCard && t.isCardPayment),
    creditCardIncome: transactions.filter(t => t.type === 'income' && t.creditCard),
    loanPayments: transactions.filter(t => t.isLoanPayment),
    cashbackRewards: transactions.filter(t => t.isCashback),
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
    totalLoanPayments: sumAmount(categorizedTransactions.loanPayments),
    totalCashbackRewards: sumAmount(categorizedTransactions.cashbackRewards),
     // New Debt Payment calculation
    totalDebtPayments: sumAmount(categorizedTransactions.creditCardPayments) + sumAmount(categorizedTransactions.loanPayments),
  };
};
