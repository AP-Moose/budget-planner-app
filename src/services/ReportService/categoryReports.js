import { ALL_CATEGORIES, EXPENSE_CATEGORIES, getCategoryType } from '../../utils/categories';

export const generateCategoryBreakdown = (transactions) => {
  console.log('Generating category breakdown');
  try {
    const categories = {};
    EXPENSE_CATEGORIES.forEach(category => {
      categories[category] = 0;
    });
    transactions.forEach(t => {
      if (getCategoryType(t.category) === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + (parseFloat(t.amount) || 0);
      }
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
        amount: parseFloat(t.amount) || 0,
        description: t.description,
        creditCard: t.creditCard,
        creditCardName: t.creditCardName // Assuming this information is available in the transaction
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