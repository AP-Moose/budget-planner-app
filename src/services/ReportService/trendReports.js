import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateExpenseTrendAnalysis = (transactions, startDate, endDate) => {
  console.log('Generating expense trend analysis');
  try {
    // Convert string dates to Date objects for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Filter transactions to include only those within the specified date range
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });

    const monthlyExpenses = {};

    filteredTransactions.forEach(t => {
      const month = new Date(t.date).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyExpenses[month]) {
        monthlyExpenses[month] = {
          regularExpenses: 0,
          creditCardPurchases: 0
        };
      }

      if (t.type === 'expense') {
        if (t.creditCard && !t.isCardPayment) {
          monthlyExpenses[month].creditCardPurchases += Number(t.amount);
        } else if (!t.creditCard) {
          monthlyExpenses[month].regularExpenses += Number(t.amount);
        }
      }
    });

    // Ensure that all months in the range are included, even if there are no transactions
    let current = new Date(start);
    while (current <= end) {
      const month = current.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyExpenses[month]) {
        monthlyExpenses[month] = { regularExpenses: 0, creditCardPurchases: 0 };
      }
      current.setMonth(current.getMonth() + 1);
    }

    return Object.entries(monthlyExpenses).map(([month, expenses]) => ({
      month,
      totalExpense: expenses.regularExpenses + expenses.creditCardPurchases,
      regularExpenses: expenses.regularExpenses,
      creditCardPurchases: expenses.creditCardPurchases
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  } catch (error) {
    console.error('Error in generateExpenseTrendAnalysis:', error);
    throw error;
  }
};

