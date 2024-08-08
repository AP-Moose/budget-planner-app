import { getTransactions, getBudgetGoals } from './FirebaseService';
import { ALL_CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing/src/Sharing';

export const generateReport = async (reportType, startDate, endDate) => {
  try {
    console.log('Fetching transactions and budget goals');
    const transactions = await getTransactions();
    const budgetGoals = await getBudgetGoals();
    
    console.log('Filtering transactions', startDate, endDate);
    const filteredTransactions = transactions.filter(
      t => new Date(t.date) >= startDate && new Date(t.date) <= endDate
    );

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
        report = generateExpenseCategoryBreakdown(filteredTransactions, budgetGoals);
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
      .filter(t => INCOME_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expenses = transactions
      .filter(t => EXPENSE_CATEGORIES.includes(t.category))
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
    ALL_CATEGORIES.forEach(category => {
      categories[category] = 0;
    });
    transactions.forEach(t => {
      if (ALL_CATEGORIES.includes(t.category)) {
        categories[t.category] += parseFloat(t.amount) || 0;
      }
    });
    return categories;
  } catch (error) {
    console.error('Error in generateCategoryBreakdown:', error);
    throw error;
  }
};

const generateExpenseCategoryBreakdown = (transactions, budgetGoals) => {
  console.log('Generating expense category breakdown');
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
    console.error('Error in generateExpenseCategoryBreakdown:', error);
    throw error;
  }
};

export const exportReportToCSV = async (reportData, reportType) => {
  console.log('Exporting report to CSV', reportType);
  let csvContent = '';

  try {
    switch (reportType) {
      case 'monthly-summary':
        csvContent = `Total Income,Total Expenses,Net Savings,Savings Rate\n${reportData.totalIncome},${reportData.totalExpenses},${reportData.netSavings},${reportData.savingsRate}%`;
        break;
      case 'category-breakdown':
        csvContent = 'Category,Amount\n';
        ALL_CATEGORIES.forEach(category => {
          csvContent += `${category},${reportData[category] || 0}\n`;
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