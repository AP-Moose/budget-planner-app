export const calculateTotalAssets = (cashBalance, investments) => {
    const investmentTotal = Object.values(investments).reduce((sum, value) => sum + value, 0);
    return cashBalance + investmentTotal;
  };
  
  export const calculateTotalLiabilities = (creditCardBalances, loans) => {
    const creditCardTotal = Object.values(creditCardBalances).reduce((sum, balance) => sum + balance, 0);
    const loanTotal = Object.values(loans).reduce((sum, balance) => sum + balance, 0);
    return creditCardTotal + loanTotal;
  };
  
  export const calculateNetWorth = (totalAssets, totalLiabilities) => {
    return totalAssets - totalLiabilities;
  };
  
  export const calculateCreditUtilization = (creditCardBalances, creditCards) => {
    let totalBalance = 0;
    let totalLimit = 0;
  
    creditCards.forEach(card => {
      totalBalance += creditCardBalances[card.id] || 0;
      totalLimit += card.limit;
    });
  
    return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  };