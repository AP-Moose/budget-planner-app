import { INCOME_CATEGORIES } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';

export const generateIncomeSourcesAnalysis = (transactions) => {
  console.log('Generating income sources analysis');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const incomeSources = {};

    INCOME_CATEGORIES.forEach(category => {
      const regularIncome = categorizedTransactions.regularIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardIncome = categorizedTransactions.creditCardIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      incomeSources[category] = regularIncome + creditCardIncome;
    });

    return incomeSources;
  } catch (error) {
    console.error('Error in generateIncomeSourcesAnalysis:', error);
    throw error;
  }
};