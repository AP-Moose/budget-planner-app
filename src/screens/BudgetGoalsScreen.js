import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBudgetGoals, updateBudgetGoal, getTransactions, deleteBudgetGoal } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import { useMonth } from '../context/MonthContext';
import { Ionicons } from '@expo/vector-icons';
import MonthNavigator from '../components/MonthNavigator';

function BudgetGoalsScreen({ navigation }) {
  const { currentMonth, setCurrentMonth } = useMonth();
  const [budgetGoals, setBudgetGoals] = useState([]);
  const [actualExpenses, setActualExpenses] = useState({});
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [debtPaymentGoal, setDebtPaymentGoal] = useState({ category: 'Debt Payment', amount: '0', isRecurring: false });

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      let fetchedGoals = await getBudgetGoals(year, month);
      
      // Ensure all categories are present with isRecurring set
      const allCategories = EXPENSE_CATEGORIES.map(category => {
        const existingGoal = fetchedGoals.find(g => g.category === category);
        return existingGoal || { category, amount: '0', isRecurring: false };
      });
  
      // Set debt payment goal with isRecurring defined
      const existingDebtGoal = fetchedGoals.find(g => g.category === 'Debt Payment');
      setDebtPaymentGoal(existingDebtGoal || { category: 'Debt Payment', amount: '0', isRecurring: false });
  
      setBudgetGoals(allCategories);
  
      // Your transaction handling code follows...
  
    } catch (error) {
      console.error('Error loading budget goals:', error);
      setError('Failed to load budget goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);
  

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

  const handleUpdateGoal = async (goal) => {
    if (!goal || !goal.category || !goal.amount) {
      Alert.alert('Error', 'Please enter an amount.');
      return;
    }
  
    const isRecurring = goal.isRecurring || false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
  
    setIsUpdating(true);
    try {
      await updateBudgetGoal(goal.category, {
        amount: parseFloat(goal.amount),
        isRecurring: isRecurring,
        year: year,
        month: month,
      }, [month]); // Pass the current month
  
      if (isRecurring) {
        // Update future months if recurring is on
        for (let futureMonth = month + 1; futureMonth <= 12; futureMonth++) {
          await updateBudgetGoal(goal.category, {
            amount: parseFloat(goal.amount),
            isRecurring: isRecurring,
            year: year,
            month: futureMonth,
          }, [futureMonth]);
        }
      } else {
        // If recurring is turned off, delete goals for future months
        for (let futureMonth = month + 1; futureMonth <= 12; futureMonth++) {
          await deleteBudgetGoal(goal.category, year, futureMonth);
        }
      }
  
      setSelectedGoal(null);
      await loadGoals();  // Reload goals after update
      Alert.alert('Success', 'Goal Updated');
    } catch (error) {
      console.error('Error updating budget goal:', error.message);
      Alert.alert('Error', 'Failed to update budget goal. Please try again.');
    } finally {
      setIsUpdating(false);
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
    
    let percentUsed;
    if (budgeted > 0) {
      percentUsed = (spent / budgeted) * 100;
    } else if (spent > 0) {
      percentUsed = 100;
    } else {
      percentUsed = 0;
    }
  
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
          <Text style={styles.goalRecurring}>{goal.isRecurring ? 'Recurring' : 'One-time'}</Text>
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
      <MonthNavigator currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
      
      <TouchableOpacity 
        style={styles.yearlyViewButton} 
        onPress={() => navigation.navigate('YearlyBudget')}
      >
        <Text style={styles.buttonText}>Yearly View</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Budget Goals</Text>
      <Text style={styles.totalBudget}>Total Budget: {formatCurrency(totalBudget)}</Text>
      
      {renderBudgetUsage()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : selectedGoal ? (
        <View style={styles.formContainer}>
          <Text style={styles.selectedCategory}>{selectedGoal.category}</Text>
          <TextInput
            style={styles.input}
            value={selectedGoal.amount.toString()}
            onChangeText={(text) => setSelectedGoal(prev => ({...prev, amount: text}))}
            keyboardType="numeric"
            placeholder="Amount"
          />
          <View style={styles.switchContainer}>
            <Text>Recurring</Text>
            <Switch
              value={selectedGoal.isRecurring}
              onValueChange={(value) => setSelectedGoal(prev => ({...prev, isRecurring: value}))}
            />
          </View>
          <TouchableOpacity 
            style={[styles.updateButton, isUpdating && styles.disabledButton]} 
            onPress={() => handleUpdateGoal(selectedGoal)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Update Goal</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedGoal(null)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.goalsList}>
          <Text style={styles.sectionTitle}>Debt Payments</Text>
          {renderGoalItem({ item: debtPaymentGoal })}
          <Text style={styles.sectionTitle}>Expense Categories</Text>
          <FlatList
            data={budgetGoals.filter(goal => goal.category !== 'Debt Payment')}
            renderItem={renderGoalItem}
            keyExtractor={(item) => item.category}
            scrollEnabled={false}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  yearlyViewButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10,
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
  goalRecurring: {
    fontSize: 14,
    fontStyle: 'italic',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default BudgetGoalsScreen;
