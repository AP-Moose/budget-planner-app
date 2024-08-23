import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMonth } from '../context/MonthContext';
import { generateReport, exportReportToCSV } from '../services/ReportService';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';
import BalanceSheetView from '../components/BalanceSheetView';

const ReportsScreen = () => {
  const { currentMonth } = useMonth();
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportType, setReportType] = useState(null);
  const [startDate, setStartDate] = useState(new Date(reportMonth.getFullYear(), reportMonth.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(reportMonth.getFullYear(), reportMonth.getMonth() + 1, 0));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);
  const [isYTD, setIsYTD] = useState(false);

  const reportTypes = [
    {
      category: "Summary Reports",
      reports: [
        { label: 'Income vs Expense Summary', value: 'monthly-summary' },
        { label: 'Custom Date Range Report', value: 'custom-range' },
        { label: 'Balance Sheet', value: 'balance-sheet' },
      ]
    },
    {
      category: "Expense Analysis",
      reports: [
        { label: 'Category-wise Expense Breakdown', value: 'category-breakdown' },
        { label: 'Expense Trend Analysis', value: 'expense-trend' },
        { label: 'Category Transaction Detail', value: 'category-transaction-detail' },
      ]
    },
    {
      category: "Budget and Savings",
      reports: [
        { label: 'Budget vs Actual Spending Comparison', value: 'budget-vs-actual' },
        { label: 'Savings Rate Report', value: 'savings-rate' },
      ]
    },
    {
      category: "Income and Cash Flow",
      reports: [
        { label: 'Income Sources Analysis', value: 'income-sources' },
        { label: 'Cash Flow Statement', value: 'cash-flow' },
      ]
    },
    {
      category: "Credit Card Reports",
      reports: [
        { label: 'Credit Card Statement', value: 'credit-card-statement' },
        { label: 'Credit Utilization Report', value: 'credit-utilization' },
        { label: 'Payment History Report', value: 'payment-history' },
        { label: 'Debt Reduction Projection', value: 'debt-reduction-projection' },
        { label: 'Category Credit Card Usage', value: 'category-credit-card-usage' },
      ]
    },
  ];

  useEffect(() => {
    updateDateRange();
  }, [reportType, reportMonth, isYTD]);

  const updateDateRange = () => {
    const now = new Date();
    if (isYTD || reportType === 'ytd-summary') {
      setStartDate(new Date(now.getFullYear(), 0, 1));
      setEndDate(now);
    } else if (reportType === 'monthly-summary') {
      setStartDate(new Date(reportMonth.getFullYear(), reportMonth.getMonth(), 1));
      setEndDate(new Date(reportMonth.getFullYear(), reportMonth.getMonth() + 1, 0));
    } else if (reportType === 'expense-trend') {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      setStartDate(new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1));
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }
  };

  const handleGenerateReport = async () => {
    if (startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date must be before or equal to end date.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Generating report:', reportType, startDate, endDate);
      const report = await generateReport(reportType, startDate, endDate);
      console.log('Generated report:', JSON.stringify(report, null, 2));
      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', `Failed to generate report: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!reportData) {
      Alert.alert('Error', 'Please generate a report first.');
      return;
    }

    try {
      const message = await exportReportToCSV(reportData, reportType);
      Alert.alert('Success', message);
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', `Failed to export report: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '$0.00';
    return `$${Number(value).toFixed(2)}`;
  };

  const renderDateSelection = () => {
    if (isYTD || reportType === 'ytd-summary') {
      return (
        <View style={styles.dateContainer}>
          <Text>Year-to-Date: {startDate.getFullYear()}</Text>
        </View>
      );
    } else if (reportType === 'monthly-summary') {
      return (
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
            <Text>Month: {startDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
            <Text>Start: {startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateButton}>
            <Text>End: {endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  const withErrorHandling = (renderFunction) => {
    return (data) => {
      if (!data || typeof data !== 'object') {
        return <Text style={styles.reportItem}>No data available</Text>;
      }
      try {
        return renderFunction(data);
      } catch (error) {
        console.error('Error rendering report data:', error);
        return <Text style={styles.reportItem}>Error rendering report data: {error.message}</Text>;
      }
    };
  };

  const renderReportData = () => {
    if (!reportData) return null;

    console.log('Rendering report data:', JSON.stringify(reportData, null, 2));

    const renderFunctions = {
      'monthly-summary': withErrorHandling(renderMonthlySummary),
      'ytd-summary': withErrorHandling(renderYTDSummary),
      'custom-range': withErrorHandling(renderCustomRange),
      'category-breakdown': withErrorHandling(renderCategoryBreakdown),
      'budget-vs-actual': withErrorHandling(renderBudgetVsActual),
      'income-sources': withErrorHandling(renderIncomeSources),
      'savings-rate': withErrorHandling(renderSavingsRate),
      'expense-trend': withErrorHandling(renderExpenseTrend),
      'cash-flow': withErrorHandling(renderCashFlow),
      'category-transaction-detail': withErrorHandling(renderCategoryTransactionDetail),
      'credit-card-statement': withErrorHandling(renderCreditCardStatement),
      'credit-utilization': withErrorHandling(renderCreditUtilization),
      'payment-history': withErrorHandling(renderPaymentHistory),
      'debt-reduction-projection': withErrorHandling(renderDebtReductionProjection),
      'category-credit-card-usage': withErrorHandling(renderCategoryCreditCardUsage),
      'balance-sheet': withErrorHandling((data) => <BalanceSheetView reportData={data} />),
    };

    const renderFunction = renderFunctions[reportType];
    return renderFunction ? renderFunction(reportData) : <Text style={styles.reportItem}>Unknown report type</Text>;
  };

  const renderMonthlySummary = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Monthly Summary</Text>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Total Income:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.totalIncome)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Total Expenses:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.totalExpenses)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Net Savings:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.netSavings)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Savings Rate:</Text>
        <Text style={styles.reportValue}>{data.savingsRate?.toFixed(2) || '0.00'}%</Text>
      </View>
    </View>
  );

  const renderYTDSummary = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Year-to-Date Summary</Text>
      {/* Implement YTD summary rendering logic */}
    </View>
  );

  const renderCustomRange = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Custom Range Report</Text>
      {/* Implement custom range report rendering logic */}
    </View>
  );

  const renderCategoryBreakdown = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Category Breakdown</Text>
      {EXPENSE_CATEGORIES.map((category) => (
        <View key={category} style={styles.reportRow}>
          <Text style={styles.reportLabel}>{category}:</Text>
          <Text style={styles.reportValue}>{formatCurrency(data[category])}</Text>
        </View>
      ))}
    </View>
  );

  const renderBudgetVsActual = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Budget vs Actual</Text>
      {data.map((item) => (
        <View key={item.category} style={styles.reportSection}>
          <Text style={styles.reportSubtitle}>{item.category}</Text>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Budgeted:</Text>
            <Text style={styles.reportValue}>{formatCurrency(item.budgeted)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Actual:</Text>
            <Text style={styles.reportValue}>{formatCurrency(item.actual)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Difference:</Text>
            <Text style={[styles.reportValue, item.difference < 0 ? styles.negativeValue : styles.positiveValue]}>
              {formatCurrency(item.difference)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderIncomeSources = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Income Sources</Text>
      {INCOME_CATEGORIES.map((category) => (
        <View key={category} style={styles.reportRow}>
          <Text style={styles.reportLabel}>{category}:</Text>
          <Text style={styles.reportValue}>{formatCurrency(data[category])}</Text>
        </View>
      ))}
    </View>
  );

  const renderSavingsRate = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Savings Rate Report</Text>
      {/* Implement savings rate report rendering logic */}
    </View>
  );

  const renderExpenseTrend = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Expense Trend Analysis</Text>
      {data.map((month) => (
        <View key={month.month} style={styles.reportRow}>
          <Text style={styles.reportLabel}>{month.month}:</Text>
          <Text style={styles.reportValue}>{formatCurrency(month.totalExpense)}</Text>
        </View>
      ))}
    </View>
  );

  const renderCashFlow = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Cash Flow Statement</Text>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Cash Inflow:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.cashInflow)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Cash Outflow:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.cashOutflow)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Net Cash Flow:</Text>
        <Text style={[styles.reportValue, data.netCashFlow < 0 ? styles.negativeValue : styles.positiveValue]}>
          {formatCurrency(data.netCashFlow)}
        </Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Credit Card Purchases:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.creditCardPurchases)}</Text>
        </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Credit Card Payments:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.creditCardPayments)}</Text>
      </View>
    </View>
  );

  const renderCategoryTransactionDetail = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Category Transaction Detail</Text>
      {ALL_CATEGORIES.map((category) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.reportSubtitle}>{category}</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.dateHeader}>Date</Text>
            <Text style={styles.amountHeader}>Amount</Text>
            <Text style={styles.descriptionHeader}>Description</Text>
            <Text style={styles.creditCardHeader}>Credit Card</Text>
          </View>
          {data[category] && data[category].map((transaction, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.dateCell}>{formatDate(transaction.date)}</Text>
              <Text style={styles.amountCell}>{formatCurrency(transaction.amount)}</Text>
              <Text style={styles.descriptionCell} numberOfLines={2} ellipsizeMode="tail">
                {transaction.description}
              </Text>
              <Text style={styles.creditCardCell}>{transaction.creditCard ? 'Yes' : 'No'}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  const renderCreditCardStatement = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Credit Card Statement</Text>
      {Object.entries(data).map(([cardName, cardData]) => (
        <View key={cardName} style={styles.creditCardSection}>
          <Text style={styles.reportSubtitle}>{cardName}</Text>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Opening Balance:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.openingBalance)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Purchases:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.purchases)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Payments:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.payments)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Income:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.income)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Closing Balance:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.closingBalance)}</Text>
          </View>
          <Text style={styles.transactionTitle}>Transactions:</Text>
          {cardData.transactions && cardData.transactions.map((transaction, index) => (
            <View key={index} style={styles.transactionRow}>
              <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  const renderCreditUtilization = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Credit Utilization Report</Text>
      {Object.entries(data).map(([cardName, cardData]) => (
        <View key={cardName} style={styles.creditCardSection}>
          <Text style={styles.reportSubtitle}>{cardName}</Text>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Credit Limit:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.limit)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Current Balance:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.currentBalance)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Available Credit:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.availableCredit)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Utilization:</Text>
            <Text style={styles.reportValue}>{cardData.utilization}%</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPaymentHistory = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Payment History Report</Text>
      {data.map((payment, index) => (
        <View key={index} style={styles.paymentRow}>
          <Text style={styles.paymentDate}>{payment.date}</Text>
          <Text style={styles.paymentCardName}>{payment.creditCardName}</Text>
          <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
        </View>
      ))}
    </View>
  );

  const renderDebtReductionProjection = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Debt Reduction Projection</Text>
      {Object.entries(data).map(([cardName, cardData]) => (
        <View key={cardName} style={styles.creditCardSection}>
          <Text style={styles.reportSubtitle}>{cardName}</Text>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Current Balance:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.currentBalance)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Avg. Monthly Payment:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.averageMonthlyPayment)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Avg. Monthly Spending:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.averageMonthlySpending)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Net Monthly Payment:</Text>
            <Text style={styles.reportValue}>{formatCurrency(cardData.netMonthlyPayment)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Months to Pay Off:</Text>
            <Text style={styles.reportValue}>{cardData.monthsToPayOff}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Projected Payoff Date:</Text>
            <Text style={styles.reportValue}>{cardData.projectedPayoffDate}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCategoryCreditCardUsage = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Category Credit Card Usage</Text>
      {Object.entries(data).map(([category, categoryData]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.reportSubtitle}>{category}</Text>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Total Amount:</Text>
            <Text style={styles.reportValue}>{formatCurrency(categoryData.totalAmount)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Transaction Count:</Text>
            <Text style={styles.reportValue}>{categoryData.transactionCount}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Avg. Transaction Amount:</Text>
            <Text style={styles.reportValue}>{formatCurrency(categoryData.averageTransactionAmount)}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Percentage of Total:</Text>
            <Text style={styles.reportValue}>{categoryData.percentageOfTotal.toFixed(2)}%</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderReportTypeModal = () => (
    <Modal
      visible={showReportTypeModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <ScrollView style={styles.modalContent}>
          {reportTypes.map((category, index) => (
            <View key={index}>
              <Text style={styles.categoryHeader}>{category.category}</Text>
              {category.reports.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setReportType(type.value);
                    setShowReportTypeModal(false);
                    setIsYTD(type.value === 'ytd-summary');
                  }}
                >
                  <Text>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Financial Reports</Text>
      
      <View style={styles.reportTypeContainer}>
        <TouchableOpacity 
          style={styles.reportTypeButton} 
          onPress={() => setShowReportTypeModal(true)}
        >
          <Text style={reportType ? styles.reportTypeText : styles.reportTypePlaceholder}>
            {reportType ? reportTypes.find(category => category.reports.some(report => report.value === reportType))?.reports.find(report => report.value === reportType)?.label : "Select a report to generate..."}
          </Text>
        </TouchableOpacity>
      </View>

      {reportType !== 'ytd-summary' && (
        <TouchableOpacity 
          style={styles.ytdButton} 
          onPress={() => setIsYTD(!isYTD)}
        >
          <Text style={styles.buttonText}>{isYTD ? 'Custom Date Range' : 'Year-to-Date'}</Text>
        </TouchableOpacity>
      )}

      {renderDateSelection()}

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode={reportType === 'monthly-summary' ? 'date' : 'date'}
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              if (reportType === 'monthly-summary') {
                setReportMonth(selectedDate);
                setStartDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                setEndDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));
              } else {
                setStartDate(selectedDate);
              }
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerateReport} disabled={isLoading || !reportType}>
        <Text style={styles.buttonText}>{isLoading ? 'Generating...' : 'Generate Report'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exportButton} onPress={handleExportReport} disabled={!reportData || isLoading}>
        <Text style={styles.buttonText}>Export to CSV</Text>
      </TouchableOpacity>

      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}

      <View style={styles.reportContainer}>
        {reportData && renderReportData()}
      </View>

      {renderReportTypeModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  reportTypeContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  reportTypeButton: {
    padding: 15,
  },
  reportTypeText: {
    color: '#333',
  },
  reportTypePlaceholder: {
    color: '#999',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reportContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 15,
    backgroundColor: '#fff',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  reportSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#444',
  },
  reportSection: {
    marginBottom: 15,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  reportLabel: {
    flex: 1,
    fontSize: 16,
    color: '#555',
  },
  reportValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  positiveValue: {
    color: 'green',
  },
  negativeValue: {
    color: 'red',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  categorySection: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateHeader: {
    flex: 3,
    fontWeight: 'bold',
  },
  amountHeader: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  descriptionHeader: {
    flex: 4,
    fontWeight: 'bold',
  },
  creditCardHeader: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dateCell: {
    flex: 3,
  },
  amountCell: {
    flex: 2,
    textAlign: 'right',
  },
  descriptionCell: {
    flex: 4,
  },
  creditCardCell: {
    flex: 2,
    textAlign: 'center',
  },
  ytdButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  creditCardSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#444',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  transactionDate: {
    flex: 2,
    color: '#555',
  },
  transactionDescription: {
    flex: 4,
    color: '#333',
  },
  transactionAmount: {
    flex: 2,
    textAlign: 'right',
    color: '#333',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  paymentDate: {
    flex: 1,
    color: '#555',
  },
  paymentCardName: {
    flex: 2,
    color: '#333',
  },
  paymentAmount: {
    flex: 1,
    textAlign: 'right',
    color: '#333',
  },
});

export default ReportsScreen;