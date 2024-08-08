import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing/src/Sharing';
import { getTransactions, addTransaction } from '../services/FirebaseService';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import { Ionicons } from '@expo/vector-icons';

const CSVImportExport = ({ onTransactionsUpdate }) => {
  const handleExportCSV = async () => {
    try {
      const transactions = await getTransactions();
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

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
      if (result.type === 'success') {
        const fileContent = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.UTF8 });
        const transactions = parseCSV(fileContent);
        for (const transaction of transactions) {
          await addTransaction(transaction);
        }
        Alert.alert('Success', `CSV imported successfully. ${transactions.length} transactions added.`);
        onTransactionsUpdate(); // Trigger a refresh of transactions in the parent component
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      Alert.alert('Error', `Failed to import CSV: ${error.message}`);
    }
  };

  const parseCSV = (csvContent) => {
    const rows = csvContent.split('\n').slice(1); // Skip header
    return rows.filter(row => row.trim() !== '').map(row => {
      const [type, amount, description, category, date] = row.split(',');
      if (!type || !amount || !description || !category || !date) {
        throw new Error(`Invalid row format: ${row}`);
      }
      if (!INCOME_CATEGORIES.includes(category.trim()) && !EXPENSE_CATEGORIES.includes(category.trim())) {
        throw new Error(`Invalid category: ${category}. Please use one of the predefined categories.`);
      }
      return { 
        type: type.trim(), 
        amount: parseFloat(amount.trim()), 
        description: description.trim(), 
        category: category.trim(), 
        date: new Date(date.trim())
      };
    });
  };

  const shareTemplate = async () => {
    const templateContent = `type,amount,description,category,date
income,1000,Monthly compensation,Salary,2024-01-01
expense,50,Weekly grocery run,Food,2024-01-02
income,200,Freelance project payment,Other Income,2024-01-03
expense,30,Monthly subscription fee,Entertainment,2024-01-04
expense,100,Utility bill payment,Utilities,2024-01-05
`;
    const fileName = 'budget_planner_template.csv';
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, templateContent, { encoding: FileSystem.EncodingType.UTF8 });
    
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Budget Planner CSV Template' });
  };

  const showInstructions = () => {
    Alert.alert(
      'CSV Import Instructions',
      '1. Download the template by tapping "Get Template".\n' +
      '2. Fill in your transactions in the template.\n' +
      '3. Use exact category names as listed in the Category Key.\n' +
      '4. If using Google Sheets, go to File > Download > Comma-separated values (.csv).\n' +
      '5. If using Excel, go to File > Save As > CSV (Comma delimited).\n' +
      '6. Tap "Import CSV" and select your filled CSV file.\n' +
      '\nFormat: type, amount, description, category, date (YYYY-MM-DD)\n' +
      '\nTo view the full category list, tap "Category Key".'
    );
  };

  const showCategories = () => {
    const categoryText = 'Income Categories:\n' + INCOME_CATEGORIES.join(', ') + '\n\n' +
                         'Expense Categories:\n' + EXPENSE_CATEGORIES.join(', ');
    Alert.alert(
      'Category Key',
      categoryText,
      [
        { text: 'OK', onPress: () => console.log('OK Pressed') },
        { text: 'Share', onPress: () => shareCategoryList(categoryText) }
      ]
    );
  };

  const shareCategoryList = async (categoryText) => {
    try {
      const fileName = 'budget_planner_categories.txt';
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, categoryText, { encoding: FileSystem.EncodingType.UTF8 });
      
      await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: 'Share Category List' });
    } catch (error) {
      console.error('Error sharing category list:', error);
      Alert.alert('Error', 'Failed to share category list. Please try again.');
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={handleExportCSV}>
          <Ionicons name="cloud-download-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleImportCSV}>
          <Ionicons name="cloud-upload-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Import CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={shareTemplate}>
          <Ionicons name="document-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Get Template</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={showInstructions}>
          <Ionicons name="information-circle-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Instructions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={showCategories}>
          <Ionicons name="list-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Category Key</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    flexWrap: 'wrap',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  buttonText: {
    color: 'white',
    marginLeft: 5,
  },
});

export default CSVImportExport;