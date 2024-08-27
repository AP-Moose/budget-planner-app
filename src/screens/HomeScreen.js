import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Switch, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getTransactions, deleteTransaction, addTransaction, updateTransaction, getCreditCards, getLoans } from '../services/FirebaseService';
import { getCategoryName, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import SearchBar from '../components/SearchBar';
import HomeDashboard from '../components/Dashboards/HomeDashboard';
import CSVUpload from '../components/CSVUpload';
import { Ionicons } from '@expo/vector-icons';
import { useMonth } from '../context/MonthContext';
import MonthNavigator from '../components/MonthNavigator';

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
    isCardPayment: false,
    isLoanPayment: false,
    loanId: null,
    isCashback: false
  });
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [creditCards, setCreditCards] = useState([]);
  const [loans, setLoans] = useState([]);
  const listRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);

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
      const newBalance = filteredByMonth.reduce((balance, t) => {
        return t.type === 'income' ? balance + parseFloat(t.amount) : balance - parseFloat(t.amount);
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

  const loadLoans = useCallback(async () => {
    try {
      const fetchedLoans = await getLoans();
      setLoans(fetchedLoans);
    } catch (error) {
      console.error('Error loading loans:', error);
      Alert.alert('Error', 'Failed to load loans. Please try again.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      loadCreditCards();
      loadLoans();
    }, [loadTransactions, loadCreditCards, loadLoans])
  );

  useEffect(() => {
    console.log('Loans:', loans);
  }, [loans]);

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
        isCardPayment: false,
        isLoanPayment: false,
        loanId: null,
        isCashback: false
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

  const toggleCreditCard = () => {
    setNewTransaction(prev => ({ 
      ...prev, 
      creditCard: !prev.creditCard,
      isLoanPayment: false,
      isCashback: false 
    }));
  };

  const handleCreditCardSelection = (creditCardId) => {
    setNewTransaction(prev => ({ ...prev, creditCardId }));
  };

  const toggleIsCardPayment = () => {
    setNewTransaction(prev => ({ ...prev, isCardPayment: !prev.isCardPayment }));
  };

  const toggleIsLoanPayment = () => {
    setNewTransaction(prev => ({ 
      ...prev, 
      isLoanPayment: !prev.isLoanPayment, 
      creditCard: false,
      isCashback: false 
    }));
  };

  const handleLoanSelection = (loanId) => {
    setNewTransaction(prev => ({ ...prev, loanId }));
  };

  const toggleIsCashback = () => {
    setNewTransaction(prev => ({ 
      ...prev, 
      isCashback: !prev.isCashback, 
      type: 'income',
      creditCard: false,
      isLoanPayment: false 
    }));
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
          {item.isLoanPayment && (
            <Text style={styles.loanIndicator}>Loan Payment</Text>
          )}
          {item.isCashback && (
            <Text style={styles.cashbackIndicator}>Cashback/Reward</Text>
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
          disabled={newTransaction.isLoanPayment || newTransaction.isCashback}
        />
      </View>
      {newTransaction.creditCard && (
        <>
          <Picker
            selectedValue={newTransaction.creditCardId}
            onValueChange={handleCreditCardSelection}
            style={styles.picker}
          >
            <Picker.Item label="Select a credit card" value="" />
            {creditCards.map(card => (
              <Picker.Item key={card.id} label={card.name} value={card.id} />
            ))}
          </Picker>
          <View style={styles.switchContainer}>
            <Text>Is Card Payment:</Text>
            <Switch
              value={newTransaction.isCardPayment}
              onValueChange={toggleIsCardPayment}
            />
          </View>
        </>
      )}
      <View style={styles.switchContainer}>
        <Text>Loan Payment:</Text>
        <Switch
          value={newTransaction.isLoanPayment}
          onValueChange={toggleIsLoanPayment}
          disabled={newTransaction.creditCard || newTransaction.isCashback}
        />
      </View>
      {newTransaction.isLoanPayment && (
        <Picker
          selectedValue={newTransaction.loanId}
          onValueChange={handleLoanSelection}
          style={styles.picker}
        >
          <Picker.Item label="Select a loan" value="" />
          {loans.map(loan => (
            <Picker.Item key={loan.id} label={loan.name} value={loan.id} />
          ))}
        </Picker>
      )}
      <View style={styles.switchContainer}>
        <Text>Cashback/Rewards:</Text>
        <Switch
          value={newTransaction.isCashback}
          onValueChange={toggleIsCashback}
          disabled={newTransaction.creditCard || newTransaction.isLoanPayment}
        />
      </View>
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
      <Picker
        selectedValue={newTransaction.category}
        onValueChange={(value) => setNewTransaction(prev => ({...prev, category: value}))}
        style={styles.picker}
      >
        <Picker.Item label="Select a category" value="" />
        {(newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
          <Picker.Item key={category} label={category} value={category} />
        ))}
      </Picker>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateButtonText}>
          {new Date(newTransaction.date).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
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
              />
              <TextInput
                style={styles.input}
                value={editingTransaction.description}
                onChangeText={(text) => setEditingTransaction(prev => ({...prev, description: text}))}
                placeholder="Description"
              />
              <Picker
                selectedValue={editingTransaction.category}
                onValueChange={(value) => setEditingTransaction(prev => ({...prev, category: value}))}
                style={styles.picker}
              >
                {(editingTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
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
  creditCardIndicator: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  loanIndicator: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 2,
  },
  cashbackIndicator: {
    fontSize: 12,
    color: '#4CAF50',
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
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
  },
});

export default HomeScreen;