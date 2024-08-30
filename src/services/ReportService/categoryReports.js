import { ALL_CATEGORIES, EXPENSE_CATEGORIES, getCategoryType } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';

export const generateCategoryBreakdown = (transactions, startDate, endDate) => {
  console.log('Generating category breakdown');
  console.log('Start date:', startDate);
  console.log('End date:', endDate);
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const categories = {};

    // Calculate the first and last day of the current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Convert startDate and endDate to Date objects if they're not already, with default values
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : lastDayOfMonth;

    console.log('Converted start date:', start);
    console.log('Converted end date:', end);

    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => {
          const transactionDate = new Date(t.date);
          console.log('Transaction date:', transactionDate, 'Category:', t.category, 'Amount:', t.amount);
          const isWithinRange = transactionDate >= start && transactionDate <= end;
          console.log('Is within range:', isWithinRange);
          return t.category === category && isWithinRange;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => {
          const transactionDate = new Date(t.date);
          console.log('CC Transaction date:', transactionDate, 'Category:', t.category, 'Amount:', t.amount);
          const isWithinRange = transactionDate >= start && transactionDate <= end;
          console.log('CC Is within range:', isWithinRange);
          return t.category === category && isWithinRange;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      categories[category] = regularExpenses + creditCardExpenses;
      console.log('Category:', category, 'Total:', categories[category]);
    });

    return categories;
  } catch (error) {
    console.error('Error in generateCategoryBreakdown:', error);
    throw error;
  }
};
