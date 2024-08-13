import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateExpenseTrendAnalysis = (transactions) => {
  console.log('Generating expense trend analysis');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const monthlyExpenses = {};

    transactions.forEach(t => {
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