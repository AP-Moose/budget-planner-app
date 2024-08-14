import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addCreditCard, updateCreditCard, deleteCreditCard, onCreditCardsUpdate } from '../services/FirebaseService';

const CreditCardScreen = () => {
  const [creditCards, setCreditCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: '', limit: '', startingBalance: '', startDate: new Date() });
  const [editingCard, setEditingCard] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const unsubscribe = onCreditCardsUpdate((updatedCards) => {
      setCreditCards(updatedCards);
    });

    return () => unsubscribe();
  }, []);

  const handleAddCard = async () => {
    if (!newCard.name || !newCard.limit) {
      Alert.alert('Error', 'Please enter card name and limit');
      return;
    }
    try {
      await addCreditCard({
        ...newCard,
        limit: parseFloat(newCard.limit),
        startingBalance: parseFloat(newCard.startingBalance || '0'),
        balance: parseFloat(newCard.startingBalance || '0'),
        startDate: newCard.startDate,
      });
      setNewCard({ name: '', limit: '', startingBalance: '', startDate: new Date() });
    } catch (error) {
      console.error('Error adding credit card:', error);
      Alert.alert('Error', 'Failed to add credit card. Please try again.');
    }
  };

  const handleUpdateCard = async (id, updatedCard) => {
    try {
      await updateCreditCard(id, updatedCard);
      setEditingCard(null);
    } catch (error) {
      console.error('Error updating credit card:', error);
      Alert.alert('Error', 'Failed to update credit card. Please try again.');
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await deleteCreditCard(id);
    } catch (error) {
      console.error('Error deleting credit card:', error);
      Alert.alert('Error', 'Failed to delete credit card. Please try again.');
    }
  };

  const renderCreditCard = ({ item }) => (
    <View style={styles.cardItem}>
      {editingCard === item.id ? (
        <>
          <TextInput
            style={styles.input}
            value={item.name}
            onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? {...c, name: text} : c))}
          />
          <TextInput
            style={styles.input}
            value={item.limit.toString()}
            onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? {...c, limit: text} : c))}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={item.startingBalance.toString()}
            onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? {...c, startingBalance: text} : c))}
            keyboardType="numeric"
          />
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text>Start Date: {item.startDate.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={item.startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setCreditCards(cards => cards.map(c => c.id === item.id ? {...c, startDate: selectedDate} : c));
                }
              }}
            />
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleUpdateCard(item.id, {name: item.name, limit: item.limit, startingBalance: item.startingBalance, startDate: item.startDate})}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text>Limit: ${item.limit}</Text>
          <Text>Balance: ${item.balance}</Text>
          <Text>Starting Balance: ${item.startingBalance}</Text>
          <Text>Start Date: {new Date(item.startDate).toDateString()}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setEditingCard(item.id)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </>
      )}
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
          placeholder="Starting Balance"
          value={newCard.startingBalance}
          onChangeText={(text) => setNewCard({ ...newCard, startingBalance: text })}
          keyboardType="numeric"
        />
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text>Start Date: {newCard.startDate.toDateString()}</Text>
        </TouchableOpacity>
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
    button: {
      backgroundColor: '#2196F3',
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: '#fff',
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