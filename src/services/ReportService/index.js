import { getTransactions, getBudgetGoals, getCreditCards, getLoans } from '../FirebaseService';
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
    console.log('Fetching transactions, budget goals, credit cards, and loans');
    const transactions = await getTransactions();
    const budgetGoals = await getBudgetGoals();
    const creditCards = await getCreditCards();
    const loans = await getLoans();

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
      case 'loan-payment-summary':
        return generateLoanPaymentSummary(filteredTransactions, loans);
      case 'cashback-summary':
        return generateCashbackSummary(filteredTransactions, creditCards);
      default:
        throw new Error('Invalid report type');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

const generateLoanPaymentSummary = (transactions, loans) => {
  const loanPayments = transactions.filter(t => t.isLoanPayment);
  const summary = loans.map(loan => {
    const payments = loanPayments.filter(t => t.loanId === loan.id);
    const totalPaid = payments.reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      loanName: loan.name,
      initialAmount: loan.initialAmount,
      currentBalance: loan.currentBalance,
      totalPaid: totalPaid,
      remainingBalance: loan.currentBalance - totalPaid,
      payments: payments.map(p => ({
        date: p.date,
        amount: p.amount
      }))
    };
  });
  return summary;
};

const generateCashbackSummary = (transactions, creditCards) => {
  const cashbackTransactions = transactions.filter(t => t.isCashback);
  const summary = creditCards.map(card => {
    const cardCashback = cashbackTransactions.filter(t => t.creditCardId === card.id);
    const totalCashback = cardCashback.reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      cardName: card.name,
      totalCashback: totalCashback,
      transactions: cardCashback.map(c => ({
        date: c.date,
        amount: c.amount,
        description: c.description
      }))
    };
  });
  return summary;
};

export { exportReportToCSV };