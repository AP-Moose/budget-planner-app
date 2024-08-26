export const calculateTotalAssets = (cashBalance, investments, otherAssets) => {
  const investmentTotal = Object.values(investments).reduce((sum, value) => sum + value, 0);
  const otherAssetsTotal = Object.values(otherAssets).reduce((sum, value) => sum + value, 0);
  return cashBalance + investmentTotal + otherAssetsTotal;
};

export const calculateTotalLiabilities = (creditCardBalances, loans, otherLiabilities) => {
  const creditCardTotal = Object.values(creditCardBalances).reduce((sum, balance) => sum + balance, 0);
  const loanTotal = Object.values(loans).reduce((sum, balance) => sum + balance, 0);
  const otherLiabilitiesTotal = Object.values(otherLiabilities).reduce((sum, balance) => sum + balance, 0);
  return creditCardTotal + loanTotal + otherLiabilitiesTotal;
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

export const calculateDebtToIncomeRatio = (totalMonthlyDebtPayments, monthlyIncome) => {
  return monthlyIncome > 0 ? (totalMonthlyDebtPayments / monthlyIncome) * 100 : 0;
};

export const calculateLiquidityRatio = (cashAndCashEquivalents, currentLiabilities) => {
  return currentLiabilities > 0 ? cashAndCashEquivalents / currentLiabilities : 0;
};