import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native'; // Ensure this is from the correct library
import { addCreditCard, updateCreditCard, deleteCreditCard, onCreditCardsUpdate, getTransactions } from '../services/FirebaseService';

const CreditCardScreen = () => {
  const [creditCards, setCreditCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: '', limit: '', startingBalance: '', startDate: new Date(), interestRate: '' });
  const [editingCard, setEditingCard] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0); // Keep track of balance
  const [updatingCardIds, setUpdatingCardIds] = useState([]);

  // Listen for focus and refresh transactions
  useFocusEffect(
    useCallback(() => {
      // This will run when the screen is focused, ensuring that transactions are updated
      loadTransactions(); // Ensure transactions and balances are refreshed when returning to the screen
    }, [])
  );

  useEffect(() => {
    const unsubscribe = onCreditCardsUpdate((updatedCards) => {
      setCreditCards(updatedCards);
    });

    loadTransactions(); // Load transactions when the component mounts

    return () => unsubscribe();
  }, []);

  const loadTransactions = async () => {
    try {
      const fetchedTransactions = await getTransactions();
      setTransactions(fetchedTransactions);

      // Recalculate the balance based on the updated transactions
      const newBalance = fetchedTransactions.reduce((acc, transaction) => {
        return acc + parseFloat(transaction.amount); // Adjust calculation logic as per your data structure
      }, 0);

      setBalance(newBalance); // Set the recalculated balance
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleAddCard = async () => {
    if (!newCard.name || !newCard.limit || !newCard.interestRate) {
      Alert.alert('Error', 'Please enter card name, limit, and interest rate');
      return;
    }
    try {
      await addCreditCard({
        ...newCard,
        limit: parseFloat(newCard.limit) || 0,
        startingBalance: newCard.startingBalance === '' ? 0 : parseFloat(newCard.startingBalance) || 0,
        balance: newCard.startingBalance === '' ? 0 : parseFloat(newCard.startingBalance) || 0,
        interestRate: parseFloat(newCard.interestRate) || 0, // Include the interest rate
        startDate: newCard.startDate,
      });
      setNewCard({ name: '', limit: '', startingBalance: '', startDate: new Date(), interestRate: '' });
      loadTransactions(); // Reload transactions after adding a new card
    } catch (error) {
      console.error('Error adding credit card:', error);
      Alert.alert('Error', 'Failed to add credit card. Please try again.');
    }
  };

  const handleUpdateCard = async (id, updatedCard) => {
    try {
      if (!updatedCard || typeof updatedCard !== 'object') {
        throw new Error('Invalid card data');
      }

      setUpdatingCardIds(prev => [...prev, id]);

      const cardToUpdate = {
        name: updatedCard.name,
        limit: updatedCard.limit === '' ? 0 : parseFloat(updatedCard.limit) || 0,
        startingBalance: updatedCard.startingBalance === '' ? 0 : parseFloat(updatedCard.startingBalance) || 0,
        startDate: updatedCard.startDate || new Date(),
        interestRate: updatedCard.interestRate === '' ? 0 : parseFloat(updatedCard.interestRate) || 0, // Update interest rate
      };

      await updateCreditCard(id, cardToUpdate);
      setEditingCard(null);

      Alert.alert('Success', 'Credit card updated successfully');
      loadTransactions(); // Reload transactions after updating a card
    } catch (error) {
      console.error('Error updating credit card:', error);
      Alert.alert('Error', 'Failed to update credit card. Please try again.');
    } finally {
      setUpdatingCardIds(prev => prev.filter(cardId => cardId !== id));
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await deleteCreditCard(id);
      loadTransactions(); // Reload transactions after deleting a card
    } catch (error) {
      console.error('Error deleting credit card:', error);
      Alert.alert('Error', 'Failed to delete credit card. Please try again.');
    }
  };

  const renderCreditCard = ({ item }) => (
    <View style={styles.cardItem}>
      {editingCard === item.id ? (
        <>
          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Card Name:</Text>
              <TextInput
                style={styles.input}
                value={item.name}
                onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? { ...c, name: text } : c))}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Credit Limit:</Text>
              <TextInput
                style={styles.input}
                value={item.limit !== undefined ? item.limit.toString() : ''}
                onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? { ...c, limit: text } : c))}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>
          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Starting Balance:</Text>
              <TextInput
                style={styles.input}
                value={item.startingBalance !== undefined ? item.startingBalance.toString() : ''}
                onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? { ...c, startingBalance: text } : c))}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Start Date:</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{new Date(item.startDate).toDateString()}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Interest Rate:</Text>
              <TextInput
                style={styles.input}
                value={item.interestRate !== undefined ? item.interestRate.toString() : ''}
                onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? { ...c, interestRate: text } : c))}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(item.startDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setCreditCards(cards => cards.map(c => c.id === item.id ? { ...c, startDate: selectedDate } : c));
                }
              }}
            />
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, updatingCardIds.includes(item.id) && styles.disabledButton]}
              onPress={() => handleUpdateCard(item.id, item)}
              disabled={updatingCardIds.includes(item.id)}
            >
              {updatingCardIds.includes(item.id) ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setEditingCard(null)}
              disabled={updatingCardIds.includes(item.id)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text>Limit: ${parseFloat(item.limit).toFixed(2) || 0}</Text>
          <Text>Current Balance: ${item.balance ? item.balance.toFixed(2) : '0.00'}</Text>
          <Text>Starting Balance: ${parseFloat(item.startingBalance).toFixed(2) || 0}</Text>
          <Text>Start Date: {new Date(item.startDate).toDateString()}</Text>
          <Text>Interest Rate: {item.interestRate ? item.interestRate.toFixed(2) : '0.00'}%</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setEditingCard(item.id)}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => handleDeleteCard(item.id)}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <Text style={styles.title}>Credit Cards</Text>
      <View style={styles.inputContainer}>
        <View style={styles.rowContainer}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Card Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="Card Name"
              value={newCard.name}
              onChangeText={(text) => setNewCard({ ...newCard, name: text })}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Credit Limit:</Text>
            <TextInput
              style={styles.input}
              placeholder="Limit"
              value={newCard.limit}
              onChangeText={(text) => setNewCard({ ...newCard, limit: text })}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        </View>
        <View style={styles.rowContainer}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Starting Balance:</Text>
            <TextInput
              style={styles.input}
              placeholder="Balance"
              value={newCard.startingBalance}
              onChangeText={(text) => setNewCard({ ...newCard, startingBalance: text })}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Start Date:</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{newCard.startDate.toDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rowContainer}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Interest Rate (%):</Text>
            <TextInput
              style={styles.input}
              placeholder="Interest Rate"
              value={newCard.interestRate}
              onChangeText={(text) => setNewCard({ ...newCard, interestRate: text })}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={newCard.startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setNewCard({ ...newCard, startDate: selectedDate });
              }
            }}
          />
        )}
        <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
          <Text style={styles.addButtonText}>Add Credit Card</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={creditCards}
        renderItem={renderCreditCard}
        keyExtractor={(item) => item.id}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateText: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  cardItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CreditCardScreen;
