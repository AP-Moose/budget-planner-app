import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';

export const generateMonthlySummary = (transactions) => {
  console.log('Generating monthly summary');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
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
      creditCardPayments: totals.totalCreditCardPayments
    };
  } catch (error) {
    console.error('Error in generateMonthlySummary:', error);
    throw error;
  }
};

export const generateCustomRangeReport = (transactions, startDate, endDate) => {
  console.log('Generating custom range report');
  try {
    // Filter transactions by the selected date range
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    if (filteredTransactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        savingsRate: 0,
        creditCardPurchases: 0,
        creditCardPayments: 0,
        startDate,
        endDate,
        topExpenses: [],
        topExpenseCategory: 'N/A',
        topIncomeSource: 'N/A'
      };
    }

    const categorizedTransactions = categorizeTransactions(filteredTransactions);

    const totalIncome = categorizedTransactions.regularIncome.reduce((sum, t) => sum + Number(t.amount), 0) + 
                        categorizedTransactions.creditCardIncome.reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = categorizedTransactions.regularExpenses.reduce((sum, t) => sum + Number(t.amount), 0) +
                          categorizedTransactions.creditCardPurchases.reduce((sum, t) => sum + Number(t.amount), 0);

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

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
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      creditCardPurchases: categorizedTransactions.creditCardPurchases.reduce((sum, t) => sum + Number(t.amount), 0),
      creditCardPayments: categorizedTransactions.creditCardPayments.reduce((sum, t) => sum + Number(t.amount), 0),
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




export const generateYTDSummary = (transactions) => {
  console.log('Generating YTD summary');
  try {
    const summary = generateMonthlySummary(transactions);
    const categorizedTransactions = categorizeTransactions(transactions);

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