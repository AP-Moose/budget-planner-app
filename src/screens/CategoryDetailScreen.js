import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/FirebaseService';
import { getCategoryName, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import RNPickerSelect from 'react-native-picker-select';

function CategoryDetailScreen({ route, navigation }) {
  const { category, type } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState(null);

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
    try {
      await deleteTransaction(transactionId);
      Alert.alert('Success', 'Transaction deleted successfully');
      loadCategoryTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
    }
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

  const renderItem = (data) => (
    <TouchableOpacity
      style={styles.rowFront}
      onPress={() => setEditingTransaction(data.item)}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDate}>
          {new Date(data.item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.transactionDescription}>{data.item.description}</Text>
      </View>
      <Text style={[styles.transactionAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        {type === 'income' ? '+' : '-'}${data.item.amount.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteTransaction(data.item.id)}
      >
        <Text style={styles.backTextWhite}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
      <Text style={[styles.totalAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        Total: {type === 'income' ? '+' : '-'}${totalAmount.toFixed(2)}
      </Text>
      <SwipeListView
        data={transactions}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        previewRowKey={'0'}
        previewOpenValue={-40}
        previewOpenDelay={3000}
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
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
    color: '#333',
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
    height: 80,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: 'red',
    right: 0,
  },
  backTextWhite: {
    color: '#FFF',
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
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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