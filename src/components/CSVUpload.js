import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, TextInput, Modal, TouchableOpacity, ScrollView } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import { addTransaction, getTransactions, getCreditCards, addCreditCard } from '../services/FirebaseService';
import { ALL_CATEGORIES } from '../utils/categories';

const CSVUpload = ({ onTransactionsUpdate }) => {
  const [importStatus, setImportStatus] = useState('');
  const [csvText, setCsvText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleManualImport = () => {
    console.log('Starting manual CSV import');
    processCSVData(csvText);
  };

  const processCSVData = (data) => {
    console.log('Processing CSV data');
    Papa.parse(data, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        console.log('CSV Parsing complete:', results);
        try {
          const validData = await validateAndPrepareCSVData(results.data);
          console.log('Valid data:', validData);
          if (validData.length > 0) {
            await importTransactions(validData);
            setImportStatus('Import successful!');
            setCsvText('');  // Clear the input after successful import
            onTransactionsUpdate();
            Alert.alert('Success', `Successfully imported ${validData.length} transactions.`);
          } else {
            setImportStatus('No valid data to import.');
            Alert.alert('Import Failed', 'No valid data found in the CSV. Please check the file format.');
          }
        } catch (error) {
          console.error('Error processing CSV data:', error);
          setImportStatus('Error processing CSV data.');
          Alert.alert('Error', `Failed to process CSV data: ${error.message}`);
        }
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        setImportStatus('Error parsing CSV file.');
        Alert.alert('Error', 'Failed to parse CSV file. Please check the file format.');
      }
    });
  };

  const validateAndPrepareCSVData = async (data) => {
    console.log('Validating and preparing CSV data');
    const creditCards = await getCreditCards();
    const creditCardMap = new Map(creditCards.map(card => [card.name.toLowerCase(), card.id]));

    return (await Promise.all(data.map(async (row, index) => {
      console.log(`Processing row ${index}:`, row);
      if (
        row.amount && !isNaN(parseFloat(row.amount)) &&
        row.category && ALL_CATEGORIES.includes(row.category) &&
        row.date && !isNaN(Date.parse(row.date)) &&
        row.description &&
        row.type && ['expense', 'income'].includes(row.type.toLowerCase())
      ) {
        let creditCard = row.creditCard?.toLowerCase() === 'yes';
        let creditCardId = null;
        let isCardPayment = row.isCardPayment?.toLowerCase() === 'yes';

        if (creditCard && row.creditCardName) {
          const cardName = row.creditCardName.toLowerCase();
          if (creditCardMap.has(cardName)) {
            creditCardId = creditCardMap.get(cardName);
          } else {
            // Add new credit card
            try {
              const newCardId = await addCreditCard({
                name: row.creditCardName,
                limit: 0,  // Default values, update as needed
                startingBalance: 0
              });
              creditCardMap.set(cardName, newCardId);
              creditCardId = newCardId;
            } catch (error) {
              console.error(`Error adding new credit card ${row.creditCardName}:`, error);
              throw new Error(`Failed to add new credit card ${row.creditCardName}: ${error.message}`);
            }
          }
        }

        return {
          amount: parseFloat(row.amount),
          category: row.category,
          date: new Date(row.date),
          description: row.description,
          type: row.type.toLowerCase(),
          creditCard,
          creditCardId,
          isCardPayment
        };
      }
      console.log(`Invalid row ${index}:`, row);
      return null;
    }))).filter(row => row !== null);
  };

  const importTransactions = async (transactions) => {
    console.log('Importing transactions');
    try {
      let successCount = 0;
      let failCount = 0;

      for (const transaction of transactions) {
        try {
          console.log('Attempting to add transaction:', JSON.stringify(transaction));
          await addTransaction(transaction);
          console.log('Transaction added successfully');
          successCount++;
        } catch (error) {
          console.error('Error adding transaction:', error);
          console.error('Transaction that failed:', JSON.stringify(transaction));
          failCount++;
        }
      }

      console.log(`Import complete. ${successCount} added, ${failCount} failed.`);
      setImportStatus(`Import complete. ${successCount} added, ${failCount} failed.`);
      onTransactionsUpdate();
    } catch (error) {
      console.error('Error importing transactions:', error);
      setImportStatus('Error importing transactions. Please try again.');
      Alert.alert('Error', `Failed to import transactions: ${error.message}`);
    }
  };
  
  const exportTransactions = async () => {
    try {
      const transactions = await getTransactions();
      const csv = Papa.unparse(transactions);
      const csvUri = FileSystem.documentDirectory + 'transactions.csv';
      await FileSystem.writeAsStringAsync(csvUri, csv);
      await Sharing.shareAsync(csvUri);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      Alert.alert('Error', 'Failed to export transactions. Please try again.');
    }
  };

  const exportSampleCSV = async () => {
    const sampleData = [
      { amount: '1000', category: 'Salary', date: '2023-08-01', description: 'Monthly salary', type: 'income', creditCard: 'No', creditCardName: '', isCardPayment: 'No' },
      { amount: '50', category: 'Groceries', date: '2023-08-02', description: 'Weekly groceries', type: 'expense', creditCard: 'Yes', creditCardName: 'Apple Card', isCardPayment: 'No' },
      { amount: '30', category: 'Dining Out/Takeaway', date: '2023-08-03', description: 'Lunch with colleagues', type: 'expense', creditCard: 'No', creditCardName: '', isCardPayment: 'No' },
      { amount: '500', category: 'Debt Payment', date: '2023-08-05', description: 'Credit card payment', type: 'expense', creditCard: 'Yes', creditCardName: 'Apple Card', isCardPayment: 'Yes' },
    ];

    const csv = Papa.unparse(sampleData);
    const csvUri = FileSystem.documentDirectory + 'sample_transactions.csv';

    try {
      await FileSystem.writeAsStringAsync(csvUri, csv);
      await Sharing.shareAsync(csvUri);
    } catch (error) {
      console.error('Error exporting sample CSV:', error);
      Alert.alert('Error', 'Failed to export sample CSV. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.buttonText}>Import CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={exportTransactions}>
          <Text style={styles.buttonText}>Export Transactions</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalView}>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalTitle}>Import CSV</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={6}
              onChangeText={setCsvText}
              value={csvText}
              placeholder="Paste CSV here..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.button} onPress={handleManualImport}>
              <Text style={styles.buttonText}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={exportSampleCSV}>
              <Text style={styles.buttonText}>Export Sample CSV</Text>
            </TouchableOpacity>
            <Text style={styles.instructionsTitle}>Instructions:</Text>
            <Text style={styles.instructions}>
              1. Ensure your CSV file has these columns:{'\n'}
                 amount, category, date, description, type, creditCard, creditCardName, isCardPayment{'\n\n'}
              2. Valid categories are:{'\n'}
                 {ALL_CATEGORIES.join(', ')}{'\n\n'}
              3. Date should be in YYYY-MM-DD format{'\n\n'}
              4. Type should be either 'income' or 'expense'{'\n\n'}
              5. Credit Card should be 'Yes' or 'No' (or left blank for 'No'){'\n\n'}
              6. CreditCardName should be the name of the credit card (if Credit Card is 'Yes'){'\n\n'}
              7. IsCardPayment should be 'Yes' for credit card payments, 'No' otherwise{'\n\n'}
              8. Avoid using commas in description{'\n\n'}
              9. Export a sample CSV to see the correct format
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  modalView: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalScrollView: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 120,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    width: '100%',
    textAlignVertical: 'top',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  closeButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
});

export default CSVUpload;