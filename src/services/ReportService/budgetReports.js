import { EXPENSE_CATEGORIES } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';
import { getBudgetGoals } from '../FirebaseService';

// Function to generate Budget vs Actual report
export const generateBudgetVsActual = async (transactions, startDate, endDate, budgetGoals) => {
  console.log('Generating budget vs actual');
  try {
    // Calculate the first and last day of the selected date range
    const now = new Date();
    const firstDayOfMonth = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = endDate ? new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log('First Day of Month:', firstDayOfMonth);
    console.log('Last Day of Month:', lastDayOfMonth);

    if (budgetGoals.length === 0) {
      console.log('No budget goals found for the selected range.');
      return []; // Return an empty array or handle accordingly
    }

    console.log('Budget Goals:', budgetGoals);

    // Categorize transactions using the correct function
    const categorizedTransactions = categorizeTransactions(transactions);
    console.log('Categorized Transactions:', categorizedTransactions);

    const results = EXPENSE_CATEGORIES.map(category => {
      const budgetGoal = budgetGoals
        .filter(goal => 
          goal.category === category &&
          goal.month >= firstDayOfMonth.getMonth() + 1 && 
          goal.year >= firstDayOfMonth.getFullYear() && 
          goal.month <= lastDayOfMonth.getMonth() + 1 && 
          goal.year <= lastDayOfMonth.getFullYear()
        )
        .reduce((sum, goal) => sum + Number(goal.amount), 0);
    
      if (!budgetGoal) {
        console.log(`No budget goal found for category: ${category}`);
      }
    
      const actual = categorizedTransactions.regularExpenses
        .filter(t => t.category === category && t.date >= firstDayOfMonth && t.date <= lastDayOfMonth)
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
      const creditCardActual = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category && t.date >= firstDayOfMonth && t.date <= lastDayOfMonth)
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
      const totalActual = actual + creditCardActual;
    
      console.log(`Category: ${category}, Budgeted: ${budgetGoal}, Actual: ${totalActual}`);
    
      return {
        category,
        budgeted: budgetGoal,
        actual: totalActual,
        difference: budgetGoal - totalActual
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
      const start = year === startYear ? startMonth : 1;
      const end = year === endYear ? endMonth : 12;

      for (let month = start; month <= end; month++) {
        const monthlyGoals = await getBudgetGoals(year, month);
        goals.push(...monthlyGoals);
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
