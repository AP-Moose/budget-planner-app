import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Switch, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTransactions, deleteTransaction, addTransaction, updateTransaction, getCreditCards } from '../services/FirebaseService';
import { getCategoryName, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import SearchBar from '../components/SearchBar';
import RNPickerSelect from 'react-native-picker-select';
import HomeDashboard from '../components/Dashboards/HomeDashboard';
import CSVUpload from '../components/CSVUpload';
import { Ionicons } from '@expo/vector-icons';
import { useMonth } from '../context/MonthContext';
import MonthNavigator from '../components/MonthNavigator';  // Import the MonthNavigator component

function HomeScreen({ navigation }) {
  const { currentMonth, setCurrentMonth } = useMonth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newTransaction, setNewTransaction] = useState({ 
    type: 'expense', 
    amount: '', 
    description: '', 
    category: '', 
    date: new Date(), 
    creditCard: false,
    creditCardId: null,
    isCardPayment: false
  });
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [creditCards, setCreditCards] = useState([]);
  const listRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Credit card-related functions
  const toggleCreditCard = () => {
    setNewTransaction(prev => ({ ...prev, creditCard: !prev.creditCard }));
  };

  const handleCreditCardSelection = (creditCardId) => {
    setNewTransaction(prev => ({ ...prev, creditCardId }));
  };

  const toggleIsCardPayment = () => {
    setNewTransaction(prev => ({ ...prev, isCardPayment: !prev.isCardPayment }));
  };

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

  const loadCreditCards = useCallback(async () => {
    try {
      const cards = await getCreditCards();
      setCreditCards(cards);
    } catch (error) {
      console.error('Error loading credit cards:', error);
      Alert.alert('Error', 'Failed to load credit cards. Please try again.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      loadCreditCards();
    }, [loadTransactions, loadCreditCards])
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
              loadTransactions();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
            }
          }
        }
      ]
    );
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
      setNewTransaction({ 
        type: 'expense', 
        amount: '', 
        description: '', 
        category: '', 
        date: new Date(currentMonth), 
        creditCard: false,
        creditCardId: null,
        isCardPayment: false
      });
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

  const handleDoneEditing = () => {
    Keyboard.dismiss();
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
  };

  const renderItem = useCallback(({ item }) => {
    const creditCard = creditCards.find(card => card.id === item.creditCardId);
    let creditCardInfo = '';
    if (item.creditCard) {
      creditCardInfo = item.isCardPayment
        ? `Card Payment: ${creditCard?.name || 'Unknown'}`
        : `Credit Card: ${creditCard?.name || 'Unknown'}`;
    }

    return (
      <View style={[styles.rowFront, isEditMode ? styles.editModeItem : styles.viewModeItem]}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionCategory}>{getCategoryName(item.category)}</Text>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
          {item.creditCard && (
            <Text style={styles.creditCardIndicator}>{creditCardInfo}</Text>
          )}
        </View>
        <View style={styles.amountAndEditContainer}>
          <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
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
  }, [creditCards, isEditMode, handleDeleteTransaction, handleEditTransaction]);

  const renderAddTransactionForm = () => (
    <View style={styles.addTransactionForm}>
      <View style={styles.switchContainer}>
        <Text>Credit Card Transaction:</Text>
        <Switch
          value={newTransaction.creditCard}
          onValueChange={toggleCreditCard}
        />
      </View>
      {newTransaction.creditCard && (
        <>
          <RNPickerSelect
            onValueChange={handleCreditCardSelection}
            items={creditCards.map(card => ({ label: card.name, value: card.id }))}
            style={pickerSelectStyles}
            value={newTransaction.creditCardId}
            placeholder={{ label: "Select a credit card", value: null }}
          />
          <View style={styles.switchContainer}>
            <Text>Is Card Payment:</Text>
            <Switch
              value={newTransaction.isCardPayment}
              onValueChange={toggleIsCardPayment}
            />
          </View>
        </>
      )}
      <TextInput
        style={styles.input}
        value={newTransaction.amount}
        onChangeText={(text) => setNewTransaction(prev => ({...prev, amount: text}))}
        keyboardType="decimal-pad"
        placeholder="Amount"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        value={newTransaction.description}
        onChangeText={(text) => setNewTransaction(prev => ({...prev, description: text}))}
        placeholder="Description"
        placeholderTextColor="#999"
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
            {new Date(newTransaction.date).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={new Date(newTransaction.date)}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
        <Text style={styles.buttonText}>Add Transaction</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddingTransaction(false)}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <HomeDashboard currentMonth={currentMonth} transactions={transactions} />
        <MonthNavigator currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
        <CSVUpload onTransactionsUpdate={loadTransactions} />
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>{currentMonth.toLocaleString('default', { month: 'long' })} Transactions</Text>
          <TouchableOpacity style={styles.editModeButton} onPress={toggleEditMode}>
            <Text style={styles.editModeButtonText}>{isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}</Text>
          </TouchableOpacity>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search transactions..."
          placeholderTextColor="#999"
        />
        <View style={styles.transactionsContainer}>
          {editingTransaction && (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={editingTransaction.amount.toString()}
                onChangeText={(text) => setEditingTransaction(prev => ({...prev, amount: text}))}
                keyboardType="decimal-pad"
                placeholder="Amount"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                value={editingTransaction.description}
                onChangeText={(text) => setEditingTransaction(prev => ({...prev, description: text}))}
                placeholder="Description"
                placeholderTextColor="#999"
              />
              {!editingTransaction.creditCard && (
                <RNPickerSelect
                  onValueChange={(value) => setEditingTransaction(prev => ({...prev, category: value}))}
                  items={editingTransaction.type === 'income' ? INCOME_CATEGORIES.map(cat => ({ label: cat, value: cat })) : EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
                  style={pickerSelectStyles}
                  value={editingTransaction.category}
                  placeholder={{ label: "Select a category", value: null }}
                />
              )}
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
          <FlatList
            data={filteredTransactions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            initialNumToRender={10}
            maxToRenderPerBatch={20}
            windowSize={21}
          />
        </View>
      </ScrollView>
      {isAddingTransaction ? (
        renderAddTransactionForm()
      ) : (
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
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10,
    marginBottom: 5,
  },
  editModeButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
  },
  editModeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  transactionsContainer: {
    flex: 1,
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
  amountAndEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  editDeleteContainer: {
    flexDirection: 'row',
  },
  iconContainer: {
    padding: 10,
    marginLeft: 5,
  },
  editContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
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
    opacity: .90
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
  creditCardIndicator: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  addTransactionForm: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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