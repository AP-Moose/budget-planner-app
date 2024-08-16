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
import { generateCreditUtilizationReport } from './creditUtilizationReport';
import { generatePaymentHistoryReport } from './paymentHistoryReport';
import { generateDebtReductionProjection } from './debtReductionProjection';
import { generateCategoryCreditCardUsage } from './categoryCreditCardUsage';
import { generateBalanceSheetReport } from './balanceSheetReport';

export const generateReport = async (reportType, startDate, endDate) => {
  try {
    console.log('Fetching transactions, budget goals, and credit cards');
    const transactions = await getTransactions();
    const budgetGoals = await getBudgetGoals();
    const creditCards = await getCreditCards();
    
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

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
      case 'detailed-cash-flow':
        return cashFlowReports.generateDetailedCashFlowStatement(filteredTransactions);
      case 'category-transaction-detail':
        return categoryReports.generateCategoryTransactionDetail(filteredTransactions);
      case 'credit-card-statement':
        return creditCardReports.generateCreditCardStatement(filteredTransactions, creditCards, startDate, endDate);
      case 'credit-utilization':
        return generateCreditUtilizationReport(filteredTransactions);
      case 'payment-history':
        return generatePaymentHistoryReport(filteredTransactions);
      case 'debt-reduction-projection':
        return generateDebtReductionProjection(filteredTransactions);
      case 'category-credit-card-usage':
        return generateCategoryCreditCardUsage(filteredTransactions);
      case 'balance-sheet':
        return generateBalanceSheetReport(filteredTransactions, endDate);
      default:
        throw new Error('Invalid report type');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export { exportReportToCSV };