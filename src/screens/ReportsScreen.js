import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMonth } from '../context/MonthContext';
import { generateReport, exportReportToCSV } from '../services/ReportService';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';

const ReportsScreen = () => {
  const { currentMonth } = useMonth();
  const [reportType, setReportType] = useState('monthly-summary');
  const [startDate, setStartDate] = useState(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);
  const [isYTD, setIsYTD] = useState(false);

  const reportTypes = [
    { label: 'Monthly Income vs Expense Summary', value: 'monthly-summary' },
    { label: 'Category-wise Expense Breakdown', value: 'category-breakdown' },
    { label: 'Budget vs Actual Spending Comparison', value: 'budget-vs-actual' },
    { label: 'Income Sources Analysis', value: 'income-sources' },
    { label: 'Savings Rate Report', value: 'savings-rate' },
    { label: 'Year-to-Date Financial Summary', value: 'ytd-summary' },
    { label: 'Expense Trend Analysis', value: 'expense-trend' },
    { label: 'Cash Flow Statement', value: 'cash-flow' },
    { label: 'Custom Date Range Report', value: 'custom-range' },
    { label: 'Category Transaction Detail', value: 'category-transaction-detail' },
  ];

  useEffect(() => {
    updateDateRange();
  }, [reportType, currentMonth, isYTD]);

  const updateDateRange = () => {
    const now = new Date();
    if (isYTD || reportType === 'ytd-summary') {
      setStartDate(new Date(now.getFullYear(), 0, 1));
      setEndDate(now);
    } else if (reportType === 'monthly-summary') {
      setStartDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
      setEndDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
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

  const renderReportData = () => {
    if (!reportData) return null;

    console.log('Rendering report data:', JSON.stringify(reportData, null, 2));

    try {
      switch (reportType) {
        case 'monthly-summary':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>Monthly Summary</Text>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Total Income:</Text>
                <Text style={styles.reportValue}>${reportData.totalIncome?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Total Expenses:</Text>
                <Text style={styles.reportValue}>${reportData.totalExpenses?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Net Savings:</Text>
                <Text style={styles.reportValue}>${reportData.netSavings?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Savings Rate:</Text>
                <Text style={styles.reportValue}>{reportData.savingsRate?.toFixed(2) || '0.00'}%</Text>
              </View>
            </View>
          );
        case 'category-breakdown':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>Category Breakdown</Text>
              {EXPENSE_CATEGORIES.map((category) => (
                <View key={category} style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{category}:</Text>
                  <Text style={styles.reportValue}>${(reportData[category] || 0).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          );
        case 'budget-vs-actual':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>Budget vs Actual</Text>
              {reportData.length > 0 ? reportData.map((item) => (
                <View key={item.category} style={styles.reportSection}>
                  <Text style={styles.reportSubtitle}>{item.category}</Text>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Budgeted:</Text>
                    <Text style={styles.reportValue}>${parseFloat(item.budgeted).toFixed(2)}</Text>
                  </View>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Actual:</Text>
                    <Text style={styles.reportValue}>${parseFloat(item.actual).toFixed(2)}</Text>
                  </View>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Difference:</Text>
                    <Text style={[styles.reportValue, item.difference < 0 ? styles.negativeValue : styles.positiveValue]}>
                      ${parseFloat(item.difference).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )) : <Text style={styles.reportItem}>No budget data available</Text>}
            </View>
          );
        case 'income-sources':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>Income Sources</Text>
              {INCOME_CATEGORIES.map((category) => (
                <View key={category} style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{category}:</Text>
                  <Text style={styles.reportValue}>${(reportData[category] || 0).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          );
        case 'savings-rate':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>Savings Rate Report</Text>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Total Income:</Text>
                <Text style={styles.reportValue}>${reportData.totalIncome?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Total Expenses:</Text>
                <Text style={styles.reportValue}>${reportData.totalExpenses?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Net Savings:</Text>
                <Text style={styles.reportValue}>${reportData.netSavings?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Savings Rate:</Text>
                <Text style={styles.reportValue}>{reportData.savingsRate?.toFixed(2) || '0.00'}%</Text>
              </View>
            </View>
          );
        case 'ytd-summary':
        case 'custom-range':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>{reportType === 'ytd-summary' ? 'Year-to-Date Summary' : 'Custom Range Summary'}</Text>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Total Income:</Text>
                <Text style={styles.reportValue}>${reportData.totalIncome?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Total Expenses:</Text>
                <Text style={styles.reportValue}>${reportData.totalExpenses?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Net Savings:</Text>
                <Text style={styles.reportValue}>${reportData.netSavings?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Savings Rate:</Text>
                <Text style={styles.reportValue}>{reportData.savingsRate?.toFixed(2) || '0.00'}%</Text>
              </View>
              <Text style={styles.reportSubtitle}>Top Expense Categories:</Text>
              {reportData.topExpenses.map((expense, index) => (
                <View key={index} style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{expense.category}:</Text>
                  <Text style={styles.reportValue}>${expense.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          );
        case 'expense-trend':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>Expense Trend Analysis</Text>
              {reportData.map((month) => (
                <View key={month.month} style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{month.month}:</Text>
                  <Text style={styles.reportValue}>${month.totalExpense.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          );
        case 'cash-flow':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>Cash Flow Statement</Text>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Cash Inflow:</Text>
                <Text style={styles.reportValue}>${reportData.cashInflow?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Cash Outflow:</Text>
                <Text style={styles.reportValue}>${reportData.cashOutflow?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Net Cash Flow:</Text>
                <Text style={[styles.reportValue, reportData.netCashFlow < 0 ? styles.negativeValue : styles.positiveValue]}>
                  ${reportData.netCashFlow?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          );
        case 'category-transaction-detail':
          return (
            <View style={styles.reportContainer}>
              <Text style={styles.reportTitle}>Category Transaction Detail</Text>
              {ALL_CATEGORIES.map((category) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.reportSubtitle}>{category}</Text>
                  <View style={styles.tableHeader}>
                    <Text style={styles.dateHeader}>Date</Text>
                    <Text style={styles.amountHeader}>Amount</Text>
                    <Text style={styles.descriptionHeader}>Description</Text>
                  </View>
                  {reportData[category].map((transaction, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.dateCell}>{formatDate(transaction.date)}</Text>
                      <Text style={styles.amountCell}>${transaction.amount.toFixed(2)}</Text>
                      <Text style={styles.descriptionCell} numberOfLines={2}
                      ellipsizeMode="tail">
                      {transaction.description}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      default:
        return <Text style={styles.reportItem}>Unknown report type</Text>;
    }
  } catch (error) {
    console.error('Error rendering report data:', error);
    return <Text style={styles.reportItem}>Error rendering report data: {error.message}</Text>;
  }
};

const renderReportTypeModal = () => (
  <Modal
    visible={showReportTypeModal}
    transparent={true}
    animationType="slide"
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {reportTypes.map((type) => (
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
        <Text>{reportTypes.find(type => type.value === reportType)?.label}</Text>
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

    <TouchableOpacity style={styles.generateButton} onPress={handleGenerateReport} disabled={isLoading}>
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
},
title: {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 20,
},
reportTypeContainer: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  marginBottom: 20,
},
reportTypeButton: {
  padding: 15,
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
},
reportTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 15,
},
reportSubtitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginTop: 10,
  marginBottom: 5,
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
},
reportValue: {
  fontSize: 16,
  fontWeight: 'bold',
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
  flex: 3,
  fontWeight: 'bold',
  textAlign: 'right',
  paddingRight: 20,
},
descriptionHeader: {
  flex: 4,
  fontWeight: 'bold',
},
dateCell: {
  flex: 3,
  paddingRight: 0,
},
amountCell: {
  flex: 3,
  textAlign: 'right',
  paddingRight: 20,
},
descriptionCell: {
  flex: 4,
},
ytdButton: {
  backgroundColor: '#4CAF50',
  padding: 10,
  borderRadius: 5,
  alignItems: 'center',
  marginBottom: 10,
},
});

export default ReportsScreen;