import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const exportReportToCSV = async (reportData, reportType) => {
  console.log('Exporting report to CSV', reportType);
  let csvContent = '';

  try {
    switch (reportType) {
      case 'monthly-summary':
      case 'savings-rate':
        csvContent = `Total Income,Total Expenses,Net Savings,Savings Rate,Credit Card Purchases,Credit Card Payments\n${reportData.totalIncome},${reportData.totalExpenses},${reportData.netSavings},${reportData.savingsRate}%,${reportData.creditCardPurchases},${reportData.creditCardPayments}`;
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
        csvContent = 'Total Income,Total Expenses,Net Savings,Savings Rate,Credit Card Purchases,Credit Card Payments\n';
        csvContent += `${reportData.totalIncome},${reportData.totalExpenses},${reportData.netSavings},${reportData.savingsRate}%,${reportData.creditCardPurchases},${reportData.creditCardPayments}\n\n`;
        csvContent += 'Top Expenses\nCategory,Amount\n';
        reportData.topExpenses.forEach(expense => {
          csvContent += `${expense.category},${expense.amount}\n`;
        });
        break;
      case 'expense-trend':
        csvContent = 'Month,Total Expense,Credit Card Purchases\n';
        reportData.forEach(item => {
          csvContent += `${item.month},${item.totalExpense},${item.creditCardPurchases}\n`;
        });
        break;
      case 'cash-flow':
        csvContent = 'Cash Inflow,Cash Outflow,Credit Card Purchases,Credit Card Payments,Net Cash Flow\n';
        csvContent += `${reportData.cashInflow},${reportData.cashOutflow},${reportData.creditCardPurchases},${reportData.creditCardPayments},${reportData.netCashFlow}`;
        break;
      case 'category-transaction-detail':
        csvContent = 'Category,Date,Amount,Description,Credit Card,Is Card Payment\n';
        Object.entries(reportData).forEach(([category, transactions]) => {
          transactions.forEach(t => {
            csvContent += `${category},${t.date},${t.amount},${t.description},${t.creditCard},${t.isCardPayment}\n`;
          });
        });
        break;
      case 'credit-card-statement':
        csvContent = 'Credit Card,Opening Balance,Purchases,Payments,Income,Closing Balance\n';
        Object.entries(reportData).forEach(([cardName, cardData]) => {
          csvContent += `${cardName},${cardData.openingBalance},${cardData.purchases},${cardData.payments},${cardData.income},${cardData.closingBalance}\n`;
        });
        csvContent += '\nTransactions\n';
        csvContent += 'Credit Card,Date,Description,Amount,Type\n';
        Object.entries(reportData).forEach(([cardName, cardData]) => {
          cardData.transactions.forEach(t => {
            csvContent += `${cardName},${t.date},${t.description},${t.amount},${t.type}\n`;
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