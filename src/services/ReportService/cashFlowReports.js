import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateCashFlowStatement = (transactions, startDate, endDate) => {
  console.log('Generating cash flow statement');
  try {
    const startUTC = new Date(startDate).getTime(); // Convert to UTC
    const endUTC = new Date(endDate).getTime(); // Convert to UTC

    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date).getTime(); // Convert to UTC
      return transactionDate >= startUTC && transactionDate <= endUTC;
    });

    console.log('Filtered Transactions:', filteredTransactions);

    const categorizedTransactions = categorizeTransactions(filteredTransactions);
    const totals = calculateTotals(categorizedTransactions);

    const cashInflow = totals.totalRegularIncome + totals.totalCreditCardIncome + totals.totalCashbackRewards;
    const cashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments + totals.totalLoanPayments;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      cashInflow,
      cashOutflow,
      netCashFlow,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments,
      loanPayments: totals.totalLoanPayments,
      cashbackRewards: totals.totalCashbackRewards,
      details: {
        regularIncome: totals.totalRegularIncome,
        creditCardIncome: totals.totalCreditCardIncome,
        cashbackRewards: totals.totalCashbackRewards,
        regularExpenses: totals.totalRegularExpenses,
        creditCardPurchases: totals.totalCreditCardPurchases,
        creditCardPayments: totals.totalCreditCardPayments,
        loanPayments: totals.totalLoanPayments
      }
    };
  } catch (error) {
    console.error('Error in generateCashFlowStatement:', error);
    throw error;
  }
};

export const generateDetailedCashFlowStatement = (transactions, startDate, endDate) => {
  console.log('Generating detailed cash flow statement');
  try {
    const startUTC = new Date(startDate).getTime(); // Convert to UTC
    const endUTC = new Date(endDate).getTime(); // Convert to UTC

    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date).getTime(); // Convert to UTC
      return transactionDate >= startUTC && transactionDate <= endUTC;
    });

    console.log('Filtered Transactions:', filteredTransactions);

    const categorizedTransactions = categorizeTransactions(filteredTransactions);
    const totals = calculateTotals(categorizedTransactions);

    const cashInflow = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const cashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      cashInflow: {
        total: cashInflow,
        regularIncome: totals.totalRegularIncome,
        creditCardIncome: totals.totalCreditCardIncome,
        cashbackRewards: totals.totalCashbackRewards || 0 // Ensure cashback rewards are included
      },
      cashOutflow: {
        total: cashOutflow,
        regularExpenses: totals.totalRegularExpenses,
        creditCardPayments: totals.totalCreditCardPayments
      },
      netCashFlow,
      creditCardActivity: {
        purchases: totals.totalCreditCardPurchases || 0,
        payments: totals.totalCreditCardPayments || 0
      },
      nonCashExpenses: totals.totalNonCashExpenses || 0, // Ensure this is defined
      netIncomeEffect: cashInflow - (totals.totalRegularExpenses + (totals.totalCreditCardPurchases || 0))
    };
  } catch (error) {
    console.error('Error in generateDetailedCashFlowStatement:', error);
    throw error;
  }
};
