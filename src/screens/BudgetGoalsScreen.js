import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';
import RNPickerSelect from 'react-native-picker-select';
import { getBudgetGoals, addBudgetGoal, updateBudgetGoal, deleteBudgetGoal } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES } from '../utils/categories';

function BudgetGoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ category: '', amount: '' });
  const [editingGoal, setEditingGoal] = useState(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      const fetchedGoals = await getBudgetGoals();
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error loading budget goals:', error);
      Alert.alert('Error', 'Failed to load budget goals. Please try again.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  const handleAddGoal = async () => {
    if (!newGoal.category || !newGoal.amount) {
      Alert.alert('Error', 'Please select a category and enter an amount.');
      return;
    }
    try {
      await addBudgetGoal(newGoal);
      setNewGoal({ category: '', amount: '' });
      setIsAddingGoal(false);
      loadGoals();
    } catch (error) {
      console.error('Error adding budget goal:', error);
      Alert.alert('Error', 'Failed to add budget goal. Please try again.');
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !editingGoal.category || !editingGoal.amount) {
      Alert.alert('Error', 'Please select a category and enter an amount.');
      return;
    }
    try {
      await updateBudgetGoal(editingGoal.id, editingGoal);
      setEditingGoal(null);
      loadGoals();
    } catch (error) {
      console.error('Error updating budget goal:', error);
      Alert.alert('Error', 'Failed to update budget goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteBudgetGoal(goalId);
      loadGoals();
    } catch (error) {
      console.error('Error deleting budget goal:', error);
      Alert.alert('Error', 'Failed to delete budget goal. Please try again.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => setEditingGoal(item)} style={styles.goalItem}>
      <Text style={styles.goalCategory}>{item.category}</Text>
      <Text style={styles.goalAmount}>${item.amount}</Text>
    </TouchableOpacity>
  );

  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteGoal(data.item.id)}
      >
        <Text style={styles.backTextWhite}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const ListHeaderComponent = useCallback(() => (
    <>
      {!editingGoal && !isAddingGoal && (
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAddingGoal(true)}>
          <Text style={styles.buttonText}>Add New Goal</Text>
        </TouchableOpacity>
      )}
    </>
  ), [editingGoal, isAddingGoal]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {editingGoal ? (
        <View style={styles.formContainer}>
          <RNPickerSelect
            onValueChange={(value) => setEditingGoal(prev => ({...prev, category: value}))}
            items={EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
            style={pickerSelectStyles}
            value={editingGoal.category}
            placeholder={{ label: "Select a category", value: null }}
          />
          <TextInput
            style={styles.input}
            value={editingGoal.amount.toString()}
            onChangeText={(text) => setEditingGoal(prev => ({...prev, amount: text}))}
            keyboardType="numeric"
            placeholder="Amount"
          />
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateGoal}>
            <Text style={styles.buttonText}>Update Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingGoal(null)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : isAddingGoal ? (
        <View style={styles.formContainer}>
          <RNPickerSelect
            onValueChange={(value) => setNewGoal(prev => ({...prev, category: value}))}
            items={EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
            style={pickerSelectStyles}
            value={newGoal.category}
            placeholder={{ label: "Select a category", value: null }}
          />
          <TextInput
            style={styles.input}
            value={newGoal.amount}
            onChangeText={(text) => setNewGoal(prev => ({...prev, amount: text}))}
            keyboardType="numeric"
            placeholder="Amount"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
            <Text style={styles.buttonText}>Add Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddingGoal(false)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SwipeListView
          ListHeaderComponent={ListHeaderComponent}
          data={goals}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableLeftSwipe
          keyExtractor={(item) => item.id}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  goalCategory: {
    fontSize: 16,
    color: '#333',
  },
  goalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
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

export default BudgetGoalsScreen;