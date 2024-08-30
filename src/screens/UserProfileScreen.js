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
  getTransactions // Ensure this is imported
} from '../services/FirebaseService';
import { categorizeTransactions, calculateTotals } from '../utils/reportUtils';

const UserProfileScreen = ({ navigation }) => {
  const [initialCashBalance, setInitialCashBalance] = useState('');
  const [accumulatedCash, setAccumulatedCash] = useState(0);
  const [totalCashBalance, setTotalCashBalance] = useState(0);
  const [balanceSheetItems, setBalanceSheetItems] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loans, setLoans] = useState([]);
  const [newItem, setNewItem] = useState({ 
    type: 'Asset', 
    category: 'Investment', 
    name: '', 
    amount: '', 
    date: new Date(),
    interestRate: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadUserProfile();
    // Directly load balance sheet items, credit cards, and loans without wrapping them in a separate function
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
      const initialBalance = profile.initialCashBalance ? profile.initialCashBalance : 0;
      setInitialCashBalance(initialBalance.toString());

      const transactions = await getTransactions(); // Fetch all transactions
      const categorizedTransactions = categorizeTransactions(transactions);
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
      setCreditCards(cards);
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
      loadUserProfile(); // Recalculate after saving
      Alert.alert('Success', 'User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      Alert.alert('Error', 'Failed to update user profile. Please try again.');
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      const itemToAdd = {
        ...newItem,
        amount: parseFloat(newItem.amount),
        date: newItem.date.toISOString()
      };

      if (newItem.category === 'Loan') {
        itemToAdd.interestRate = parseFloat(newItem.interestRate) || null;
        itemToAdd.initialAmount = parseFloat(newItem.amount);
        itemToAdd.currentBalance = parseFloat(newItem.amount);
      }

      await updateBalanceSheetItem(itemToAdd);
      setNewItem({ 
        type: 'Asset', 
        category: 'Investment', 
        name: '', 
        amount: '', 
        date: new Date(),
        interestRate: ''
      });
      loadUserProfile(); // Recalculate after adding a new item
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteBalanceSheetItem(itemId);
      loadUserProfile(); // Recalculate after deletion
      Alert.alert('Success', 'Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || newItem.date;
    setShowDatePicker(Platform.OS === 'ios');
    setNewItem({...newItem, date: currentDate});
  };

  const renderBalanceSheetItems = () => {
    const assets = balanceSheetItems.filter(item => item.type === 'Asset');
    const liabilities = balanceSheetItems.filter(item => item.type === 'Liability' && item.category !== 'Loan');

    return (
      <View>
        <Text style={styles.sectionTitle}>Assets</Text>
        {assets.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text>{item.name}: ${parseFloat(item.amount).toFixed(2)}</Text>
            <Text>Category: {item.category}</Text>
            <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
            <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Liabilities</Text>
        {liabilities.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text>{item.name}: ${parseFloat(item.amount).toFixed(2)}</Text>
            <Text>Category: {item.category}</Text>
            <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
            <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
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
            <Text>{card.name}: ${card.balance.toFixed(2)}</Text>
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
            {loan.interestRate && <Text>Interest Rate: {loan.interestRate}%</Text>}
            <TouchableOpacity onPress={() => handleDeleteItem(loan.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Total Cash Balance</Text>
          <Text>${totalCashBalance.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Sheet Items</Text>
          {renderBalanceSheetItems()}
          {renderCreditCardLiabilities()}
          {renderLoans()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Item</Text>
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
          <TouchableOpacity style={styles.button} onPress={handleAddItem}>
            <Text style={styles.buttonText}>Add Item</Text>
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
  deleteButton: {
    color: 'red',
    marginTop: 5,
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
