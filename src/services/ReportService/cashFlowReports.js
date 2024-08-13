import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateCashFlowStatement = (transactions) => {
  console.log('Generating cash flow statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    const cashInflow = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const cashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      cashInflow,
      cashOutflow,
      netCashFlow,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments,
      details: {
        regularIncome: totals.totalRegularIncome,
        creditCardIncome: totals.totalCreditCardIncome,
        regularExpenses: totals.totalRegularExpenses,
        creditCardPurchases: totals.totalCreditCardPurchases,
        creditCardPayments: totals.totalCreditCardPayments
      }
    };
  } catch (error) {
    console.error('Error in generateCashFlowStatement:', error);
    throw error;
  }
};

export const generateDetailedCashFlowStatement = (transactions) => {
  console.log('Generating detailed cash flow statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    const cashInflow = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const cashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      cashInflow: {
        total: cashInflow,
        regularIncome: totals.totalRegularIncome,
        creditCardIncome: totals.totalCreditCardIncome
      },
      cashOutflow: {
        total: cashOutflow,
        regularExpenses: totals.totalRegularExpenses,
        creditCardPayments: totals.totalCreditCardPayments
      },
      netCashFlow,
      creditCardActivity: {
        purchases: totals.totalCreditCardPurchases,
        payments: totals.totalCreditCardPayments
      },
      nonCashExpenses: totals.totalCreditCardPurchases,
      netIncomeEffect: cashInflow - (totals.totalRegularExpenses + totals.totalCreditCardPurchases)
    };
  } catch (error) {
    console.error('Error in generateDetailedCashFlowStatement:', error);
    throw error;
  }
};