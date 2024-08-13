import { EXPENSE_CATEGORIES } from '../../utils/categories';
import { generateCategoryBreakdown } from './categoryReports';

export const generateBudgetVsActual = (transactions, budgetGoals) => {
  console.log('Generating budget vs actual');
  try {
    const actual = generateCategoryBreakdown(transactions);
    return EXPENSE_CATEGORIES.map(category => {
      const budgetGoal = budgetGoals.find(goal => goal.category === category);
      return {
        category,
        budgeted: budgetGoal ? parseFloat(budgetGoal.amount) || 0 : 0,
        actual: parseFloat(actual[category]) || 0,
        difference: (budgetGoal ? parseFloat(budgetGoal.amount) : 0) - (parseFloat(actual[category]) || 0)
      };
    });
  } catch (error) {
    console.error('Error in generateBudgetVsActual:', error);
    throw error;
  }
};