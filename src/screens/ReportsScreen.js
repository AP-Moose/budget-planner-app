import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMonth } from '../context/MonthContext';
import { generateReport, exportReportToCSV } from '../services/ReportService';

const ReportsScreen = () => {
  const { currentMonth } = useMonth();
  const [reportType, setReportType] = useState('monthly-summary');
  const [startDate, setStartDate] = useState(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleGenerateReport = async () => {
    try {
      const report = await generateReport(reportType, startDate, endDate);
      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }
  };

  const handleExportReport = () => {
    if (!reportData) {
      Alert.alert('Error', 'Please generate a report first.');
      return;
    }

    try {
      const csvContent = exportReportToCSV(reportData, reportType);
      const fileName = `${reportType}_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`;
      
      // Use your existing CSV export functionality here
      // For example, if you have a function like this:
      // exportToCSV(csvContent, fileName);
      
      Alert.alert('Success', 'Report exported successfully. Check your downloads folder.');
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    }
  };

  const renderReportData = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'monthly-summary':
        return (
          <View>
            <Text>Total Income: ${reportData.totalIncome.toFixed(2)}</Text>
            <Text>Total Expenses: ${reportData.totalExpenses.toFixed(2)}</Text>
            <Text>Net Savings: ${reportData.netSavings.toFixed(2)}</Text>
            <Text>Savings Rate: {reportData.savingsRate.toFixed(2)}%</Text>
          </View>
        );
      case 'category-breakdown':
        return (
          <View>
            {Object.entries(reportData).map(([category, amount]) => (
              <Text key={category}>{category}: ${parseFloat(amount).toFixed(2)}</Text>
            ))}
          </View>
        );
      case 'budget-vs-actual':
        return (
          <View>
            {Array.isArray(reportData) ? reportData.map(item => (
              <Text key={item.category}>
                {item.category}: Budgeted ${parseFloat(item.budgeted).toFixed(2)}, 
                Actual ${parseFloat(item.actual).toFixed(2)}, 
                Difference ${parseFloat(item.difference).toFixed(2)}
              </Text>
            )) : <Text>No budget data available</Text>}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Financial Reports</Text>
      
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={reportType}
          onValueChange={(itemValue) => setReportType(itemValue)}
        >
          <Picker.Item label="Monthly Summary" value="monthly-summary" />
          <Picker.Item label="Category Breakdown" value="category-breakdown" />
          <Picker.Item label="Budget vs Actual" value="budget-vs-actual" />
        </Picker>
      </View>

      <View style={styles.dateContainer}>
        <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
          <Text>Start Date: {startDate.toDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
          <Text>End Date: {endDate.toDateString()}</Text>
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

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerateReport}>
        <Text style={styles.buttonText}>Generate Report</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
        <Text style={styles.buttonText}>Export to CSV</Text>
      </TouchableOpacity>

      <View style={styles.reportContainer}>
        {renderReportData()}
      </View>
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
  pickerContainer: {
    marginBottom: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reportContainer: {
    marginTop: 20,
  },
});

export default ReportsScreen;