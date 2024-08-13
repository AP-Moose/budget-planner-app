import { INCOME_CATEGORIES, getCategoryType } from '../../utils/categories';

export const generateIncomeSourcesAnalysis = (transactions) => {
  console.log('Generating income sources analysis');
  try {
    const incomeSources = {};
    INCOME_CATEGORIES.forEach(category => {
      incomeSources[category] = 0;
    });
    transactions.forEach(t => {
      if (getCategoryType(t.category) === 'income') {
        incomeSources[t.category] = (incomeSources[t.category] || 0) + (parseFloat(t.amount) || 0);
      }
    });
    return incomeSources;
  } catch (error) {
    console.error('Error in generateIncomeSourcesAnalysis:', error);
    throw error;
  }
};