import { ALL_CATEGORIES, EXPENSE_CATEGORIES, getCategoryType } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';

export const generateCategoryBreakdown = (transactions) => {
  console.log('Generating category breakdown');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const categories = {};

    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      categories[category] = regularExpenses + creditCardExpenses;
    });

    return categories;
  } catch (error) {
    console.error('Error in generateCategoryBreakdown:', error);
    throw error;
  }
};

export const generateCategoryTransactionDetail = (transactions) => {
  console.log('Generating category transaction detail');
  try {
    const categoryTransactions = {};
    ALL_CATEGORIES.forEach(category => {
      categoryTransactions[category] = [];
    });

    transactions.forEach(t => {
      categoryTransactions[t.category].push({
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        creditCard: t.creditCard,
        isCardPayment: t.isCardPayment
      });
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