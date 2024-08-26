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
  Platform,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  getUserProfile, 
  updateUserProfile, 
  getBalanceSheetItems,
  updateBalanceSheetItem,
  deleteBalanceSheetItem
} from '../services/FirebaseService';

const UserProfileScreen = ({ navigation }) => {
  const [initialCashBalance, setInitialCashBalance] = useState('');
  const [balanceSheetItems, setBalanceSheetItems] = useState([]);
  const [newItem, setNewItem] = useState({ 
    type: 'Asset', 
    category: 'Investment', 
    name: '', 
    amount: '', 
    interestRate: '', 
    date: new Date() 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadBalanceSheetItems();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setInitialCashBalance(profile.initialCashBalance ? profile.initialCashBalance.toString() : '');
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    }
  };

  const loadBalanceSheetItems = async () => {
    try {
      const items = await getBalanceSheetItems();
      setBalanceSheetItems(items);
    } catch (error) {
      console.error('Error loading balance sheet items:', error);
      Alert.alert('Error', 'Failed to load balance sheet items. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      await updateUserProfile({ initialCashBalance: parseFloat(initialCashBalance) || 0 });
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
      await updateBalanceSheetItem({
        ...newItem,
        amount: parseFloat(newItem.amount),
        interestRate: newItem.interestRate ? parseFloat(newItem.interestRate) : null,
        date: newItem.date.toISOString()
      });
      setNewItem({ 
        type: 'Asset', 
        category: 'Investment', 
        name: '', 
        amount: '', 
        interestRate: '', 
        date: new Date() 
      });
      loadBalanceSheetItems();
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteBalanceSheetItem(itemId);
      loadBalanceSheetItems();
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

  const renderPicker = (visible, setVisible, options, selectedValue, onSelect, title) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>{title}</Text>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.modalButton,
              selectedValue === option.value && styles.selectedButton
            ]}
            onPress={() => {
              onSelect(option.value);
              setVisible(false);
            }}
          >
            <Text style={styles.modalButtonText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancelButton} onPress={() => setVisible(false)}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  const groupItemsByCategory = (items, type) => {
    return items
      .filter(item => item.type === type)
      .reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  };

  const renderBalanceSheetSection = (title, items) => {
    const groupedItems = groupItemsByCategory(items, title);
    const total = calculateTotal(items);

    return (
      <View style={styles.balanceSheetSection}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <View key={category} style={styles.categoryGroup}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {categoryItems.map((item, index) => (
              <View key={index} style={styles.item}>
                <Text>{item.name}: ${parseFloat(item.amount).toFixed(2)}</Text>
                {item.interestRate && <Text>Interest Rate: {item.interestRate}%</Text>}
                <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
                <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
        <Text style={styles.totalText}>Total {title}: ${total.toFixed(2)}</Text>
      </View>
    );
  };

  const assets = balanceSheetItems.filter(item => item.type === 'Asset');
  const liabilities = balanceSheetItems.filter(item => item.type === 'Liability');
  const totalAssets = calculateTotal(assets);
  const totalLiabilities = calculateTotal(liabilities);
  const netWorth = totalAssets - totalLiabilities;

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
          <Text style={styles.sectionTitle}>Balance Sheet</Text>
          {renderBalanceSheetSection('Asset', assets)}
          {renderBalanceSheetSection('Liability', liabilities)}
          <Text style={styles.netWorthText}>Net Worth: ${netWorth.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Item</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowTypePicker(true)}>
            <Text>{newItem.type || "Select type..."}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.input} onPress={() => setShowCategoryPicker(true)}>
            <Text>{newItem.category || "Select category..."}</Text>
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.button} onPress={handleAddItem}>
            <Text style={styles.buttonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderPicker(
        showTypePicker,
        setShowTypePicker,
        [
          { label: 'Asset', value: 'Asset' },
          { label: 'Liability', value: 'Liability' },
        ],
        newItem.type,
        (value) => setNewItem({...newItem, type: value}),
        "Select Type"
      )}
      {renderPicker(
        showCategoryPicker,
        setShowCategoryPicker,
        [
          { label: 'Investment', value: 'Investment' },
          { label: 'Loan', value: 'Loan' },
          { label: 'Other', value: 'Other' },
        ],
        newItem.category,
        (value) => setNewItem({...newItem, category: value}),
        "Select Category"
      )}
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
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18
  },
  modalButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    marginBottom: 10,
    width: 200,
    alignItems: "center"
  },
  selectedButton: {
    backgroundColor: "#4CAF50",
  },
  modalButtonText: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center"
  },
  cancelButton: {
    backgroundColor: "#FF0000",
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    marginTop: 10,
    width: 200,
    alignItems: "center"
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  balanceSheetSection: {
    marginBottom: 20,
  },
  categoryGroup: {
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  netWorthText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default UserProfileScreen;