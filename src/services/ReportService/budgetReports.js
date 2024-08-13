import { EXPENSE_CATEGORIES } from '../../utils/categories';
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateBudgetVsActual = (transactions, budgetGoals) => {
  console.log('Generating budget vs actual');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    return EXPENSE_CATEGORIES.map(category => {
      const budgetGoal = budgetGoals.find(goal => goal.category === category);
      const actual = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardActual = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalActual = actual + creditCardActual;

      return {
        category,
        budgeted: budgetGoal ? Number(budgetGoal.amount) : 0,
        actual: totalActual,
        difference: (budgetGoal ? Number(budgetGoal.amount) : 0) - totalActual
      };
    });
  } catch (error) {
    console.error('Error in generateBudgetVsActual:', error);
    throw error;
  }
};