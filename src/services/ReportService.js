import { getTransactions, getBudgetGoals } from './FirebaseService';
import { ALL_CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, getCategoryType } from '../utils/categories';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const normalizeDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const generateReport = async (reportType, startDate, endDate) => {
  try {
    console.log('Fetching transactions and budget goals');
    const transactions = await getTransactions();
    const budgetGoals = await getBudgetGoals();
    
    let filteredTransactions;
    if (reportType === 'ytd-summary') {
      const currentYear = new Date().getFullYear();
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentYear;
      });
    } else {
      console.log('Filtering transactions', startDate, endDate);
      const normalizedStartDate = normalizeDate(new Date(startDate));
      const normalizedEndDate = normalizeDate(new Date(endDate));
      filteredTransactions = transactions.filter(t => {
        const normalizedTransactionDate = normalizeDate(new Date(t.date));
        return normalizedTransactionDate >= normalizedStartDate && normalizedTransactionDate <= normalizedEndDate;
      });
    }

    console.log('Filtered transactions:', filteredTransactions.length);

    let report;
    switch (reportType) {
      case 'monthly-summary':
        report = generateMonthlySummary(filteredTransactions);
        break;
      case 'category-breakdown':
        report = generateCategoryBreakdown(filteredTransactions);
        break;
      case 'budget-vs-actual':
        report = generateBudgetVsActual(filteredTransactions, budgetGoals);
        break;
      case 'income-sources':
        report = generateIncomeSourcesAnalysis(filteredTransactions);
        break;
      case 'savings-rate':
        report = generateSavingsRateReport(filteredTransactions);
        break;
      case 'ytd-summary':
      case 'custom-range':
        report = generateCustomRangeReport(filteredTransactions);
        break;
      case 'expense-trend':
        report = generateExpenseTrendAnalysis(filteredTransactions);
        break;
      case 'cash-flow':
        report = generateCashFlowStatement(filteredTransactions);
        break;
      case 'category-transaction-detail':
        report = generateCategoryTransactionDetail(filteredTransactions);
        break;
      default:
        throw new Error('Invalid report type');
    }

    console.log('Generated report:', JSON.stringify(report, null, 2));
    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

const generateMonthlySummary = (transactions) => {
  console.log('Generating monthly summary');
  try {
    const income = transactions
      .filter(t => getCategoryType(t.category) === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expenses = transactions
      .filter(t => getCategoryType(t.category) === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
    };
  } catch (error) {
    console.error('Error in generateMonthlySummary:', error);
    throw error;
  }
};

const generateCategoryBreakdown = (transactions) => {
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

const generateBudgetVsActual = (transactions, budgetGoals) => {
  console.log('Generating budget vs actual');
  try {
    const actual = generateCategoryBreakdown(transactions);
    return EXPENSE_CATEGORIES.map(category => {
      const budgetGoal = budgetGoals.find(goal => goal.category === category);
      return {
        category,
        budgeted: budgetGoal ? parseFloat(budgetGoal.amount) || 0 : 0,
        actual: parseFloat(actual[category]) || 0,
        difference: (budgetGoal ? parseFloat(budgetGoal.amount) : 0) - (parseFloat(actual[category]) || 0)
      };
    });
  } catch (error) {
    console.error('Error in generateBudgetVsActual:', error);
    throw error;
  }
};

const generateIncomeSourcesAnalysis = (transactions) => {
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

const generateSavingsRateReport = (transactions) => {
  console.log('Generating savings rate report');
  try {
    const summary = generateMonthlySummary(transactions);
    return {
      ...summary,
      savingsRate: summary.totalIncome > 0 ? (summary.netSavings / summary.totalIncome) * 100 : 0
    };
  } catch (error) {
    console.error('Error in generateSavingsRateReport:', error);
    throw error;
  }
};

const generateCustomRangeReport = (transactions) => {
  console.log('Generating custom range report');
  try {
    const summary = generateMonthlySummary(transactions);
    const expenseBreakdown = generateCategoryBreakdown(transactions);
    const topExpenses = Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    return {
      ...summary,
      topExpenses
    };
  } catch (error) {
    console.error('Error in generateCustomRangeReport:', error);
    throw error;
  }
};

const generateExpenseTrendAnalysis = (transactions) => {
  console.log('Generating expense trend analysis');
  try {
    const monthlyExpenses = {};
    transactions.forEach(t => {
      if (getCategoryType(t.category) === 'expense') {
        const month = new Date(t.date).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthlyExpenses[month] = (monthlyExpenses[month] || 0) + (parseFloat(t.amount) || 0);
      }
    });
    return Object.entries(monthlyExpenses).map(([month, totalExpense]) => ({ month, totalExpense }));
  } catch (error) {
    console.error('Error in generateExpenseTrendAnalysis:', error);
    throw error;
  }
};

const generateCashFlowStatement = (transactions) => {
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

const generateCategoryTransactionDetail = (transactions) => {
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
        description: t.description
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

export const exportReportToCSV = async (reportData, reportType) => {
  console.log('Exporting report to CSV', reportType);
  let csvContent = '';

  try {
    switch (reportType) {
      case 'monthly-summary':
      case 'savings-rate':
        csvContent = `Total Income,Total Expenses,Net Savings,Savings Rate\n${reportData.totalIncome},${reportData.totalExpenses},${reportData.netSavings},${reportData.savingsRate}%`;
        break;
      case 'category-breakdown':
      case 'income-sources':
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
      case 'ytd-summary':
      case 'custom-range':
        csvContent = 'Total Income,Total Expenses,Net Savings,Savings Rate\n';
        csvContent += `${reportData.totalIncome},${reportData.totalExpenses},${reportData.netSavings},${reportData.savingsRate}%\n\n`;
        csvContent += 'Top Expenses\nCategory,Amount\n';
        reportData.topExpenses.forEach(expense => {
          csvContent += `${expense.category},${expense.amount}\n`;
        });
        break;
      case 'expense-trend':
        csvContent = 'Month,Total Expense\n';
        reportData.forEach(item => {
          csvContent += `${item.month},${item.totalExpense}\n`;
        });
        break;
      case 'cash-flow':
        csvContent = 'Cash Inflow,Cash Outflow,Net Cash Flow\n';
        csvContent += `${reportData.cashInflow},${reportData.cashOutflow},${reportData.netCashFlow}`;
        break;
      case 'category-transaction-detail':
        csvContent = 'Category,Date,Amount,Description\n';
        Object.entries(reportData).forEach(([category, transactions]) => {
          transactions.forEach(t => {
            csvContent += `${category},${t.date},${t.amount},${t.description}\n`;
          });
        });
        break;
      default:
        throw new Error('Invalid report type for CSV export');
    }

    const fileName = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Report CSV' });
    return 'CSV exported successfully. You can now choose where to save or share the file.';
  } catch (error) {
    console.error('Error in exportReportToCSV:', error);
    throw error;
  }
};

export default {
  generateReport,
  exportReportToCSV
};