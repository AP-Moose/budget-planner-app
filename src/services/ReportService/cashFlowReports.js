import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateCashFlowStatement = (transactions, startDate, endDate) => {
  console.log('Generating cash flow statement');

  try {
    // Convert start and end dates to UTC time
    const startUTC = new Date(startDate).setHours(0, 0, 0, 0);  // Start of day in UTC
    const endUTC = new Date(endDate).setHours(23, 59, 59, 999);  // End of day in UTC


    // Filter transactions within the date range
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date).getTime();
      return transactionDate >= startUTC && transactionDate <= endUTC;
    });

    console.log('Filtered Transactions:', filteredTransactions);

    // Categorize the filtered transactions
    const categorizedTransactions = categorizeTransactions(filteredTransactions);
    const totals = calculateTotals(categorizedTransactions);

    // Calculate total cash inflow and outflow
    const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const totalExpenses = totals.totalRegularExpenses + totals.totalCreditCardPurchases;
    const totalCashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments + totals.totalLoanPayments;

    // Calculate net cash flow
    const netCashFlow = totalIncome - totalCashOutflow;

    // Return the calculated values
    return {
      cashInflow: totalIncome,
      cashOutflow: totalCashOutflow,
      netCashFlow,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments,
      loanPayments: totals.totalLoanPayments,
      details: {
        regularIncome: totals.totalRegularIncome,
        creditCardIncome: totals.totalCreditCardIncome,
        regularExpenses: totals.totalRegularExpenses,
        creditCardPurchases: totals.totalCreditCardPurchases,
        creditCardPayments: totals.totalCreditCardPayments,
        loanPayments: totals.totalLoanPayments,
      },
    };
  } catch (error) {
    console.error('Error in generateCashFlowStatement:', error);
    throw error;
  }
};
