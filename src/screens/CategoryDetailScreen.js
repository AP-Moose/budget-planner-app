import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Platform, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/FirebaseService';
import { getCategoryName, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';

function CategoryDetailScreen({ route, navigation }) {
  const { category, type } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const loadCategoryTransactions = useCallback(async () => {
    try {
      const allTransactions = await getTransactions();
      const categoryTransactions = allTransactions.filter(
        (transaction) => transaction.category === category && transaction.type === type
      );
      setTransactions(categoryTransactions);
      const total = categoryTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading category transactions:', error);
    }
  }, [category, type]);

  useFocusEffect(
    useCallback(() => {
      loadCategoryTransactions();
    }, [loadCategoryTransactions])
  );

  const handleDeleteTransaction = async (transactionId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              Alert.alert('Success', 'Transaction deleted successfully');
              loadCategoryTransactions();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      await updateTransaction(editingTransaction.id, editingTransaction);
      setEditingTransaction(null);
      Alert.alert('Success', 'Transaction updated successfully');
      loadCategoryTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || editingTransaction.date;
    setShowDatePicker(Platform.OS === 'ios');
    setEditingTransaction({ ...editingTransaction, date: currentDate });
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.rowFront, isEditMode ? styles.editModeItem : styles.viewModeItem]}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
      </View>
      <View style={styles.amountAndEditContainer}>
        <Text style={[styles.transactionAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
          {type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
        {isEditMode && (
          <View style={styles.editDeleteContainer}>
            <TouchableOpacity 
              onPress={() => handleEditTransaction(item)}
              style={styles.iconContainer}
            >
              <Ionicons name="pencil" size={24} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDeleteTransaction(item.id)}
              style={styles.iconContainer}
            >
              <Ionicons name="trash-outline" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
      </View>
      <Text style={[styles.totalAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        Total: {type === 'income' ? '+' : '-'}{formatCurrency(totalAmount)}
      </Text>
      <View style={styles.editModeButtonContainer}>
        <TouchableOpacity style={styles.editModeButton} onPress={toggleEditMode}>
          <Text style={styles.editModeButtonText}>{isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
      {editingTransaction && (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={editingTransaction.amount.toString()}
            onChangeText={(text) => setEditingTransaction({...editingTransaction, amount: parseFloat(text) || 0})}
            keyboardType="numeric"
            placeholder="Amount"
          />
          <TextInput
            style={styles.input}
            value={editingTransaction.description}
            onChangeText={(text) => setEditingTransaction({...editingTransaction, description: text})}
            placeholder="Description"
          />
          <RNPickerSelect
            onValueChange={(value) => setEditingTransaction({...editingTransaction, category: value})}
            items={type === 'income' ? INCOME_CATEGORIES.map(cat => ({ label: cat, value: cat })) : EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
            style={pickerSelectStyles}
            value={editingTransaction.category}
            placeholder={{ label: "Select a category", value: null }}
          />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>
              {new Date(editingTransaction.date).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(editingTransaction.date)}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateTransaction}>
            <Text style={styles.buttonText}>Update Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingTransaction(null)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editModeButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  editModeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  editModeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  rowFront: {
    backgroundColor: '#FFF',
    borderBottomColor: '#CCC',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    minHeight: 80,
  },
  editModeItem: {
    opacity: 1,
  },
  viewModeItem: {
    opacity: 0.8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  amountAndEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  editDeleteContainer: {
    flexDirection: 'row',
  },
  iconContainer: {
    padding: 10,
    marginLeft: 5,
  },
  editContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
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

export default CategoryDetailScreen;