import { EXPENSE_CATEGORIES } from '../../utils/categories';

export const generateCategoryCreditCardUsage = (transactions) => {
  console.log('Generating category-specific credit card usage report');
  try {
    const creditCardTransactions = transactions.filter(t => t.creditCard && !t.isCardPayment);
    const report = {};

    EXPENSE_CATEGORIES.forEach(category => {
      const categoryTransactions = creditCardTransactions.filter(t => t.category === category);
      const totalAmount = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const transactionCount = categoryTransactions.length;

      report[category] = {
        totalAmount: totalAmount,
        transactionCount,
        averageTransactionAmount: transactionCount > 0 ? totalAmount / transactionCount : 0
      };
    });

    // Calculate percentages
    const totalCreditCardSpending = Object.values(report).reduce((sum, cat) => sum + cat.totalAmount, 0);
    Object.keys(report).forEach(category => {
      report[category].percentageOfTotal = totalCreditCardSpending > 0 
        ? (report[category].totalAmount / totalCreditCardSpending) * 100 
        : 0;
    });

    return report;
  } catch (error) {
    console.error('Error in generateCategoryCreditCardUsage:', error);
    throw error;
  }
};