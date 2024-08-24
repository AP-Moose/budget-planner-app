import { EXPENSE_CATEGORIES } from '../../utils/categories';
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';
import { getBudgetGoals } from '../FirebaseService';

export const generateBudgetVsActual = async (transactions, startDate, endDate) => {
  console.log('Generating budget vs actual');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const budgetGoals = await getBudgetGoals(year, month);

    return Promise.all(EXPENSE_CATEGORIES.map(async (category) => {
      const budgetGoal = budgetGoals.find(goal => goal.category === category);
      const budgeted = budgetGoal ? Number(budgetGoal.amount) : 0;

      const actual = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardActual = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalActual = actual + creditCardActual;

      return {
        category,
        budgeted,
        actual: totalActual,
        difference: budgeted - totalActual
      };
    }));
  } catch (error) {
    console.error('Error in generateBudgetVsActual:', error);
    throw error;
  }
};

export default {
  generateBudgetVsActual,
};