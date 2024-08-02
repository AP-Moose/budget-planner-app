import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { addTransaction } from '../services/FirebaseService';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';

function AddTransactionScreen({ navigation, route }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const transactionType = route.params?.type || 'expense';

  const categories = transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!amount || !description || !category) {
      Alert.alert('Invalid Input', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const transaction = {
      amount: parseFloat(amount),
      description,
      category,
      type: transactionType,
      date: new Date().toISOString(),
    };

    try {
      await addTransaction(transaction);
      Alert.alert(
        'Success',
        'Transaction added successfully',
        [{ text: 'OK', onPress: () => navigation.navigate('HomeScreen', { refresh: true }) }],
        { onDismiss: () => navigation.navigate('HomeScreen', { refresh: true }) }
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}</Text>
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
      <TouchableOpacity 
        style={[styles.button, isSubmitting && styles.disabledButton]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Adding...' : 'Add Transaction'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default AddTransactionScreen;