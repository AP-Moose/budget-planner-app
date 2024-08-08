import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBudgetGoals, updateBudgetGoal, getTransactions } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES } from '../utils/categories';

function BudgetGoalsScreen() {
  const [budgetGoals, setBudgetGoals] = useState([]);
  const [actualExpenses, setActualExpenses] = useState({});
  const [currentMonth, setCurrentMonth] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const loadGoals = useCallback(async () => {
    try {
      let fetchedGoals = await getBudgetGoals();
      
      // Ensure all categories are present
      const allCategories = EXPENSE_CATEGORIES.map(category => ({
        category: category,
        amount: '0'
      }));

      // Merge existing goals with default goals
      fetchedGoals = allCategories.map(defaultGoal => {
        const existingGoal = fetchedGoals.find(g => g.category === defaultGoal.category);
        return existingGoal || defaultGoal;
      });

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
    return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getProgressColor = (percentUsed) => {
    if (percentUsed <= 33) return '#4ECDC4';
    if (percentUsed <= 66) return '#FFD700';
    return '#FF6B6B';
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal || !selectedGoal.category || !selectedGoal.amount) {
      Alert.alert('Error', 'Please enter an amount.');
      return;
    }
    try {
      await updateBudgetGoal(selectedGoal.category, { amount: selectedGoal.amount });
      setSelectedGoal(null);
      loadGoals();
      Alert.alert('Success', 'Goal Updated');
    } catch (error) {
      console.error('Error updating budget goal:', error);
      Alert.alert('Error', 'Failed to update budget goal. Please try again.');
    }
  };

  const handleResetGoal = async () => {
    if (!selectedGoal) {
      Alert.alert('Error', 'No goal selected.');
      return;
    }
    try {
      await updateBudgetGoal(selectedGoal.category, { amount: '0' });
      setSelectedGoal(null);
      loadGoals();
      Alert.alert('Success', 'Goal Reset to $0');
    } catch (error) {
      console.error('Error resetting budget goal:', error);
      Alert.alert('Error', 'Failed to reset budget goal. Please try again.');
    }
  };

  const renderBudgetUsage = () => {
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : (totalSpent > 0 ? 100 : 0);
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
          {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
        </Text>
        <Text style={styles.budgetRemainingText}>
          {totalBudget >= totalSpent 
            ? `You have ${formatCurrency(totalBudget - totalSpent)} left in your budget.`
            : `You are ${formatCurrency(totalSpent - totalBudget)} over budget.`
          }
        </Text>
      </View>
    );
  };

  const renderGoalItem = useCallback(({ item: goal }) => {
    const spent = actualExpenses[goal.category] || 0;
    const budgeted = parseFloat(goal.amount);
    
    // Calculate percentage used
    let percentUsed;
    if (budgeted > 0) {
      percentUsed = (spent / budgeted) * 100;
    } else if (spent > 0) {
      percentUsed = 100; // If there's spending but no budget, it's 100% used
    } else {
      percentUsed = 0; // If no budget and no spending, it's 0% used
    }
  
    // Ensure percentage doesn't exceed 100%
    percentUsed = Math.min(percentUsed, 100);
  
    const difference = budgeted - spent;
  
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
                width: `${percentUsed}%`,
                backgroundColor: getProgressColor(percentUsed)
              }
            ]} 
          />
        </View>
        <View style={styles.goalFooter}>
          <Text style={styles.percentageText}>{percentUsed.toFixed(1)}% used</Text>
          <Text style={[styles.differenceText, { color: difference >= 0 ? 'green' : 'red' }]}>
            {difference >= 0 
              ? `${formatCurrency(difference)} remaining`
              : `${formatCurrency(-difference)} over budget`
            }
          </Text>
        </View>
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

      {selectedGoal ? (
        <View style={styles.formContainer}>
          <Text style={styles.selectedCategory}>{selectedGoal.category}</Text>
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
          <TouchableOpacity style={styles.resetButton} onPress={handleResetGoal}>
            <Text style={styles.buttonText}>Reset Goal to $0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedGoal(null)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={budgetGoals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.category}
          style={styles.goalsList}
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
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 12,
  },
  differenceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    marginHorizontal: 10,
  },
  selectedCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  updateButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#FF9800',
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
});

export default BudgetGoalsScreen;