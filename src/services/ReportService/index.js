import { getTransactions, getBudgetGoals } from '../FirebaseService';
import * as summaryReports from './summaryReports';
import * as categoryReports from './categoryReports';
import * as budgetReports from './budgetReports';
import * as incomeReports from './incomeReports';
import * as savingsReports from './savingsReports';
import * as trendReports from './trendReports';
import * as cashFlowReports from './cashFlowReports';
import { exportReportToCSV } from './csvExport';

const normalizeDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const filterTransactions = (transactions, startDate, endDate, isYTD = false) => {
  if (isYTD) {
    const currentYear = new Date().getFullYear();
    return transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
  } else {
    const normalizedStartDate = normalizeDate(new Date(startDate));
    const normalizedEndDate = normalizeDate(new Date(endDate));
    return transactions.filter(t => {
      const normalizedTransactionDate = normalizeDate(new Date(t.date));
      return normalizedTransactionDate >= normalizedStartDate && normalizedTransactionDate <= normalizedEndDate;
    });
  }
};

export const generateReport = async (reportType, startDate, endDate) => {
  try {
    console.log('Fetching transactions and budget goals');
    const transactions = await getTransactions();
    const budgetGoals = await getBudgetGoals();
    
    const isYTD = reportType === 'ytd-summary';
    const filteredTransactions = filterTransactions(transactions, startDate, endDate, isYTD);

    console.log('Filtered transactions:', filteredTransactions.length);

    switch (reportType) {
      case 'monthly-summary':
        return summaryReports.generateMonthlySummary(filteredTransactions);
      case 'category-breakdown':
        return categoryReports.generateCategoryBreakdown(filteredTransactions);
      case 'budget-vs-actual':
        return budgetReports.generateBudgetVsActual(filteredTransactions, budgetGoals);
      case 'income-sources':
        return incomeReports.generateIncomeSourcesAnalysis(filteredTransactions);
      case 'savings-rate':
        return savingsReports.generateSavingsRateReport(filteredTransactions);
      case 'ytd-summary':
      case 'custom-range':
        return summaryReports.generateCustomRangeReport(filteredTransactions);
      case 'expense-trend':
        return trendReports.generateExpenseTrendAnalysis(filteredTransactions);
      case 'cash-flow':
        return cashFlowReports.generateCashFlowStatement(filteredTransactions);
      case 'category-transaction-detail':
        return categoryReports.generateCategoryTransactionDetail(filteredTransactions);
      default:
        throw new Error('Invalid report type');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export { exportReportToCSV };