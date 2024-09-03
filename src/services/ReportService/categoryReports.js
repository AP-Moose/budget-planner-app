import { ALL_CATEGORIES, EXPENSE_CATEGORIES, getCategoryType } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';

// Function to generate category breakdown
export const generateCategoryBreakdown = (transactions, startDate, endDate) => {
  console.log('Generating category breakdown');
  console.log('Start date:', startDate);
  console.log('End date:', endDate);

  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const categories = {};

    // If startDate and endDate are undefined, set them to valid date objects
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : lastDayOfMonth;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid start or end date. Falling back to the current month range.');
      start = firstDayOfMonth;
      end = lastDayOfMonth;
    }

    console.log('Converted start date:', start);
    console.log('Converted end date:', end);

    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.category === category && transactionDate >= start && transactionDate <= end;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.category === category && transactionDate >= start && transactionDate <= end;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      categories[category] = regularExpenses + creditCardExpenses;
    });

    console.log('Generated report:', categories);
    return categories;
  } catch (error) {
    console.error('Error in generateCategoryBreakdown:', error);
    throw error;
  }
};




// Function to generate category transaction detail
export const generateCategoryTransactionDetail = (transactions, startDate, endDate) => {
  console.log('Generating category transaction detail');
  try {
    const categoryTransactions = {};

    // Calculate the first and last day of the current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Convert startDate and endDate to Date objects if they're not already, with default values
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : lastDayOfMonth;

    ALL_CATEGORIES.forEach(category => {
      categoryTransactions[category] = [];
    });

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      const isWithinRange = transactionDate >= start && transactionDate <= end;

      if (isWithinRange) {
        categoryTransactions[t.category].push({
          date: t.date,
          amount: Number(t.amount),
          description: t.description,
          creditCard: t.creditCard,
          isCardPayment: t.isCardPayment
        });
      }
    });

    // Sort transactions within each category by date
    Object.keys(categoryTransactions).forEach(category => {
      categoryTransactions[category].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return categoryTransactions;
  } catch (error) {
    console.error('Error in generateCategoryTransactionDetail:', error);
    throw error;
  }
};
