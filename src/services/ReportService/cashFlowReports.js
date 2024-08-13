import { getCategoryType } from '../../utils/categories';

export const generateCashFlowStatement = (transactions) => {
  console.log('Generating cash flow statement');
  try {
    const cashInflow = transactions
      .filter(t => getCategoryType(t.category) === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const cashOutflow = transactions
      .filter(t => getCategoryType(t.category) === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    return {
      cashInflow,
      cashOutflow,
      netCashFlow: cashInflow - cashOutflow
    };
  } catch (error) {
    console.error('Error in generateCashFlowStatement:', error);
    throw error;
  }
};