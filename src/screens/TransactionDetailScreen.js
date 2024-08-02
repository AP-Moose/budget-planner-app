import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { updateTransaction, deleteTransaction } from '../services/FirebaseService';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, getCategoryType } from '../utils/categories';

function TransactionDetailScreen({ route, navigation }) {
  const { transaction } = route.params;
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState(transaction.category);

  const categories = getCategoryType(transaction.category) === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function handleUpdate() {
    if (!amount || !description || !category) {
      Alert.alert('Invalid Input', 'Please fill in all fields');
      return;
    }

    try {
      await updateTransaction(transaction.id, { 
        amount: parseFloat(amount), 
        description, 
        category,
        type: getCategoryType(category),
        date: transaction.date
      });
      Alert.alert(
        'Success',
        'Transaction updated successfully',
        [{ text: 'OK', onPress: () => navigation.navigate('HomeScreen', { refresh: true }) }],
        { onDismiss: () => navigation.navigate('HomeScreen', { refresh: true }) }
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              Alert.alert(
                'Success',
                'Transaction deleted successfully',
                [{ text: 'OK', onPress: () => navigation.navigate('HomeScreen', { refresh: true }) }],
                { onDismiss: () => navigation.navigate('HomeScreen', { refresh: true }) }
              );
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
            }
          }
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Transaction</Text>
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <RNPickerSelect
        onValueChange={(value) => setCategory(value)}
        items={categories.map(cat => ({ label: cat, value: cat }))}
        style={pickerSelectStyles}
        value={category}
        placeholder={{ label: "Select a category", value: null }}
      />
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Update Transaction</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.buttonText}>Delete Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

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
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
});

export default TransactionDetailScreen;