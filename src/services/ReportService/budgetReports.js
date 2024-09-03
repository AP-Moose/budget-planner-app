import { EXPENSE_CATEGORIES } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';
import { getBudgetGoals } from '../FirebaseService';

// Function to generate Budget vs Actual report
export const generateBudgetVsActual = async (transactions, startDate, endDate) => {
  console.log('Generating budget vs actual');
  try {
    // Calculate the first and last day of the selected date range
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;

    const budgetGoals = await getBudgetGoalsForRange(startDate, endDate);

    if (budgetGoals.length === 0) {
      console.log('No budget goals found for the selected range.');
      return []; // Return an empty array or handle accordingly
    }

    console.log('Budget Goals:', budgetGoals);

    // Categorize transactions using the correct function
    const categorizedTransactions = categorizeTransactions(transactions);
    console.log('Categorized Transactions:', categorizedTransactions);

    const results = EXPENSE_CATEGORIES.map(category => {
      // Sum the budget goals for the category within the selected range
      const budgetedAmount = budgetGoals
        .filter(goal => goal.category === category)
        .reduce((sum, goal) => sum + Number(goal.amount), 0);

      if (!budgetedAmount) {
        console.log(`No budget goal found for category: ${category}`);
      }

      const actual = categorizedTransactions.regularExpenses
        .filter(t => t.category === category && t.date >= startDate && t.date <= endDate)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const creditCardActual = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category && t.date >= startDate && t.date <= endDate)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalActual = actual + creditCardActual;

      console.log(`Category: ${category}, Budgeted: ${budgetedAmount}, Actual: ${totalActual}`);

      return {
        category,
        budgeted: budgetedAmount,
        actual: totalActual,
        difference: budgetedAmount - totalActual
      };
    });

    console.log('Budget vs Actual Results:', results);

    return results;
  } catch (error) {
    console.error('Error in generateBudgetVsActual:', error);
    throw error;
  }
};

// Function to get budget goals for a range of months
export const getBudgetGoalsForRange = async (startDate, endDate) => {
  try {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;

    const goals = [];

    for (let year = startYear; year <= endYear; year++) {
      const fromMonth = year === startYear ? startMonth : 1;
      const toMonth = year === endYear ? endMonth : 12;

      for (let month = fromMonth; month <= toMonth; month++) {
        const monthlyGoals = await getBudgetGoals(year);
        goals.push(...monthlyGoals.filter(goal => goal.month === month));
      }
    }

    return goals;
  } catch (error) {
    console.error('Error in getBudgetGoalsForRange:', error);
    throw error;
  }
};

// Export the functions
export default {
  generateBudgetVsActual,
  getBudgetGoalsForRange,
};
