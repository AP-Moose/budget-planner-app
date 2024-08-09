import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing/src/Sharing';
import { getTransactions } from '../services/FirebaseService';
import { Ionicons } from '@expo/vector-icons';
import { useMonth } from '../context/MonthContext';

const CSVImportExport = ({ onTransactionsUpdate }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const { currentMonth } = useMonth();

  const handleExportCSV = async (transactions) => {
    try {
      const csvContent = convertToCSV(transactions);
      const fileName = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Transactions CSV' });
      Alert.alert('Success', 'CSV exported successfully. You can now choose where to save or share the file.');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export CSV. Please try again.');
    }
  };

  const convertToCSV = (transactions) => {
    const header = 'type,amount,description,category,date\n';
    const rows = transactions.map(t => {
      const date = new Date(t.date);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return `${t.type},${t.amount},${t.description},${t.category},${formattedDate}`;
    }).join('\n');
    return header + rows;
  };

  const handleExportCurrentMonth = async () => {
    try {
      const allTransactions = await getTransactions();
      const currentMonthTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth.getMonth() &&
               transactionDate.getFullYear() === currentMonth.getFullYear();
      });
      await handleExportCSV(currentMonthTransactions);
    } catch (error) {
      console.error('Error exporting current month transactions:', error);
      Alert.alert('Error', 'Failed to export current month transactions. Please try again.');
    }
  };

  const handleExportAll = async () => {
    try {
      const allTransactions = await getTransactions();
      await handleExportCSV(allTransactions);
    } catch (error) {
      console.error('Error exporting all transactions:', error);
      Alert.alert('Error', 'Failed to export all transactions. Please try again.');
    }
  };

  const handleExportDateRange = async () => {
    if (startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date must be before or equal to end date.');
      return;
    }

    try {
      const allTransactions = await getTransactions();
      const filteredTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      await handleExportCSV(filteredTransactions);
      setDateRangeModalVisible(false);
    } catch (error) {
      console.error('Error exporting date range transactions:', error);
      Alert.alert('Error', 'Failed to export date range transactions. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Export</Text>
        <Ionicons name="document-text-outline" size={24} color="#4CAF50" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.modalButton} onPress={handleExportCurrentMonth}>
              <Ionicons name="calendar-outline" size={24} color="white" />
              <Text style={styles.modalButtonText}>Export Current Month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleExportAll}>
              <Ionicons name="albums-outline" size={24} color="white" />
              <Text style={styles.modalButtonText}>Export All Transactions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setModalVisible(false);
              setDateRangeModalVisible(true);
            }}>
              <Ionicons name="calendar-outline" size={24} color="white" />
              <Text style={styles.modalButtonText}>Export Date Range</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={dateRangeModalVisible}
        onRequestClose={() => setDateRangeModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.dateRangeTitle}>Select Date Range</Text>
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
            <TouchableOpacity style={styles.modalButton} onPress={handleExportDateRange}>
              <Text style={styles.modalButtonText}>Export Selected Range</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setDateRangeModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  buttonText: {
    color: '#4CAF50',
    marginRight: 5,
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#f44336',
    marginTop: 10,
  },
  dateRangeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
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
});

export default CSVImportExport;