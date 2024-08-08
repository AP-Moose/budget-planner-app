import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTransactions, deleteTransaction, addTransaction, updateTransaction } from '../services/FirebaseService';
import { getCategoryName, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import SearchBar from '../components/SearchBar';
import RNPickerSelect from 'react-native-picker-select';
import HomeDashboard from '../components/Dashboards/HomeDashboard';
import { Ionicons } from '@expo/vector-icons';

function HomeScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newTransaction, setNewTransaction] = useState({ type: 'expense', amount: '', description: '', category: '', date: new Date() });
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const listRef = useRef(null);

  const loadTransactions = useCallback(async () => {
    try {
      const fetchedTransactions = await getTransactions();
      const filteredByMonth = fetchedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth.getMonth() &&
               transactionDate.getFullYear() === currentMonth.getFullYear();
      });
      setTransactions(filteredByMonth);
      setFilteredTransactions(filteredByMonth);
      const newBalance = filteredByMonth.reduce((sum, transaction) => {
        return transaction.type === 'income' ? sum + parseFloat(transaction.amount) : sum - parseFloat(transaction.amount);
      }, 0);
      setBalance(newBalance);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
    }
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    const filtered = transactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(query.toLowerCase()) ||
        getCategoryName(transaction.category).toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [transactions]);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    try {
      await deleteTransaction(transactionId);
      Alert.alert('Success', 'Transaction deleted successfully');
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
    }
  }, [loadTransactions]);

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      await updateTransaction(editingTransaction.id, editingTransaction);
      setEditingTransaction(null);
      Alert.alert('Success', 'Transaction updated successfully');
      loadTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.category) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await addTransaction(newTransaction);
      setNewTransaction({ type: 'expense', amount: '', description: '', category: '', date: new Date(currentMonth) });
      setIsAddingTransaction(false);
      Alert.alert('Success', 'Transaction added successfully');
      loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || (editingTransaction ? editingTransaction.date : newTransaction.date);
    if (editingTransaction) {
      setEditingTransaction({ ...editingTransaction, date: currentDate });
    } else {
      setNewTransaction({ ...newTransaction, date: currentDate });
    }
  };

  const handleDoneSelectingDate = () => {
    setShowDatePicker(false);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth.setMonth(currentMonth.getMonth() + direction));
    setCurrentMonth(newDate);
    setNewTransaction(prev => ({ ...prev, date: newDate }));
  };

  const handleDoneEditing = () => {
    Keyboard.dismiss();
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.rowFront}
      onPress={() => setEditingTransaction(item)}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionCategory}>{getCategoryName(item.category)}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  ), []);

  const renderHiddenItem = useCallback(({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteTransaction(item.id)}
      >
        <Text style={styles.backTextWhite}>Delete</Text>
      </TouchableOpacity>
    </View>
  ), [handleDeleteTransaction]);

  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => navigateMonth(-1)}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.currentMonth}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth(1)}>
            <Ionicons name="chevron-forward" size={24} color="black" />
          </TouchableOpacity>
          {!isCurrentMonth && (
            <TouchableOpacity style={styles.currentMonthButton} onPress={() => setCurrentMonth(new Date())}>
              <Text style={styles.buttonText}>Return to {new Date().toLocaleString('default', { month: 'long' })}</Text>
            </TouchableOpacity>
          )}
        </View>
        <HomeDashboard currentMonth={currentMonth} transactions={transactions} />
        <Text style={styles.transactionsTitle}>{currentMonth.toLocaleString('default', { month: 'long' })} Transactions</Text>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search transactions..."
        />
        {editingTransaction ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={editingTransaction.amount.toString()}
              onChangeText={(text) => setEditingTransaction(prev => ({...prev, amount: text}))}
              keyboardType="decimal-pad"
              placeholder="Amount"
              returnKeyType="done"
              onSubmitEditing={handleDoneEditing}
            />
            <TextInput
              style={styles.input}
              value={editingTransaction.description}
              onChangeText={(text) => setEditingTransaction(prev => ({...prev, description: text}))}
              placeholder="Description"
              returnKeyType="done"
              onSubmitEditing={handleDoneEditing}
            />
            <RNPickerSelect
              onValueChange={(value) => setEditingTransaction(prev => ({...prev, category: value}))}
              items={editingTransaction.type === 'income' ? INCOME_CATEGORIES.map(cat => ({ label: cat, value: cat })) : EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
              style={pickerSelectStyles}
              value={editingTransaction.category}
              placeholder={{ label: "Select a category", value: null }}
            />
            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateButtonText}>
                  {new Date(editingTransaction.date).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editDateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.editDateButtonText}>Edit Date</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <View>
                <DateTimePicker
                  value={new Date(editingTransaction.date)}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
                <TouchableOpacity style={styles.doneDateButton} onPress={handleDoneSelectingDate}>
                  <Text style={styles.doneDateButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateTransaction}>
              <Text style={styles.buttonText}>Update Transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingTransaction(null)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : isAddingTransaction ? (
          <View style={styles.addContainer}>
            <RNPickerSelect
              onValueChange={(value) => setNewTransaction(prev => ({...prev, type: value}))}
              items={[
                { label: 'Expense', value: 'expense' },
                { label: 'Income', value: 'income' },
              ]}
              style={pickerSelectStyles}
              value={newTransaction.type}
            />
            <TextInput
              style={styles.input}
              value={newTransaction.amount}
              onChangeText={(text) => setNewTransaction(prev => ({...prev, amount: text}))}
              keyboardType="decimal-pad"
              placeholder="Amount"
              returnKeyType="done"
              onSubmitEditing={handleDoneEditing}
            />
            <TextInput
              style={styles.input}
              value={newTransaction.description}
              onChangeText={(text) => setNewTransaction(prev => ({...prev, description: text}))}
              placeholder="Description"
              returnKeyType="done"
              onSubmitEditing={handleDoneEditing}
            />
            <RNPickerSelect
              onValueChange={(value) => setNewTransaction(prev => ({...prev, category: value}))}
              items={newTransaction.type === 'income' ? INCOME_CATEGORIES.map(cat => ({ label: cat, value: cat })) : EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
              style={pickerSelectStyles}
              value={newTransaction.category}
              placeholder={{ label: "Select a category", value: null }}
            />
            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateButtonText}>
                  {newTransaction.date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editDateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.editDateButtonText}>Edit Date</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <View>
                <DateTimePicker
                  value={newTransaction.date}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
                <TouchableOpacity style={styles.doneDateButton} onPress={handleDoneSelectingDate}>
                  <Text style={styles.doneDateButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
              <Text style={styles.buttonText}>Add Transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddingTransaction(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SwipeListView
            data={filteredTransactions}
            renderItem={renderItem}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-75}
            disableRightSwipe
            keyExtractor={(item) => item.id}
            closeOnRowBeginSwipe
            initialNumToRender={10}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={50}
            windowSize={21}
          />
        )}
      </ScrollView>
      {!editingTransaction && !isAddingTransaction && (
        <TouchableOpacity 
          style={styles.floatingAddButton} 
          onPress={() => setIsAddingTransaction(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e0e0e0',
  },
  currentMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentMonthButton: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10,
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
    justifyContent: 'flex-end',
    paddingRight: 15,
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
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  editContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  addContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  updateButton: {
    backgroundColor: '#2196F3',
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
  floatingAddButton: {
    position: 'absolute',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: 'green',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  editDateButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  editDateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  doneDateButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  doneDateButtonText: {
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

export default HomeScreen;