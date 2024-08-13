import { generateMonthlySummary } from './summaryReports';

export const generateSavingsRateReport = (transactions) => {
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