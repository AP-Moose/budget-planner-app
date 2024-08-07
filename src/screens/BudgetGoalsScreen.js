import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import { getBudgetGoals, addBudgetGoal, updateBudgetGoal, deleteBudgetGoal, getTransactions } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

function BudgetGoalsScreen() {
  const [budgetGoals, setBudgetGoals] = useState([]);
  const [actualExpenses, setActualExpenses] = useState({});
  const [currentMonth, setCurrentMonth] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ category: '', amount: '' });
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [orientation, setOrientation] = useState('portrait');

  const numColumns = useMemo(() => {
    return orientation === 'portrait' ? 3 : 4;
  }, [orientation]);

  const itemWidth = useMemo(() => {
    const baseWidth = screenWidth / numColumns;
    const itemCount = budgetGoals.length;
    if (itemCount <= 3) return baseWidth;
    if (itemCount <= 6) return baseWidth * 0.9;
    return baseWidth * 0.8;
  }, [numColumns, budgetGoals.length]);

  const flatListKey = useMemo(() => `flatList-${orientation}-${numColumns}-${budgetGoals.length}`, [orientation, numColumns, budgetGoals.length]);

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

      const updateOrientation = () => {
        const { width, height } = Dimensions.get('window');
        setOrientation(width > height ? 'landscape' : 'portrait');
      };

      const subscription = Dimensions.addEventListener('change', updateOrientation);
      updateOrientation(); // Initial call

      return () => subscription?.remove();
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
    if (budgetGoals.some(goal => goal.category === newGoal.category)) {
      Alert.alert('Error', 'Update existing Category Goal or select one that\'s not already in use');
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
      setSelectedGoal(null);
      loadGoals();
      Alert.alert('Success', 'Goal Deleted');
    } catch (error) {
      console.error('Error deleting budget goal:', error);
      Alert.alert('Error', 'Failed to delete budget goal. Please try again.');
    }
  };

  const renderGoalItem = ({ item: goal }) => {
    const spent = actualExpenses[goal.category] || 0;
    const budgeted = parseFloat(goal.amount);
    const remaining = budgeted - spent;
    const percentUsed = (spent / budgeted) * 100;
    const color = getProgressColor(percentUsed);

    return (
      <TouchableOpacity
        style={[styles.goalItem, { width: itemWidth - 10 }]}
        onPress={() => setSelectedGoal(goal)}
      >
        <Text style={styles.goalCategory} numberOfLines={1}>{goal.category}</Text>
        <View style={styles.circularProgress}>
          <Svg height="60" width="60" viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e0e0e0"
              strokeWidth="10"
              fill="none"
            />
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={color}
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${Math.min(percentUsed, 100) * 2.83} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </Svg>
          <Text style={styles.percentageText}>{percentUsed.toFixed(0)}%</Text>
        </View>
        <Text style={styles.goalAmount}>Budget: {formatCurrency(budgeted)}</Text>
        <Text style={styles.remainingAmount}>Left: {formatCurrency(remaining)}</Text>
      </TouchableOpacity>
    );
  };

  const renderLargeGoalView = (goal) => {
    const spent = actualExpenses[goal.category] || 0;
    const budgeted = parseFloat(goal.amount);
    const remaining = budgeted - spent;
    const percentUsed = (spent / budgeted) * 100;
    const color = getProgressColor(percentUsed);
  
    return (
      <View style={styles.largeGoalView}>
        <View style={styles.largeGoalHeader}>
          <Text style={styles.largeGoalCategory}>{goal.category}</Text>
          <TouchableOpacity style={styles.smallCancelButton} onPress={() => setSelectedGoal(null)}>
            <Text style={styles.smallButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.largeCircularProgress}>
          <Svg height="200" width="200" viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e0e0e0"
              strokeWidth="10"
              fill="none"
            />
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={color}
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${Math.min(percentUsed, 100) * 2.83} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </Svg>
          <Text style={styles.largePercentageText}>
            {percentUsed.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.largeGoalDetails}>
          <Text style={styles.largeGoalAmount}>Budget: {formatCurrency(budgeted)}</Text>
          <Text style={styles.largeGoalAmount}>Spent: {formatCurrency(spent)}</Text>
          <Text style={styles.largeGoalAmount}>Remaining: {formatCurrency(remaining)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Text style={styles.title}>{currentMonth} Budget Goals</Text>
      <Text style={styles.totalBudget}>Total Budget: {formatCurrency(totalBudget)}</Text>
      <Text style={styles.totalSpent}>Total Spent: {formatCurrency(totalSpent)}</Text>
      <Text style={styles.remainingBudget}>Remaining: {formatCurrency(totalBudget - totalSpent)}</Text>

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
        <ScrollView style={styles.formContainer}>
          {renderLargeGoalView(selectedGoal)}
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
        </ScrollView>
      ) : (
        <View style={styles.gridContainer}>
          <FlatList
            key={flatListKey}
            data={budgetGoals}
            renderItem={renderGoalItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            style={styles.goalsList}
            contentContainerStyle={styles.gridContentContainer}
          />
        </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  totalBudget: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
  totalSpent: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
  remainingBudget: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
    fontWeight: 'bold',
  },
  gridContainer: {
    flex: 1,
    alignItems: 'center',
  },
  goalsList: {
    flex: 1,
  },
  gridContentContainer: {
    alignItems: 'center',
  },
  goalItem: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    margin: 5,
    alignItems: 'center',
  },
  goalCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  circularProgress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalAmount: {
    fontSize: 12,
    marginTop: 5,
  },
  remainingAmount: {
    fontSize: 12,
    marginTop: 5,
    color: '#555',
  },
  formContainer: {
    flex: 1,
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
    marginBottom: 10,
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
  largeGoalView: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeGoalCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  largeCircularProgress: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largePercentageText: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
  },
  largeGoalDetails: {
    marginTop: 20,
    alignItems: 'center',
  },
  largeGoalAmount: {
    fontSize: 16,
    marginBottom: 5,
  },
  largeGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  smallCancelButton: {
    backgroundColor: '#9E9E9E',
    padding: 8,
    borderRadius: 5,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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