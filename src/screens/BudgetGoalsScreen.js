import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import { getBudgetGoals, addBudgetGoal, updateBudgetGoal, deleteBudgetGoal, getTransactions } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import { Ionicons } from '@expo/vector-icons';

function BudgetGoalsScreen() {
  const [budgetGoals, setBudgetGoals] = useState([]);
  const [actualExpenses, setActualExpenses] = useState({});
  const [currentMonth, setCurrentMonth] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ category: '', amount: '' });
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const loadGoals = useCallback(async () => {
    try {
      const fetchedGoals = await getBudgetGoals();
      setBudgetGoals(fetchedGoals);

      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long' });
      setCurrentMonth(currentMonthName);

      const transactions = await getTransactions();
      const currentMonthTransactions = transactions.filter(t => 
        t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear()
      );

      const expenses = currentMonthTransactions.reduce((acc, t) => {
        if (t.type === 'expense') {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
      }, {});

      setActualExpenses(expenses);

      const total = fetchedGoals.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
      setTotalBudget(total);

      const spent = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
      setTotalSpent(spent);
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

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getProgressColor = (percentUsed) => {
    if (percentUsed <= 33) return '#4ECDC4';
    if (percentUsed <= 66) return '#FFD700';
    return '#FF6B6B';
  };

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
      Alert.alert('Success', 'Goal Added');
    } catch (error) {
      console.error('Error adding budget goal:', error);
      Alert.alert('Error', 'Failed to add budget goal. Please try again.');
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal || !selectedGoal.category || !selectedGoal.amount) {
      Alert.alert('Error', 'Please select a category and enter an amount.');
      return;
    }
    try {
      await updateBudgetGoal(selectedGoal.id, selectedGoal);
      setSelectedGoal(null);
      loadGoals();
      Alert.alert('Success', 'Goal Updated');
    } catch (error) {
      console.error('Error updating budget goal:', error);
      Alert.alert('Error', 'Failed to update budget goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteBudgetGoal(goalId);
      loadGoals();
      Alert.alert('Success', 'Goal Deleted');
    } catch (error) {
      console.error('Error deleting budget goal:', error);
      Alert.alert('Error', 'Failed to delete budget goal. Please try again.');
    }
  };

  const renderBudgetUsage = () => {
    const percentUsed = (totalSpent / totalBudget) * 100;
    return (
      <View style={styles.budgetUsageContainer}>
        <Text style={styles.budgetUsageTitle}>Budget Usage</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(percentUsed, 100)}%`,
                backgroundColor: getProgressColor(percentUsed)
              }
            ]} 
          />
        </View>
        <Text style={styles.budgetUsageText}>
          {formatCurrency(totalSpent)}/{formatCurrency(totalBudget)}
        </Text>
        <Text style={styles.budgetRemainingText}>
          You have {formatCurrency(totalBudget - totalSpent)} left in your budget.
        </Text>
      </View>
    );
  };

  const renderGoalItem = useCallback(({ item: goal }) => {
    const spent = actualExpenses[goal.category] || 0;
    const budgeted = parseFloat(goal.amount);
    const percentUsed = (spent / budgeted) * 100;

    return (
      <TouchableOpacity
        style={styles.goalItem}
        onPress={() => setSelectedGoal(goal)}
      >
        <Text style={styles.goalCategory}>{goal.category}</Text>
        <View style={styles.goalDetails}>
          <Text style={styles.goalAmount}>Budget: {formatCurrency(budgeted)}</Text>
          <Text style={styles.goalAmount}>Spent: {formatCurrency(spent)}</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(percentUsed, 100)}%`,
                backgroundColor: getProgressColor(percentUsed)
              }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{percentUsed.toFixed(1)}% used</Text>
      </TouchableOpacity>
    );
  }, [actualExpenses, formatCurrency, getProgressColor, setSelectedGoal]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Text style={styles.title}>{currentMonth} Budget Goals</Text>
      <Text style={styles.totalBudget}>Total Budget: {formatCurrency(totalBudget)}</Text>
      
      {renderBudgetUsage()}

      {isAddingGoal ? (
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
      ) : selectedGoal ? (
        <View style={styles.formContainer}>
          <RNPickerSelect
            onValueChange={(value) => setSelectedGoal(prev => ({...prev, category: value}))}
            items={EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
            style={pickerSelectStyles}
            value={selectedGoal.category}
            placeholder={{ label: "Select a category", value: null }}
          />
          <TextInput
            style={styles.input}
            value={selectedGoal.amount.toString()}
            onChangeText={(text) => setSelectedGoal(prev => ({...prev, amount: text}))}
            keyboardType="numeric"
            placeholder="Amount"
          />
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateGoal}>
            <Text style={styles.buttonText}>Update Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteGoal(selectedGoal.id)}>
            <Text style={styles.buttonText}>Delete Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedGoal(null)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={budgetGoals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          style={styles.goalsList}
        />
      )}

      {!isAddingGoal && !selectedGoal && (
        <TouchableOpacity 
          style={styles.floatingAddButton} 
          onPress={() => setIsAddingGoal(true)}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  totalBudget: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },
  budgetUsageContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 5,
  },
  budgetUsageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  budgetUsageText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  budgetRemainingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  goalsList: {
    flex: 1,
  },
  goalItem: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  goalCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  goalAmount: {
    fontSize: 14,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
  },
  percentageText: {
    fontSize: 12,
    textAlign: 'right',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    marginHorizontal: 10,
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
    marginBottom: 10,
  },
  updateButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
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
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#03A9F4',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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