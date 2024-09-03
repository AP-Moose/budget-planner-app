import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';

const filterTransactionsByDate = (transactions, startDate, endDate) => {
  return transactions.filter(t => 
    new Date(t.date) >= startDate && new Date(t.date) <= endDate
  );
};

export const generateMonthlySummary = (transactions, startDate, endDate) => {
  console.log('Generating monthly summary');

  try {
    // Ensure that startDate and endDate are defined
    if (!startDate || !endDate) {
      throw new Error('startDate or endDate is undefined');
    }

    // Normalize the startDate and endDate to the beginning and end of the day
    const normalizedStartDate = new Date(startDate);
    const normalizedEndDate = new Date(endDate);

    normalizedStartDate.setHours(0, 0, 0, 0);
    normalizedEndDate.setHours(23, 59, 59, 999);

    // Filter transactions based on the normalized startDate and endDate
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const withinRange = transactionDate >= normalizedStartDate && transactionDate <= normalizedEndDate;
      console.log(`Transaction Date: ${transactionDate}, Within Range: ${withinRange}`);
      return withinRange;
    });

    console.log(`Filtered Transactions: ${JSON.stringify(filteredTransactions, null, 2)}`);

    const categorizedTransactions = categorizeTransactions(filteredTransactions);
    const totals = calculateTotals(categorizedTransactions);

    const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const totalExpenses = totals.totalRegularExpenses + totals.totalCreditCardPurchases;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments,
    };
  } catch (error) {
    console.error('Error in generateMonthlySummary:', error);
    throw error;
  }
};



export const generateCustomRangeReport = (transactions, startDate, endDate) => {
  console.log('Generating custom range report');
  try {
    const filteredTransactions = filterTransactionsByDate(transactions, startDate, endDate);
    const summary = generateMonthlySummary(filteredTransactions);
    const categorizedTransactions = categorizeTransactions(filteredTransactions);
    
    const expenseBreakdown = {};
    const incomeBreakdown = {};

    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      expenseBreakdown[category] = regularExpenses + creditCardExpenses;
    });

    INCOME_CATEGORIES.forEach(category => {
      const regularIncome = categorizedTransactions.regularIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardIncome = categorizedTransactions.creditCardIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      incomeBreakdown[category] = regularIncome + creditCardIncome;
    });

    const topExpenses = Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const topExpenseCategory = topExpenses.length > 0 ? topExpenses[0].category : 'N/A';
    const topIncomeSource = Object.entries(incomeBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    
    return {
      ...summary,
      startDate,
      endDate,
      topExpenses,
      topExpenseCategory,
      topIncomeSource
    };
  } catch (error) {
    console.error('Error in generateCustomRangeReport:', error);
    throw error;
  }
};

export const generateYTDSummary = (transactions, startDate, endDate) => {
  console.log('Generating YTD summary');
  try {
    const filteredTransactions = filterTransactionsByDate(transactions, startDate, endDate);
    const summary = generateMonthlySummary(filteredTransactions);
    const categorizedTransactions = categorizeTransactions(filteredTransactions);

    const expenseBreakdown = {};
    const incomeBreakdown = {};

    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      expenseBreakdown[category] = regularExpenses + creditCardExpenses;
    });

    INCOME_CATEGORIES.forEach(category => {
      const regularIncome = categorizedTransactions.regularIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardIncome = categorizedTransactions.creditCardIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      incomeBreakdown[category] = regularIncome + creditCardIncome;
    });

    const topExpenseCategory = Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)[0][0];

    const topIncomeSource = Object.entries(incomeBreakdown)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      ...summary,
      topExpenseCategory,
      topIncomeSource
    };
  } catch (error) {
    console.error('Error in generateYTDSummary:', error);
    throw error;
  }
};
