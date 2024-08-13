import { getTransactions, getBudgetGoals, getCreditCards } from '../FirebaseService';
import * as summaryReports from './summaryReports';
import * as categoryReports from './categoryReports';
import * as budgetReports from './budgetReports';
import * as incomeReports from './incomeReports';
import * as savingsReports from './savingsReports';
import * as trendReports from './trendReports';
import * as cashFlowReports from './cashFlowReports';
import * as creditCardReports from './creditCardReports';
import { exportReportToCSV } from './csvExport';

const normalizeDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const generateReport = async (reportType, startDate, endDate) => {
  try {
    console.log('Fetching transactions, budget goals, and credit cards');
    const transactions = await getTransactions();
    const budgetGoals = await getBudgetGoals();
    const creditCards = await getCreditCards();
    
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
      case 'credit-card-statement':
        return creditCardReports.generateCreditCardStatement(filteredTransactions, creditCards, startDate, endDate);
      default:
        throw new Error('Invalid report type');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export { exportReportToCSV };