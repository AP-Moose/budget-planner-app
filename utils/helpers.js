export const calculateTotalIncome = (transactions) => {
    return transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  };
  
  export const calculateTotalExpenses = (transactions) => {
    return transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };
  
  export const calculateRemainingBalance = (transactions) => {
    return transactions.reduce((balance, t) => balance + t.amount, 0);
  };
  