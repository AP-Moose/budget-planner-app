import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTransactions, deleteTransaction, addTransaction, updateTransaction, getCreditCards, getLoans, updateLoanInformation } from '../services/FirebaseService';
import { getCategoryName, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import SearchBar from '../components/SearchBar';
import HomeDashboard from '../components/Dashboards/HomeDashboard';
import CSVUpload from '../components/CSVUpload';
import { Ionicons } from '@expo/vector-icons';
import { useMonth } from '../context/MonthContext';
import MonthNavigator from '../components/MonthNavigator';

const SelectModal = ({ visible, onClose, options, onSelect, title }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{option.label || option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
    loanId: null
  });
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [creditCards, setCreditCards] = useState([]);
  const [loans, setLoans] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

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

  const handleCategorySelection = (category) => {
    if (editingTransaction) {
      setEditingTransaction(prev => ({ ...prev, category }));
      setShowEditModal(true);
    } else {
      setNewTransaction(prev => ({ ...prev, category }));
    }
    setShowCategoryModal(false);
  };
  
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

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;
  
    try {
      // Ensure initialAmount is a number before updating the loan
      const updatedLoanInfo = {
        id: editingTransaction.loanId,
        name: editingTransaction.loanName,  // Make sure you pass the updated name if necessary
        initialAmount: parseFloat(editingTransaction.initialAmount) || 0 // Convert to number
      };
  
      await updateTransaction(editingTransaction.id, editingTransaction);
  
      if (editingTransaction.isLoanPayment) {
        await updateLoanInformation(updatedLoanInfo);
      }
  
      setEditingTransaction(null);
      setShowEditModal(false);
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
      const transactionId = await addTransaction(newTransaction);
  
      if (newTransaction.isLoanPayment) {
        await updateLoanInformation({
          id: newTransaction.loanId,
          name: newTransaction.loanName,
          initialAmount: parseFloat(newTransaction.initialAmount) || 0  // Convert to number
        });
      }
  
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
        loanId: null
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
    setShowDatePicker(false);
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
      category: prev.isCardPayment || prev.isLoanPayment ? 'Debt Payment' : prev.category // Set to "Debt Payment" if it's a payment
    }));
  };

  const toggleIsCardPayment = () => {
    setNewTransaction(prev => ({
      ...prev,
      isCardPayment: !prev.isCardPayment,
      category: !prev.isCardPayment ? 'Debt Payment' : prev.category, // Automatically set category to "Debt Payment" when selecting Card Payment
    }));
  };

  const toggleIsLoanPayment = () => {
    setNewTransaction(prev => ({
      ...prev,
      isLoanPayment: !prev.isLoanPayment,
      creditCard: false,
      category: !prev.isLoanPayment ? 'Debt Payment' : prev.category, // Automatically set category to "Debt Payment" when selecting Loan Payment
    }));
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
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
    <ScrollView style={styles.addTransactionForm}>
      <TouchableOpacity style={styles.selectButton} onPress={() => setShowTypeModal(true)}>
        <Text style={styles.selectButtonText}>
          {newTransaction.type ? newTransaction.type.charAt(0).toUpperCase() + newTransaction.type.slice(1) : 'Select Transaction Type'}
        </Text>
      </TouchableOpacity>

      <View style={styles.formRow}>
        <Text style={styles.label}>Credit Card Transaction:</Text>
        <Switch
          value={newTransaction.creditCard}
          onValueChange={toggleCreditCard}
          disabled={newTransaction.isLoanPayment}
        />
      </View>

      {newTransaction.creditCard && (
        <TouchableOpacity style={styles.selectButton} onPress={() => setShowCreditCardModal(true)}>
          <Text style={styles.selectButtonText}>
            {newTransaction.creditCardId ? creditCards.find(card => card.id === newTransaction.creditCardId)?.name : 'Select Credit Card'}
          </Text>
        </TouchableOpacity>
      )}

      {newTransaction.creditCard && (
        <View style={styles.formRow}>
          <Text style={styles.label}>Is Card Payment:</Text>
          <Switch
            value={newTransaction.isCardPayment}
            onValueChange={toggleIsCardPayment}
          />
        </View>
      )}

      <View style={styles.formRow}>
        <Text style={styles.label}>Loan Payment:</Text>
        <Switch
          value={newTransaction.isLoanPayment}
          onValueChange={toggleIsLoanPayment}
          disabled={newTransaction.creditCard}
        />
      </View>

      {newTransaction.isLoanPayment && (
        <TouchableOpacity style={styles.selectButton} onPress={() => setShowLoanModal(true)}>
          <Text style={styles.selectButtonText}>
            {newTransaction.loanId ? loans.find(loan => loan.id === newTransaction.loanId)?.name : 'Select Loan'}
          </Text>
        </TouchableOpacity>
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

      {/* Category Selection, disable for Debt Payments */}
      <TouchableOpacity
        style={[styles.selectButton, (newTransaction.isCardPayment || newTransaction.isLoanPayment) && styles.disabledSelectButton]}
        onPress={() => !newTransaction.isCardPayment && !newTransaction.isLoanPayment && setShowCategoryModal(true)}
        disabled={newTransaction.isCardPayment || newTransaction.isLoanPayment}
      >
        <Text style={styles.selectButtonText}>
          {newTransaction.category || 'Select Category'}
        </Text>
      </TouchableOpacity>

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
    </ScrollView>
  );

  const renderEditModal = () => {
    const dismissKeyboard = () => {
      Keyboard.dismiss();
    };
  
    return (
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContent}
            >
              <ScrollView>
                <Text style={styles.modalTitle}>Edit Transaction</Text>
                <TextInput
                  style={styles.input}
                  value={editingTransaction?.amount.toString()}
                  onChangeText={(text) => setEditingTransaction(prev => ({...prev, amount: text}))}
                  keyboardType="decimal-pad"
                  placeholder="Amount"
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                />
                <TextInput
                  style={styles.input}
                  value={editingTransaction?.description}
                  onChangeText={(text) => setEditingTransaction(prev => ({...prev, description: text}))}
                  placeholder="Description"
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                />
                <TouchableOpacity 
                  style={styles.selectButton} 
                  onPress={() => {
                    setShowEditModal(false);
                    setShowCategoryModal(true);
                  }}
                  disabled={editingTransaction?.isCardPayment || editingTransaction?.isLoanPayment}
                >
                  <Text style={styles.selectButtonText}>
                    {editingTransaction?.category ? getCategoryName(editingTransaction.category) : 'Select Category'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => {
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {editingTransaction ? new Date(editingTransaction.date).toLocaleDateString() : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(editingTransaction?.date || new Date())}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setEditingTransaction(prev => ({...prev, date: selectedDate}));
                      }
                    }}
                  />
                )}
                <View style={styles.switchContainer}>
                  <Text>Credit Card Transaction:</Text>
                  <Switch
                    value={editingTransaction?.creditCard}
                    onValueChange={(value) => setEditingTransaction(prev => ({
                      ...prev, 
                      creditCard: value,
                      category: value && prev.isCardPayment ? 'Debt Payment' : prev.category // Automatically set category to "Debt Payment" when selecting Credit Card Payment
                    }))}
                  />
                </View>
                {editingTransaction?.creditCard && (
                  <>
                    <TouchableOpacity 
                      style={styles.selectButton} 
                      onPress={() => {
                        setShowEditModal(false);
                        setShowCreditCardModal(true);
                      }}
                    >
                      <Text style={styles.selectButtonText}>
                        {editingTransaction.creditCardId ? creditCards.find(card => card.id === editingTransaction.creditCardId)?.name : 'Select Credit Card'}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.switchContainer}>
                      <Text>Is Card Payment:</Text>
                      <Switch
                        value={editingTransaction?.isCardPayment}
                        onValueChange={(value) => setEditingTransaction(prev => ({
                          ...prev, 
                          isCardPayment: value,
                          category: value ? 'Debt Payment' : prev.category // Automatically set category to "Debt Payment" when selecting Card Payment
                        }))}
                      />
                    </View>
                  </>
                )}
                <View style={styles.switchContainer}>
                  <Text>Loan Payment:</Text>
                  <Switch
                    value={editingTransaction?.isLoanPayment}
                    onValueChange={(value) => setEditingTransaction(prev => ({
                      ...prev, 
                      isLoanPayment: value,
                      category: value ? 'Debt Payment' : prev.category, // Automatically set category to "Debt Payment" when selecting Loan Payment
                      creditCard: false
                    }))}
                  />
                </View>
                {editingTransaction?.isLoanPayment && (
                  <TouchableOpacity 
                    style={styles.selectButton} 
                    onPress={() => {
                      setShowEditModal(false);
                      setShowLoanModal(true); // Open loan modal
                    }}
                  >
                    <Text style={styles.selectButtonText}>
                      {editingTransaction.loanId ? loans.find(loan => loan.id === editingTransaction.loanId)?.name : 'Select Loan'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.addButton} onPress={handleUpdateTransaction}>
                  <Text style={styles.buttonText}>Update Transaction</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setEditingTransaction(null);
                  setShowEditModal(false);
                }}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  

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
      {renderEditModal()}
      <SelectModal
        visible={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        options={[
          { label: 'Expense', value: 'expense' },
          { label: 'Income', value: 'income' }
        ]}
        onSelect={(option) => setNewTransaction(prev => ({ ...prev, type: option.value }))}
        title="Select Transaction Type"
      />
      <SelectModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        options={editingTransaction ? 
          (editingTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES) :
          (newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
        }
        onSelect={handleCategorySelection}
        title="Select Category"
      />
      <SelectModal
  visible={showCreditCardModal}
  onClose={() => setShowCreditCardModal(false)}  // Only close credit card modal
  options={creditCards.map(card => ({ label: card.name, value: card.id }))}
  onSelect={(option) => {
    const selectedCard = creditCards.find(card => card.id === option.value);  // Get selected credit card details

    if (editingTransaction) {
      // If you're editing an existing transaction, update editingTransaction state
      setEditingTransaction(prev => ({
        ...prev,
        creditCardId: selectedCard.id,
        creditCardName: selectedCard.name  // Store the credit card name for reference
      }));
      setShowEditModal(true);    // Reopen the edit modal
    } else {
      // If you're adding a new transaction, update newTransaction state
      setNewTransaction(prev => ({
        ...prev,
        creditCardId: selectedCard.id,
        creditCardName: selectedCard.name, // Store the credit card name for reference
        isCardPayment: true                // Mark as a credit card payment
      }));
      setIsAddingTransaction(true); // Keep the "Add Transaction" modal open
    }

    // Close only the credit card modal
    setShowCreditCardModal(false);
  }}
  title="Select Credit Card"
/>

      <SelectModal
  visible={showLoanModal}
  onClose={() => setShowLoanModal(false)}  // Only close loan modal
  options={loans.map(loan => ({ label: loan.name, value: loan.id }))}
  onSelect={(option) => {
    const selectedLoan = loans.find(loan => loan.id === option.value);  // Get selected loan details

    if (editingTransaction) {
      // If you're editing an existing transaction, update editingTransaction state
      setEditingTransaction(prev => ({
        ...prev,
        loanId: selectedLoan.id,
        loanName: selectedLoan.name  // Store the loan name for reference
      }));
      setShowEditModal(true);    // Reopen the edit modal
    } else {
      // If you're adding a new transaction, update newTransaction state
      setNewTransaction(prev => ({
        ...prev,
        loanId: selectedLoan.id,
        loanName: selectedLoan.name, // Store the loan name for reference
        isLoanPayment: true           // Mark as a loan payment
      }));
      setIsAddingTransaction(true); // Keep the "Add Transaction" modal open
    }

    // Close only the loan modal
    setShowLoanModal(false);
  }}
  title="Select Loan"
/>





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
  addTransactionForm: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    maxHeight: '80%',
  },
  formRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 18,
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
  },
  disabledSelectButton: {
    backgroundColor: '#e0e0e0',
    borderColor: '#aaa',
  },
  selectButtonText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  addButton: {
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
    fontSize: 16,
  },
  floatingAddButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalOptionText: {
    fontSize: 18, // Increased font size for better readability
    color: '#333',
  },

  modalCloseButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 5, // Increased padding for easier tapping
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
    marginBottom: 10, // Added space between options for better readability
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  formRow: {
    marginBottom: 10,
  }
});

export default HomeScreen;

