import { getTransactions, getBudgetGoals } from './FirebaseService';

export const generateReport = async (reportType, startDate, endDate) => {
  try {
    const transactions = await getTransactions();
    const budgetGoals = await getBudgetGoals();
    
    // Filter transactions based on date range
    const filteredTransactions = transactions.filter(
      t => new Date(t.date) >= startDate && new Date(t.date) <= endDate
    );

    switch (reportType) {
      case 'monthly-summary':
        return generateMonthlySummary(filteredTransactions);
      case 'category-breakdown':
        return generateCategoryBreakdown(filteredTransactions);
      case 'budget-vs-actual':
        return generateBudgetVsActual(filteredTransactions, budgetGoals);
      default:
        throw new Error('Invalid report type');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

const generateMonthlySummary = (transactions) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  return {
    totalIncome: income,
    totalExpenses: expenses,
    netSavings: income - expenses,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
  };
};

const generateCategoryBreakdown = (transactions) => {
  const categories = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const amount = parseFloat(t.amount) || 0;
      categories[t.category] = (categories[t.category] || 0) + amount;
    }
  });
  return categories;
};

const generateBudgetVsActual = (transactions, budgetGoals) => {
  const actual = generateCategoryBreakdown(transactions);
  return budgetGoals.map(goal => ({
    category: goal.category,
    budgeted: parseFloat(goal.amount) || 0,
    actual: parseFloat(actual[goal.category]) || 0,
    difference: (parseFloat(goal.amount) || 0) - (parseFloat(actual[goal.category]) || 0)
  }));
};

export const exportReportToCSV = (reportData, reportType) => {
  let csvContent = '';

  switch (reportType) {
    case 'monthly-summary':
      csvContent = `Total Income,Total Expenses,Net Savings,Savings Rate\n${reportData.totalIncome},${reportData.totalExpenses},${reportData.netSavings},${reportData.savingsRate}%`;
      break;
    case 'category-breakdown':
      csvContent = 'Category,Amount\n';
      Object.entries(reportData).forEach(([category, amount]) => {
        csvContent += `${category},${amount}\n`;
      });
      break;
    case 'budget-vs-actual':
      csvContent = 'Category,Budgeted,Actual,Difference\n';
      reportData.forEach(item => {
        csvContent += `${item.category},${item.budgeted},${item.actual},${item.difference}\n`;
      });
      break;
    default:
      throw new Error('Invalid report type for CSV export');
  }

  return csvContent;
};