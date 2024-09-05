import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  getUserProfile, 
  updateUserProfile, 
  getBalanceSheetItems,
  onBalanceSheetUpdate,
  updateBalanceSheetItem,
  deleteBalanceSheetItem,
  getCreditCards,
  getLoans,
  onCreditCardsUpdate,
  onLoansUpdate,
  onTransactionsUpdate,
  getTransactions,
} from '../services/FirebaseService';
import { categorizeTransactions, calculateTotals } from '../utils/reportUtils';
import DateTimePicker from '@react-native-community/datetimepicker';

const UserProfileScreen = ({ navigation }) => {
  const [initialCashBalance, setInitialCashBalance] = useState('');
  const [accumulatedCash, setAccumulatedCash] = useState(0);
  const [totalCashBalance, setTotalCashBalance] = useState(0);
  const [balanceSheetItems, setBalanceSheetItems] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loans, setLoans] = useState([]);
  const [editingItem, setEditingItem] = useState(null); // For editing mode
  const [newItem, setNewItem] = useState({ 
    type: 'Asset', 
    category: 'Investment', 
    name: '', 
    amount: '', 
    date: new Date(),
    interestRate: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Set up real-time listeners for transactions, credit cards, and loans
  useEffect(() => {
    const unsubscribeTransactions = onTransactionsUpdate(() => {
      loadUserProfile();  // Reload user profile when transactions change
    });

    const unsubscribeCreditCards = onCreditCardsUpdate(() => {
      loadCreditCards();  // Reload credit cards when they change
    });

    const unsubscribeLoans = onLoansUpdate(() => {
      loadLoans();  // Reload loans when they change
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeCreditCards();
      unsubscribeLoans();
    };
  }, []);

  useEffect(() => {
    loadUserProfile();
    loadCreditCards();
    loadLoans();
  }, []);

  useEffect(() => {
    const unsubscribe = onBalanceSheetUpdate((items) => {
      setBalanceSheetItems(items);
      const fetchedLoans = items.filter(item => item.category === 'Loan' && item.type === 'Liability');
      setLoans(fetchedLoans);
    });
  
    return () => unsubscribe();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      const initialBalance = parseFloat(profile.initialCashBalance) || 0;
      setInitialCashBalance(initialBalance.toString());
  
      const transactions = await getTransactions();
      const currentDate = new Date();
      const validTransactions = transactions.filter((transaction) => new Date(transaction.date) <= currentDate);
  
      const categorizedTransactions = categorizeTransactions(validTransactions);
      const totals = calculateTotals(categorizedTransactions);
  
      const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
      const totalCashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments + totals.totalLoanPayments;
      const netCashFlow = totalIncome - totalCashOutflow;
  
      setAccumulatedCash(netCashFlow);
      setTotalCashBalance(initialBalance + netCashFlow);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    }
  };

  const loadCreditCards = async () => {
    try {
      const cards = await getCreditCards();
      const transactions = await getTransactions();
      const currentDate = new Date();
  
      const updatedCards = cards.map((card) => {
        let cardBalance = card.balance || 0;
  
        transactions.forEach((transaction) => {
          if (transaction.creditCardId === card.id && new Date(transaction.date) <= currentDate) {
            if (transaction.isCardPayment) {
              cardBalance -= transaction.amount;
            } else if (transaction.type === 'expense') {
              cardBalance += transaction.amount;
            }
          }
        });
  
        return { ...card, balance: cardBalance };
      });
  
      setCreditCards(updatedCards);
    } catch (error) {
      console.error('Error loading credit cards:', error);
      Alert.alert('Error', 'Failed to load credit cards. Please try again.');
    }
  };
  

  const loadLoans = async () => {
    try {
      const fetchedLoans = await getLoans();
      setLoans(fetchedLoans);
    } catch (error) {
      console.error('Error loading loans:', error);
      Alert.alert('Error', 'Failed to load loans. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      await updateUserProfile({ initialCashBalance: parseFloat(initialCashBalance) || 0 });
      loadUserProfile();
      Alert.alert('Success', 'User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      Alert.alert('Error', 'Failed to update user profile. Please try again.');
    }
  };

  const handleAddOrUpdateItem = async () => {
    if (!newItem.name || !newItem.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
  
    try {
      const itemToSave = {
        ...newItem,
        amount: parseFloat(newItem.amount),
        date: newItem.date.toISOString(),
      };
  
      if (newItem.category === 'Loan') {
        itemToSave.interestRate = parseFloat(newItem.interestRate) || null;
        itemToSave.initialAmount = parseFloat(newItem.amount); // Update only the initial amount
      
        // Prevent updating the current balance
        if (editingItem) {
          delete itemToSave.amount; // Ensure the 'amount' (current balance) field is not updated
        }
      }
      
  
      if (editingItem) {
        await updateBalanceSheetItem({ ...itemToSave, id: editingItem.id });
        setEditingItem(null);
      } else {
        await updateBalanceSheetItem(itemToSave);
      }
  
      setNewItem({
        type: 'Asset',
        category: 'Investment',
        name: '',
        amount: '',
        date: new Date(),
        interestRate: ''
      });
      loadUserProfile();
      Alert.alert('Success', `Item ${editingItem ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error(`Error ${editingItem ? 'updating' : 'adding'} item:`, error);
      Alert.alert('Error', `Failed to ${editingItem ? 'update' : 'add'} item. Please try again.`);
    }
  };
  
  

  const handleDeleteItem = (itemId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteBalanceSheetItem(itemId);
              loadUserProfile();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({ 
      ...item,
      amount: item.initialAmount ? item.initialAmount.toString(): '',
      interestRate: item.interestRate ? item.interestRate.toString() : '',
      date: new Date(item.date)
    });
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || newItem.date;
    setShowDatePicker(false);
    setNewItem({...newItem, date: currentDate});
  };

  const renderBalanceSheetItems = () => {
    const assets = balanceSheetItems.filter(item => item.type === 'Asset');
    const liabilities = balanceSheetItems.filter(item => item.type === 'Liability' && item.category !== 'Loan');

    return (
      <View>
        <Text style={styles.sectionTitle}>Assets</Text>

        {/* Cash Assets Section */}
        <View style={styles.item}>
          <Text style={styles.subTitle}>Cash Assets</Text>
          <Text>Total Cash Balance: ${totalCashBalance.toFixed(2)}</Text>
        </View>

        {assets.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text>{item.name}: ${parseFloat(item.amount).toFixed(2)}</Text>
            <Text>Category: {item.category}</Text>
            <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => handleEditItem(item)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Liabilities</Text>
        {liabilities.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text>{item.name}: ${parseFloat(item.amount).toFixed(2)}</Text>
            <Text>Category: {item.category}</Text>
            <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => handleEditItem(item)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderCreditCardLiabilities = () => {
    return (
      <View>
        <Text style={styles.sectionTitle}>Credit Card Liabilities</Text>
        {creditCards.map((card, index) => (
          <View key={index} style={styles.item}>
            <Text>{card.name}: ${card.balance ? card.balance.toFixed(2) : '0.00'}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLoans = () => {
    return (
      <View>
        <Text style={styles.sectionTitle}>Loan Liabilities</Text>
        {loans.map((loan, index) => (
          <View key={index} style={styles.item}>
            <Text>{loan.name}</Text>
            <Text>Initial Amount: ${parseFloat(loan.initialAmount).toFixed(2)}</Text>
            <Text>Current Balance: ${parseFloat(loan.amount).toFixed(2)}</Text>
            {loan.interestRate !== null && (
              <Text>Interest Rate: {loan.interestRate}%</Text>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => handleEditItem(loan)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteItem(loan.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>User Profile</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Initial Cash Balance</Text>
          <TextInput
            style={styles.input}
            value={initialCashBalance}
            onChangeText={setInitialCashBalance}
            keyboardType="numeric"
            placeholder="Enter initial cash balance"
          />
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save Cash Balance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accumulated Cash</Text>
          <Text>${accumulatedCash.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Sheet Items</Text>
          {renderBalanceSheetItems()}
          {renderCreditCardLiabilities()}
          {renderLoans()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>
          <TextInput
            style={styles.input}
            value={newItem.name}
            onChangeText={(text) => setNewItem({...newItem, name: text})}
            placeholder="Name"
          />
          <TextInput
            style={styles.input}
            value={newItem.amount}
            onChangeText={(text) => setNewItem({...newItem, amount: text})}
            keyboardType="numeric"
            placeholder="Amount"
          />
          {newItem.category === 'Loan' && (
            <TextInput
              style={styles.input}
              value={newItem.interestRate}
              onChangeText={(text) => setNewItem({...newItem, interestRate: text})}
              keyboardType="numeric"
              placeholder="Interest Rate (%)"
            />
          )}
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text>{newItem.date.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={newItem.date}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={[styles.pickerButton, newItem.type === 'Asset' && styles.selectedButton]}
              onPress={() => setNewItem({...newItem, type: 'Asset'})}
            >
              <Text style={styles.pickerButtonText}>Asset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerButton, newItem.type === 'Liability' && styles.selectedButton]}
              onPress={() => setNewItem({...newItem, type: 'Liability'})}
            >
              <Text style={styles.pickerButtonText}>Liability</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={[styles.pickerButton, newItem.category === 'Investment' && styles.selectedButton]}
              onPress={() => setNewItem({...newItem, category: 'Investment'})}
            >
              <Text style={styles.pickerButtonText}>Investment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerButton, newItem.category === 'Loan' && styles.selectedButton]}
              onPress={() => setNewItem({...newItem, category: 'Loan', type: 'Liability'})}
            >
              <Text style={styles.pickerButtonText}>Loan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerButton, newItem.category === 'Other' && styles.selectedButton]}
              onPress={() => setNewItem({...newItem, category: 'Other'})}
            >
              <Text style={styles.pickerButtonText}>Other</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleAddOrUpdateItem}>
            <Text style={styles.buttonText}>{editingItem ? 'Update Item' : 'Add Item'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  editText: {
    color: '#2196F3',
  },
  deleteText: {
    color: '#F44336',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  pickerButtonText: {
    fontWeight: 'bold',
  },
});

export default UserProfileScreen;
