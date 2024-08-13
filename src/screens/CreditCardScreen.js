import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { addCreditCard, getCreditCards, updateCreditCard, deleteCreditCard } from '../services/FirebaseService';

const CreditCardScreen = () => {
  const [creditCards, setCreditCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: '', limit: '', balance: '' });

  useEffect(() => {
    loadCreditCards();
  }, []);

  const loadCreditCards = async () => {
    try {
      const cards = await getCreditCards();
      setCreditCards(cards);
    } catch (error) {
      console.error('Error loading credit cards:', error);
      Alert.alert('Error', 'Failed to load credit cards. Please try again.');
    }
  };

  const handleAddCard = async () => {
    if (!newCard.name || !newCard.limit) {
      Alert.alert('Error', 'Please enter card name and limit');
      return;
    }
    try {
      await addCreditCard({
        ...newCard,
        balance: newCard.balance || '0',
        limit: parseFloat(newCard.limit),
        balance: parseFloat(newCard.balance || '0'),
      });
      setNewCard({ name: '', limit: '', balance: '' });
      loadCreditCards();
    } catch (error) {
      console.error('Error adding credit card:', error);
      Alert.alert('Error', 'Failed to add credit card. Please try again.');
    }
  };

  const handleUpdateCard = async (id, updatedCard) => {
    try {
      await updateCreditCard(id, updatedCard);
      loadCreditCards();
    } catch (error) {
      console.error('Error updating credit card:', error);
      Alert.alert('Error', 'Failed to update credit card. Please try again.');
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await deleteCreditCard(id);
      loadCreditCards();
    } catch (error) {
      console.error('Error deleting credit card:', error);
      Alert.alert('Error', 'Failed to delete credit card. Please try again.');
    }
  };

  const renderCreditCard = ({ item }) => (
    <View style={styles.cardItem}>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text>Limit: ${item.limit}</Text>
      <Text>Balance: ${item.balance}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCard(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Credit Cards</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Card Name"
          value={newCard.name}
          onChangeText={(text) => setNewCard({ ...newCard, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Card Limit"
          value={newCard.limit}
          onChangeText={(text) => setNewCard({ ...newCard, limit: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Current Balance (optional)"
          value={newCard.balance}
          onChangeText={(text) => setNewCard({ ...newCard, balance: text })}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
          <Text style={styles.addButtonText}>Add Credit Card</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={creditCards}
        renderItem={renderCreditCard}
        keyExtractor={(item) => item.id}
      />
    </View>
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
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
  },
});

export default CreditCardScreen;