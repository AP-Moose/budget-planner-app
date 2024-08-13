import { getCategoryType } from '../../utils/categories';

export const generateMonthlySummary = (transactions) => {
  console.log('Generating monthly summary');
  try {
    const income = transactions
      .filter(t => getCategoryType(t.category) === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expenses = transactions
      .filter(t => getCategoryType(t.category) === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
    };
  } catch (error) {
    console.error('Error in generateMonthlySummary:', error);
    throw error;
  }
};

export const generateCustomRangeReport = (transactions) => {
  console.log('Generating custom range report');
  try {
    const summary = generateMonthlySummary(transactions);
    const expenseBreakdown = generateCategoryBreakdown(transactions);
    const topExpenses = Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    return {
      ...summary,
      topExpenses
    };
  } catch (error) {
    console.error('Error in generateCustomRangeReport:', error);
    throw error;
  }
};