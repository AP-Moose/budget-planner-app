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
  ];

  useEffect(() => {
    if (reportType === 'ytd-summary') {
      setStartDate(new Date(currentMonth.getFullYear(), 0, 1));
      setEndDate(new Date(currentMonth.getFullYear(), 11, 31));
    } else if (reportType === 'expense-trend') {
      const sixMonthsAgo = new Date(currentMonth);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      setStartDate(new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1));
      setEndDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
    }
  }, [reportType, currentMonth]);

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

  const renderReportData = () => {
    if (!reportData) return null;

    console.log('Rendering report data:', JSON.stringify(reportData, null, 2));

    try {
      switch (reportType) {
        case 'monthly-summary':
          return (
            <View>
              <Text style={styles.reportItem}>Total Income: ${reportData.totalIncome?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Total Expenses: ${reportData.totalExpenses?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Net Savings: ${reportData.netSavings?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Savings Rate: {reportData.savingsRate?.toFixed(2) || '0.00'}%</Text>
            </View>
          );
        case 'category-breakdown':
          return (
            <View>
              {EXPENSE_CATEGORIES.map((category) => (
                <Text key={category} style={styles.reportItem}>
                  {category}: ${(reportData[category] || 0).toFixed(2)}
                </Text>
              ))}
            </View>
          );
        case 'budget-vs-actual':
          return (
            <View>
              {reportData.length > 0 ? reportData.map((item) => (
                <Text key={item.category} style={styles.reportItem}>
                  {item.category}: Budgeted ${parseFloat(item.budgeted).toFixed(2)}, 
                  Actual ${parseFloat(item.actual).toFixed(2)}, 
                  Difference ${parseFloat(item.difference).toFixed(2)}
                </Text>
              )) : <Text style={styles.reportItem}>No budget data available</Text>}
            </View>
          );
        case 'income-sources':
          return (
            <View>
              {INCOME_CATEGORIES.map((category) => (
                <Text key={category} style={styles.reportItem}>
                  {category}: ${(reportData[category] || 0).toFixed(2)}
                </Text>
              ))}
            </View>
          );
        case 'savings-rate':
          return (
            <View>
              <Text style={styles.reportItem}>Total Income: ${reportData.totalIncome?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Total Expenses: ${reportData.totalExpenses?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Net Savings: ${reportData.netSavings?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Savings Rate: {reportData.savingsRate?.toFixed(2) || '0.00'}%</Text>
            </View>
          );
        case 'ytd-summary':
        case 'custom-range':
          return (
            <View>
              <Text style={styles.reportItem}>Total Income: ${reportData.totalIncome?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Total Expenses: ${reportData.totalExpenses?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Net Savings: ${reportData.netSavings?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Savings Rate: {reportData.savingsRate?.toFixed(2) || '0.00'}%</Text>
              <Text style={styles.reportItem}>Top Expense Categories:</Text>
              {reportData.topExpenses.map((expense, index) => (
                <Text key={index} style={styles.reportItem}>
                  {expense.category}: ${expense.amount.toFixed(2)}
                </Text>
              ))}
            </View>
          );
        case 'expense-trend':
          return (
            <View>
              {reportData.map((month) => (
                <Text key={month.month} style={styles.reportItem}>
                  {month.month}: ${month.totalExpense.toFixed(2)}
                </Text>
              ))}
            </View>
          );
        case 'cash-flow':
          return (
            <View>
              <Text style={styles.reportItem}>Cash Inflow: ${reportData.cashInflow?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Cash Outflow: ${reportData.cashOutflow?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.reportItem}>Net Cash Flow: ${reportData.netCashFlow?.toFixed(2) || '0.00'}</Text>
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

      <View style={styles.dateContainer}>
        <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
          <Text>Start: {startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateButton}>
          <Text>End: {endDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
      </View>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) setStartDate(selectedDate);
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
  },
  reportItem: {
    fontSize: 16,
    marginBottom: 10,
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
});

export default ReportsScreen;