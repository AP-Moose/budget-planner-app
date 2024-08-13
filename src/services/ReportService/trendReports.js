import { getCategoryType } from '../../utils/categories';

export const generateExpenseTrendAnalysis = (transactions) => {
  console.log('Generating expense trend analysis');
  try {
    const monthlyExpenses = {};
    transactions.forEach(t => {
      if (getCategoryType(t.category) === 'expense') {
        const month = new Date(t.date).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthlyExpenses[month] = (monthlyExpenses[month] || 0) + (parseFloat(t.amount) || 0);
      }
    });
    return Object.entries(monthlyExpenses).map(([month, totalExpense]) => ({ month, totalExpense }));
  } catch (error) {
    console.error('Error in generateExpenseTrendAnalysis:', error);
    throw error;
  }
};