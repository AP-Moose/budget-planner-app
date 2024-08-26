

// File: D:\Coding Projects\budget-planner-app\src\screens\BudgetGoalsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Switch, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBudgetGoals, updateBudgetGoal, getTransactions } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import { useMonth } from '../context/MonthContext';
import { Ionicons } from '@expo/vector-icons';
import MonthNavigator from '../components/MonthNavigator';  // Import the new component

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

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      let fetchedGoals = await getBudgetGoals(year, month);
      
      // Ensure all categories are present
      const allCategories = EXPENSE_CATEGORIES.map(category => {
        const existingGoal = fetchedGoals.find(g => g.category === category);
        return existingGoal || { category, amount: '0', isRecurring: false };
      });

      setBudgetGoals(allCategories);

      const transactions = await getTransactions();
      const currentMonthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth.getMonth() && 
               transactionDate.getFullYear() === currentMonth.getFullYear();
      });

      const expenses = currentMonthTransactions.reduce((acc, t) => {
        if (t.type === 'expense') {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
      }, {});

      setActualExpenses(expenses);

      const total = allCategories.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
      setTotalBudget(total);

      const spent = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
      setTotalSpent(spent);
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

  const handleUpdateGoal = async () => {
    if (!selectedGoal || !selectedGoal.category || !selectedGoal.amount) {
      Alert.alert('Error', 'Please enter an amount.');
      return;
    }
    setIsUpdating(true);
    try {
      await updateBudgetGoal(selectedGoal.category, {
        amount: selectedGoal.amount,
        isRecurring: selectedGoal.isRecurring,
        year: currentMonth.getFullYear(),
        month: currentMonth.getMonth() + 1,
      });

      // If recurring, update future months
      if (selectedGoal.isRecurring) {
        for (let futureMonth = currentMonth.getMonth() + 2; futureMonth <= 12; futureMonth++) {
          await updateBudgetGoal(selectedGoal.category, {
            amount: selectedGoal.amount,
            isRecurring: selectedGoal.isRecurring,
            year: currentMonth.getFullYear(),
            month: futureMonth,
          });
        }
      }

      setSelectedGoal(null);
      await loadGoals();
      Alert.alert('Success', 'Goal Updated');
    } catch (error) {
      console.error('Error updating budget goal:', error);
      Alert.alert('Error', 'Failed to update budget goal. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetGoal = async () => {
    if (!selectedGoal) {
      Alert.alert('Error', 'No goal selected.');
      return;
    }
    setIsUpdating(true);
    try {
      await updateBudgetGoal(selectedGoal.category, { 
        amount: '0',
        isRecurring: false,
        year: currentMonth.getFullYear(),
        month: currentMonth.getMonth() + 1,
      });
      setSelectedGoal(null);
      await loadGoals();
      Alert.alert('Success', 'Goal Reset to $0');
    } catch (error) {
      console.error('Error resetting budget goal:', error);
      Alert.alert('Error', 'Failed to reset budget goal. Please try again.');
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
            onPress={handleUpdateGoal}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Update Goal</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.resetButton, isUpdating && styles.disabledButton]} 
            onPress={handleResetGoal}
            disabled={isUpdating}
          >
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


// File: D:\Coding Projects\budget-planner-app\src\screens\CategoryDetailScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/FirebaseService';
import { getCategoryName, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import RNPickerSelect from 'react-native-picker-select';

function CategoryDetailScreen({ route, navigation }) {
  const { category, type } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadCategoryTransactions = useCallback(async () => {
    try {
      const allTransactions = await getTransactions();
      const categoryTransactions = allTransactions.filter(
        (transaction) => transaction.category === category && transaction.type === type
      );
      setTransactions(categoryTransactions);
      const total = categoryTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading category transactions:', error);
    }
  }, [category, type]);

  useFocusEffect(
    useCallback(() => {
      loadCategoryTransactions();
    }, [loadCategoryTransactions])
  );

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await deleteTransaction(transactionId);
      Alert.alert('Success', 'Transaction deleted successfully');
      loadCategoryTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
    }
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      await updateTransaction(editingTransaction.id, editingTransaction);
      setEditingTransaction(null);
      Alert.alert('Success', 'Transaction updated successfully');
      loadCategoryTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || editingTransaction.date;
    setShowDatePicker(Platform.OS === 'ios');
    setEditingTransaction({ ...editingTransaction, date: currentDate });
  };

  const renderItem = (data) => (
    <TouchableOpacity
      style={styles.rowFront}
      onPress={() => setEditingTransaction(data.item)}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDate}>
          {new Date(data.item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.transactionDescription}>{data.item.description}</Text>
      </View>
      <Text style={[styles.transactionAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        {type === 'income' ? '+' : '-'}${data.item.amount.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteTransaction(data.item.id)}
      >
        <Text style={styles.backTextWhite}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
      <Text style={[styles.totalAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        Total: {type === 'income' ? '+' : '-'}${totalAmount.toFixed(2)}
      </Text>
      <SwipeListView
        data={transactions}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        previewRowKey={'0'}
        previewOpenValue={-40}
        previewOpenDelay={3000}
        keyExtractor={(item) => item.id}
      />
      {editingTransaction && (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={editingTransaction.amount.toString()}
            onChangeText={(text) => setEditingTransaction({...editingTransaction, amount: parseFloat(text) || 0})}
            keyboardType="numeric"
            placeholder="Amount"
          />
          <TextInput
            style={styles.input}
            value={editingTransaction.description}
            onChangeText={(text) => setEditingTransaction({...editingTransaction, description: text})}
            placeholder="Description"
          />
          <RNPickerSelect
            onValueChange={(value) => setEditingTransaction({...editingTransaction, category: value})}
            items={type === 'income' ? INCOME_CATEGORIES.map(cat => ({ label: cat, value: cat })) : EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
            style={pickerSelectStyles}
            value={editingTransaction.category}
            placeholder={{ label: "Select a category", value: null }}
          />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>
              {new Date(editingTransaction.date).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(editingTransaction.date)}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateTransaction}>
            <Text style={styles.buttonText}>Update Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingTransaction(null)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  rowFront: {
    backgroundColor: '#FFF',
    borderBottomColor: '#CCC',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: 80,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
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
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
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
    backgroundColor: '#4CAF50',
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
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
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

export default CategoryDetailScreen;

// File: D:\Coding Projects\budget-planner-app\src\screens\CategoryScreen.js
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryName } from '../utils/categories';
import { PieChart } from 'react-native-svg-charts';
import { useMonth } from '../context/MonthContext';
import { Ionicons } from '@expo/vector-icons';
import MonthNavigator from '../components/MonthNavigator';  // Import the new component

const screenWidth = Dimensions.get('window').width;

function CategoryScreen({ navigation }) {
  const { currentMonth, setCurrentMonth } = useMonth();
  const [expenseCategories, setExpenseCategories] = useState({});
  const [incomeCategories, setIncomeCategories] = useState({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [activeTab, setActiveTab] = useState('expense');

  const loadTransactions = useCallback(async () => {
    try {
      const transactions = await getTransactions();
      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth.getMonth() &&
               transactionDate.getFullYear() === currentMonth.getFullYear();
      });
      
      const expenseSums = {};
      const incomeSums = {};
      let expenseTotal = 0;
      let incomeTotal = 0;

      filteredTransactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          expenseSums[transaction.category] = (expenseSums[transaction.category] || 0) + transaction.amount;
          expenseTotal += transaction.amount;
        } else if (transaction.type === 'income') {
          incomeSums[transaction.category] = (incomeSums[transaction.category] || 0) + transaction.amount;
          incomeTotal += transaction.amount;
        }
      });

      setExpenseCategories(expenseSums);
      setIncomeCategories(incomeSums);
      setTotalExpenses(expenseTotal);
      setTotalIncome(incomeTotal);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleCategoryPress = (category, amount, type) => {
    navigation.navigate('CategoryDetail', { category, amount, type });
  };

  const renderCategoryItem = (item, total, type) => {
    const [categoryId, amount] = item;
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    return (
      <TouchableOpacity 
        style={styles.categoryItem}
        onPress={() => handleCategoryPress(categoryId, amount, type)}
      >
        <Text style={styles.categoryName}>{getCategoryName(categoryId)}</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
          <Text style={styles.categoryPercentage}>({percentage.toFixed(1)}%)</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategories = () => {
    const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    const total = activeTab === 'expense' ? totalExpenses : totalIncome;

    return Object.entries(categories).map((category) => 
      renderCategoryItem(category, total, activeTab)
    );
  };

  const getChartData = () => {
    const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    const total = activeTab === 'expense' ? totalExpenses : totalIncome;
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    return Object.entries(categories).map(([categoryId, amount], index) => ({
      key: categoryId,
      value: amount,
      svg: { fill: colors[index % colors.length] },
      arc: { outerRadius: '100%', padAngle: 0.02 },
      name: getCategoryName(categoryId),
      percentage: ((amount / total) * 100).toFixed(1)
    }));
  };

  return (
    <View style={styles.container}>
      <MonthNavigator currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
          onPress={() => setActiveTab('expense')}
        >
          <Text style={styles.tabText}>Expenses</Text>
          <Text style={styles.tabAmount}>Total: ${totalExpenses.toFixed(2)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={styles.tabText}>Income</Text>
          <Text style={styles.tabAmount}>Total: ${totalIncome.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.title}>
        {activeTab === 'expense' ? 'Monthly Expense Breakdown' : 'Monthly Income Breakdown'}
      </Text>

      <View style={styles.chartContainer}>
        <PieChart
          style={{ height: 200, width: 200 }}
          data={getChartData()}
          innerRadius="50%"
          outerRadius="100%"
        />
      </View>
      <View style={styles.legendContainer}>
        {getChartData().map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.svg.fill }]} />
            <Text style={styles.legendText}>{item.name}</Text>
          </View>
        ))}
      </View>
      <FlatList
        data={renderCategories()}
        renderItem={({ item }) => item}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tabAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
});

export default CategoryScreen;


// File: D:\Coding Projects\budget-planner-app\src\screens\CreditCardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addCreditCard, updateCreditCard, deleteCreditCard, onCreditCardsUpdate, getTransactions } from '../services/FirebaseService';

const CreditCardScreen = () => {
  const [creditCards, setCreditCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: '', limit: '', startingBalance: '', startDate: new Date() });
  const [editingCard, setEditingCard] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [updatingCardIds, setUpdatingCardIds] = useState([]);

  useEffect(() => {
    const unsubscribe = onCreditCardsUpdate((updatedCards) => {
      setCreditCards(updatedCards);
    });

    loadTransactions();

    return () => unsubscribe();
  }, []);

  const loadTransactions = async () => {
    try {
      const fetchedTransactions = await getTransactions();
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
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
        limit: parseFloat(newCard.limit),
        startingBalance: newCard.startingBalance === '' ? 0 : parseFloat(newCard.startingBalance),
        balance: newCard.startingBalance === '' ? 0 : parseFloat(newCard.startingBalance),
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
      console.log('Received updatedCard:', updatedCard);

      if (!updatedCard || typeof updatedCard !== 'object') {
        throw new Error('Invalid card data');
      }

      setUpdatingCardIds(prev => [...prev, id]);

      const cardToUpdate = {
        name: updatedCard.name,
        limit: updatedCard.limit === '' ? 0 : parseFloat(updatedCard.limit),
        startingBalance: updatedCard.startingBalance === '' ? 0 : parseFloat(updatedCard.startingBalance),
        startDate: updatedCard.startDate || new Date(),
      };
      
      console.log('Updating card with data:', cardToUpdate);

      await updateCreditCard(id, cardToUpdate);
      setEditingCard(null);
      
      Alert.alert('Success', 'Credit card updated successfully');
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
                onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? {...c, name: text} : c))}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Credit Limit:</Text>
              <TextInput
                style={styles.input}
                value={item.limit.toString()}
                onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? {...c, limit: text} : c))}
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
                value={item.startingBalance.toString()}
                onChangeText={(text) => setCreditCards(cards => cards.map(c => c.id === item.id ? {...c, startingBalance: text} : c))}
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
          {showDatePicker && (
            <DateTimePicker
              value={new Date(item.startDate)}
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
          <Text>Limit: ${parseFloat(item.limit).toFixed(2)}</Text>
          <Text>Current Balance: ${item.balance.toFixed(2)}</Text>
          <Text>Starting Balance: ${parseFloat(item.startingBalance).toFixed(2)}</Text>
          <Text>Start Date: {new Date(item.startDate).toDateString()}</Text>
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

// File: D:\Coding Projects\budget-planner-app\src\screens\HomeScreen.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Switch, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTransactions, deleteTransaction, addTransaction, updateTransaction, getCreditCards } from '../services/FirebaseService';
import { getCategoryName, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import SearchBar from '../components/SearchBar';
import RNPickerSelect from 'react-native-picker-select';
import HomeDashboard from '../components/Dashboards/HomeDashboard';
import CSVUpload from '../components/CSVUpload';
import { Ionicons } from '@expo/vector-icons';
import { useMonth } from '../context/MonthContext';
import MonthNavigator from '../components/MonthNavigator';  // Import the MonthNavigator component

function HomeScreen({ navigation }) {
  const { currentMonth, setCurrentMonth } = useMonth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newTransaction, setNewTransaction] = useState({ 
    type: 'expense', 
    amount: '', 
    description: '', 
    category: '', 
    date: new Date(), 
    creditCard: false,
    creditCardId: null,
    isCardPayment: false
  });
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [creditCards, setCreditCards] = useState([]);
  const listRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Credit card-related functions
  const toggleCreditCard = () => {
    setNewTransaction(prev => ({ ...prev, creditCard: !prev.creditCard }));
  };

  const handleCreditCardSelection = (creditCardId) => {
    setNewTransaction(prev => ({ ...prev, creditCardId }));
  };

  const toggleIsCardPayment = () => {
    setNewTransaction(prev => ({ ...prev, isCardPayment: !prev.isCardPayment }));
  };

  const loadTransactions = useCallback(async () => {
    try {
      const fetchedTransactions = await getTransactions();
      const filteredByMonth = fetchedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth.getMonth() &&
               transactionDate.getFullYear() === currentMonth.getFullYear();
      });
      setTransactions(filteredByMonth);
      setFilteredTransactions(filteredByMonth);
      const newBalance = filteredByMonth.reduce((sum, transaction) => {
        return transaction.type === 'income' ? sum + parseFloat(transaction.amount) : sum - parseFloat(transaction.amount);
      }, 0);
      setBalance(newBalance);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
    }
  }, [currentMonth]);

  const loadCreditCards = useCallback(async () => {
    try {
      const cards = await getCreditCards();
      setCreditCards(cards);
    } catch (error) {
      console.error('Error loading credit cards:', error);
      Alert.alert('Error', 'Failed to load credit cards. Please try again.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      loadCreditCards();
    }, [loadTransactions, loadCreditCards])
  );

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    const filtered = transactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(query.toLowerCase()) ||
        getCategoryName(transaction.category).toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [transactions]);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              Alert.alert('Success', 'Transaction deleted successfully');
              loadTransactions();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
            }
          }
        }
      ]
    );
  }, [loadTransactions]);

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      await updateTransaction(editingTransaction.id, editingTransaction);
      setEditingTransaction(null);
      Alert.alert('Success', 'Transaction updated successfully');
      loadTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.category) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await addTransaction(newTransaction);
      setNewTransaction({ 
        type: 'expense', 
        amount: '', 
        description: '', 
        category: '', 
        date: new Date(currentMonth), 
        creditCard: false,
        creditCardId: null,
        isCardPayment: false
      });
      setIsAddingTransaction(false);
      Alert.alert('Success', 'Transaction added successfully');
      loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || (editingTransaction ? editingTransaction.date : newTransaction.date);
    if (editingTransaction) {
      setEditingTransaction({ ...editingTransaction, date: currentDate });
    } else {
      setNewTransaction({ ...newTransaction, date: currentDate });
    }
  };

  const handleDoneSelectingDate = () => {
    setShowDatePicker(false);
  };

  const handleDoneEditing = () => {
    Keyboard.dismiss();
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
  };

  const renderItem = useCallback(({ item }) => {
    const creditCard = creditCards.find(card => card.id === item.creditCardId);
    let creditCardInfo = '';
    if (item.creditCard) {
      creditCardInfo = item.isCardPayment
        ? `Card Payment: ${creditCard?.name || 'Unknown'}`
        : `Credit Card: ${creditCard?.name || 'Unknown'}`;
    }

    return (
      <View style={[styles.rowFront, isEditMode ? styles.editModeItem : styles.viewModeItem]}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionCategory}>{getCategoryName(item.category)}</Text>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
          {item.creditCard && (
            <Text style={styles.creditCardIndicator}>{creditCardInfo}</Text>
          )}
        </View>
        <View style={styles.amountAndEditContainer}>
          <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          {isEditMode && (
            <View style={styles.editDeleteContainer}>
              <TouchableOpacity 
                onPress={() => handleEditTransaction(item)}
                style={styles.iconContainer}
              >
                <Ionicons name="pencil" size={24} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDeleteTransaction(item.id)}
                style={styles.iconContainer}
              >
                <Ionicons name="trash-outline" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }, [creditCards, isEditMode, handleDeleteTransaction, handleEditTransaction]);

  const renderAddTransactionForm = () => (
    <View style={styles.addTransactionForm}>
      <View style={styles.switchContainer}>
        <Text>Credit Card Transaction:</Text>
        <Switch
          value={newTransaction.creditCard}
          onValueChange={toggleCreditCard}
        />
      </View>
      {newTransaction.creditCard && (
        <>
          <RNPickerSelect
            onValueChange={handleCreditCardSelection}
            items={creditCards.map(card => ({ label: card.name, value: card.id }))}
            style={pickerSelectStyles}
            value={newTransaction.creditCardId}
            placeholder={{ label: "Select a credit card", value: null }}
          />
          <View style={styles.switchContainer}>
            <Text>Is Card Payment:</Text>
            <Switch
              value={newTransaction.isCardPayment}
              onValueChange={toggleIsCardPayment}
            />
          </View>
        </>
      )}
      <TextInput
        style={styles.input}
        value={newTransaction.amount}
        onChangeText={(text) => setNewTransaction(prev => ({...prev, amount: text}))}
        keyboardType="decimal-pad"
        placeholder="Amount"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        value={newTransaction.description}
        onChangeText={(text) => setNewTransaction(prev => ({...prev, description: text}))}
        placeholder="Description"
        placeholderTextColor="#999"
      />
      <RNPickerSelect
        onValueChange={(value) => setNewTransaction(prev => ({...prev, category: value}))}
        items={newTransaction.type === 'income' ? INCOME_CATEGORIES.map(cat => ({ label: cat, value: cat })) : EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
        style={pickerSelectStyles}
        value={newTransaction.category}
        placeholder={{ label: "Select a category", value: null }}
      />
      <View style={styles.dateContainer}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonText}>
            {new Date(newTransaction.date).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={new Date(newTransaction.date)}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
        <Text style={styles.buttonText}>Add Transaction</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddingTransaction(false)}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <HomeDashboard currentMonth={currentMonth} transactions={transactions} />
        <MonthNavigator currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
        <CSVUpload onTransactionsUpdate={loadTransactions} />
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>{currentMonth.toLocaleString('default', { month: 'long' })} Transactions</Text>
          <TouchableOpacity style={styles.editModeButton} onPress={toggleEditMode}>
            <Text style={styles.editModeButtonText}>{isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}</Text>
          </TouchableOpacity>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search transactions..."
          placeholderTextColor="#999"
        />
        <View style={styles.transactionsContainer}>
          {editingTransaction && (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={editingTransaction.amount.toString()}
                onChangeText={(text) => setEditingTransaction(prev => ({...prev, amount: text}))}
                keyboardType="decimal-pad"
                placeholder="Amount"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                value={editingTransaction.description}
                onChangeText={(text) => setEditingTransaction(prev => ({...prev, description: text}))}
                placeholder="Description"
                placeholderTextColor="#999"
              />
              {!editingTransaction.creditCard && (
                <RNPickerSelect
                  onValueChange={(value) => setEditingTransaction(prev => ({...prev, category: value}))}
                  items={editingTransaction.type === 'income' ? INCOME_CATEGORIES.map(cat => ({ label: cat, value: cat })) : EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))}
                  style={pickerSelectStyles}
                  value={editingTransaction.category}
                  placeholder={{ label: "Select a category", value: null }}
                />
              )}
              <View style={styles.dateContainer}>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateButtonText}>
                    {new Date(editingTransaction.date).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editDateButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.editDateButtonText}>Edit Date</Text>
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(editingTransaction.date)}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdateTransaction}>
                <Text style={styles.buttonText}>Update Transaction</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingTransaction(null)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          <FlatList
            data={filteredTransactions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            initialNumToRender={10}
            maxToRenderPerBatch={20}
            windowSize={21}
          />
        </View>
      </ScrollView>
      {isAddingTransaction ? (
        renderAddTransactionForm()
      ) : (
        <TouchableOpacity 
          style={styles.floatingAddButton} 
          onPress={() => setIsAddingTransaction(true)}
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
  scrollView: {
    flex: 1,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10,
    marginBottom: 5,
  },
  editModeButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
  },
  editModeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  transactionsContainer: {
    flex: 1,
  },
  rowFront: {
    backgroundColor: '#FFF',
    borderBottomColor: '#CCC',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    minHeight: 80,
  },
  editModeItem: {
    opacity: 1,
  },
  viewModeItem: {
    opacity: 0.8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  amountAndEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  editDeleteContainer: {
    flexDirection: 'row',
  },
  iconContainer: {
    padding: 10,
    marginLeft: 5,
  },
  editContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
  floatingAddButton: {
    position: 'absolute',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: 'green',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    opacity: .90
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  editDateButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  editDateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  creditCardIndicator: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  addTransactionForm: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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

export default HomeScreen;

// File: D:\Coding Projects\budget-planner-app\src\screens\LoginScreen.js
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { signIn, signUp, resetPassword } from '../services/FirebaseService';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async () => {
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!validateEmail(sanitizedEmail) || !validatePassword(sanitizedPassword)) {
      Alert.alert('Invalid Input', 'Please enter a valid email and password (at least 8 characters, including uppercase, lowercase, and number).');
      return;
    }

    try {
      if (isLogin) {
        await signIn(sanitizedEmail, sanitizedPassword);
        navigation.navigate('Home');
      } else {
        await signUp(sanitizedEmail, sanitizedPassword);
        Alert.alert('Success', 'Account created successfully. You can now log in.');
        setIsLogin(true);
      }
    } catch (error) {
      console.error('Authentication Error:', error.message);
      Alert.alert('Authentication Error', error.message);
    }
  };

  const handleForgotPassword = async () => {
    const sanitizedEmail = sanitizeInput(email);
    if (!validateEmail(sanitizedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await resetPassword(sanitizedEmail);
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.');
    } catch (error) {
      console.error('Password Reset Error:', error.message);
      Alert.alert('Password Reset Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Budget Planner</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchButtonText}>
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
      {isLogin && (
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  switchButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
  forgotPassword: {
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 16,
  },
});

export default LoginScreen;

// File: D:\Coding Projects\budget-planner-app\src\screens\ReportsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMonth } from '../context/MonthContext';
import { generateReport, exportReportToCSV } from '../services/ReportService';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';

const ReportsScreen = () => {
  const { currentMonth } = useMonth();
  const [reportType, setReportType] = useState(null);
  const [startDate, setStartDate] = useState(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);
  const [isYTD, setIsYTD] = useState(false);

  const reportTypes = [
    {
      category: "Summary Reports",
      reports: [
        { label: 'Monthly Income vs Expense Summary', value: 'monthly-summary' },
        { label: 'Year-to-Date Financial Summary', value: 'ytd-summary' },
        { label: 'Custom Date Range Report', value: 'custom-range' },
      ]
    },
    {
      category: "Expense Analysis",
      reports: [
        { label: 'Category-wise Expense Breakdown', value: 'category-breakdown' },
        { label: 'Expense Trend Analysis', value: 'expense-trend' },
        { label: 'Category Transaction Detail', value: 'category-transaction-detail' },
      ]
    },
    {
      category: "Budget and Savings",
      reports: [
        { label: 'Budget vs Actual Spending Comparison', value: 'budget-vs-actual' },
        { label: 'Savings Rate Report', value: 'savings-rate' },
      ]
    },
    {
      category: "Income and Cash Flow",
      reports: [
        { label: 'Income Sources Analysis', value: 'income-sources' },
        { label: 'Cash Flow Statement', value: 'cash-flow' },
      ]
    },
    {
      category: "Credit Card Reports",
      reports: [
        { label: 'Credit Card Statement', value: 'credit-card-statement' },
        { label: 'Credit Utilization Report', value: 'credit-utilization' },
        { label: 'Payment History Report', value: 'payment-history' },
        { label: 'Debt Reduction Projection', value: 'debt-reduction-projection' },
        { label: 'Category Credit Card Usage', value: 'category-credit-card-usage' },
      ]
    },
  ];

  useEffect(() => {
    updateDateRange();
  }, [reportType, currentMonth, isYTD]);

  const updateDateRange = () => {
    const now = new Date();
    if (isYTD || reportType === 'ytd-summary') {
      setStartDate(new Date(now.getFullYear(), 0, 1));
      setEndDate(now);
    } else if (reportType === 'monthly-summary') {
      setStartDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
      setEndDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
    } else if (reportType === 'expense-trend') {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      setStartDate(new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1));
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }
    // For custom range, don't update the dates here
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (dateInput.seconds) { // Firestore Timestamp
      date = new Date(dateInput.seconds * 1000);
    } else {
      return 'Invalid Date';
    }

    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      timeZone: 'UTC'  // Ensure consistent date output
    }).replace(/\//g, '-');  // Replace slashes with dashes for better formatting
  };

  const handleGenerateReport = async () => {
    if (startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date must be before or equal to end date.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Generating report:', reportType, formatDate(startDate), formatDate(endDate));
      const report = await generateReport(reportType, startDate, endDate);
      console.log('Generated report:', JSON.stringify(report, null, 2));
      setReportData(report);

      // Ensure top expense category and income source are set for YTD summary
      if (reportType === 'ytd-summary' && report) {
        report.topExpenseCategory = report.topExpenseCategory || 'N/A';
        report.topIncomeSource = report.topIncomeSource || 'N/A';
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', `Failed to generate report: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!reportData) {
      Alert.alert('Error', 'Please generate a report first.');
      return;
    }

    try {
      const message = await exportReportToCSV(reportData, reportType);
      Alert.alert('Success', message);
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', `Failed to export report: ${error.message}`);
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '$0.00';
    return `$${Number(value).toFixed(2)}`;
  };

  const renderDateSelection = () => {
    if (isYTD || reportType === 'ytd-summary') {
      return (
        <View style={styles.dateContainer}>
          <Text>Year-to-Date: {startDate.getFullYear()}</Text>
        </View>
      );
    } else if (reportType === 'monthly-summary') {
      return (
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
            <Text>Month: {startDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
            <Text>Start: {formatDate(startDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateButton}>
            <Text>End: {formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  const withErrorHandling = (renderFunction) => {
    return (data) => {
      if (!data || typeof data !== 'object') {
        return <Text style={styles.reportItem}>No data available</Text>;
      }
      try {
        return renderFunction(data);
      } catch (error) {
        console.error('Error rendering report data:', error);
        return <Text style={styles.reportItem}>Error rendering report data: {error.message}</Text>;
      }
    };
  };

  const renderReportData = () => {
    if (!reportData) return null;

    console.log('Rendering report data:', JSON.stringify(reportData, null, 2));

    const renderFunctions = {
      'monthly-summary': withErrorHandling(renderMonthlySummary),
      'ytd-summary': withErrorHandling(renderYTDSummary),
      'custom-range': withErrorHandling(renderCustomRange),
      'category-breakdown': withErrorHandling(renderCategoryBreakdown),
      'budget-vs-actual': withErrorHandling(renderBudgetVsActual),
      'income-sources': withErrorHandling(renderIncomeSources),
      'savings-rate': withErrorHandling(renderSavingsRate),
      'expense-trend': withErrorHandling(renderExpenseTrend),
      'cash-flow': withErrorHandling(renderCashFlow),
      'category-transaction-detail': withErrorHandling(renderCategoryTransactionDetail),
      'credit-card-statement': withErrorHandling(renderCreditCardStatement),
      'credit-utilization': withErrorHandling(renderCreditUtilization),
      'payment-history': withErrorHandling(renderPaymentHistory),
      'debt-reduction-projection': withErrorHandling(renderDebtReductionProjection),
      'category-credit-card-usage': withErrorHandling(renderCategoryCreditCardUsage),
    };

    const renderFunction = renderFunctions[reportType];
    return renderFunction ? renderFunction(reportData) : <Text style={styles.reportItem}>Unknown report type</Text>;
  };

  const renderMonthlySummary = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Monthly Summary</Text>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Total Income:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.totalIncome)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Total Expenses:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.totalExpenses)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Net Savings:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.netSavings)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Savings Rate:</Text>
        <Text style={styles.reportValue}>{data.savingsRate?.toFixed(2) || '0.00'}%</Text>
      </View>
    </View>
  );

  const renderYTDSummary = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Year-to-Date Summary</Text>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Total Income:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.totalIncome)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Total Expenses:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.totalExpenses)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Net Savings:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.netSavings)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>YTD Savings Rate:</Text>
        <Text style={styles.reportValue}>{data.savingsRate?.toFixed(2) || '0.00'}%</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Top Expense Category:</Text>
        <Text style={styles.reportValue}>{data.topExpenseCategory || 'N/A'}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Top Income Source:</Text>
        <Text style={styles.reportValue}>{data.topIncomeSource || 'N/A'}</Text>
      </View>
    </View>
  );

  const renderCustomRange = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Custom Range Report</Text>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Date Range:</Text>
        <Text style={styles.reportValue}>{`${formatDate(data.startDate)} - ${formatDate(data.endDate)}`}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Total Income:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.totalIncome)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Total Expenses:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.totalExpenses)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Net Savings:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data.netSavings)}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Savings Rate:</Text>
        <Text style={styles.reportValue}>{data.savingsRate?.toFixed(2) || '0.00'}%</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Top Expense Category:</Text>
        <Text style={styles.reportValue}>{data.topExpenseCategory || 'N/A'}</Text>
      </View>
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Top Income Source:</Text>
        <Text style={styles.reportValue}>{data.topIncomeSource || 'N/A'}</Text>
      </View>
    </View>
  );

  const renderCategoryBreakdown = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Category Breakdown</Text>
      {EXPENSE_CATEGORIES.map((category) => (
        <View key={category} style={styles.reportRow}>
          <Text style={styles.reportLabel}>{category}:</Text>
          <Text style={styles.reportValue}>{formatCurrency(data[category])}</Text>
        </View>
      ))}
    </View>
  );

  const renderBudgetVsActual = (data) => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Budget vs Actual</Text>
      {data.map((item) => (
        <View key={item.category} style={styles.reportSection}>
        <Text style={styles.reportSubtitle}>{item.category}</Text>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Budgeted:</Text>
          <Text style={styles.reportValue}>{formatCurrency(item.budgeted)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Actual:</Text>
          <Text style={styles.reportValue}>{formatCurrency(item.actual)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Difference:</Text>
          <Text style={[styles.reportValue, item.difference < 0 ? styles.negativeValue : styles.positiveValue]}>
            {formatCurrency(item.difference)}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

const renderIncomeSources = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Income Sources</Text>
    {INCOME_CATEGORIES.map((category) => (
      <View key={category} style={styles.reportRow}>
        <Text style={styles.reportLabel}>{category}:</Text>
        <Text style={styles.reportValue}>{formatCurrency(data[category])}</Text>
      </View>
    ))}
  </View>
);

const renderSavingsRate = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Savings Rate Report</Text>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Total Income:</Text>
      <Text style={styles.reportValue}>{formatCurrency(data.totalIncome)}</Text>
    </View>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Total Expenses:</Text>
      <Text style={styles.reportValue}>{formatCurrency(data.totalExpenses)}</Text>
    </View>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Total Savings:</Text>
      <Text style={styles.reportValue}>{formatCurrency(data.totalSavings)}</Text>
    </View>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Savings Rate:</Text>
      <Text style={styles.reportValue}>{data.savingsRate.toFixed(2)}%</Text>
    </View>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Monthly Average Savings:</Text>
      <Text style={styles.reportValue}>{formatCurrency(data.monthlyAverageSavings)}</Text>
    </View>
  </View>
);

const renderExpenseTrend = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Expense Trend Analysis</Text>
    {data.map((month) => (
      <View key={month.month} style={styles.reportRow}>
        <Text style={styles.reportLabel}>{month.month}:</Text>
        <Text style={styles.reportValue}>{formatCurrency(month.totalExpense)}</Text>
      </View>
    ))}
  </View>
);

const renderCashFlow = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Cash Flow Statement</Text>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Cash Inflow:</Text>
      <Text style={styles.reportValue}>{formatCurrency(data.cashInflow)}</Text>
    </View>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Cash Outflow:</Text>
      <Text style={styles.reportValue}>{formatCurrency(data.cashOutflow)}</Text>
    </View>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Net Cash Flow:</Text>
      <Text style={[styles.reportValue, data.netCashFlow < 0 ? styles.negativeValue : styles.positiveValue]}>
        {formatCurrency(data.netCashFlow)}
      </Text>
    </View>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Credit Card Purchases:</Text>
      <Text style={styles.reportValue}>{formatCurrency(data.creditCardPurchases)}</Text>
    </View>
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>Credit Card Payments:</Text>
      <Text style={styles.reportValue}>{formatCurrency(data.creditCardPayments)}</Text>
    </View>
  </View>
);

const renderCategoryTransactionDetail = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Category Transaction Detail</Text>
    {ALL_CATEGORIES.map((category) => (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.reportSubtitle}>{category}</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.dateHeader}>Date</Text>
          <Text style={styles.amountHeader}>Amount</Text>
          <Text style={styles.descriptionHeader}>Description</Text>
          <Text style={styles.creditCardHeader}>Credit Card</Text>
        </View>
        {data[category] && data[category].map((transaction, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.dateCell}>{formatDate(transaction.date)}</Text>
            <Text style={styles.amountCell}>{formatCurrency(transaction.amount)}</Text>
            <Text style={styles.descriptionCell} numberOfLines={1} ellipsizeMode="tail">
              {transaction.description}
            </Text>
            <Text style={styles.creditCardCell}>{transaction.creditCard ? 'Yes' : 'No'}</Text>
          </View>
        ))}
      </View>
    ))}
  </View>
);

const renderCreditCardStatement = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Credit Card Statement</Text>
    {Object.entries(data).map(([cardName, cardData]) => (
      <View key={cardName} style={styles.creditCardSection}>
        <Text style={styles.reportSubtitle}>{cardName}</Text>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Opening Balance:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.openingBalance)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Purchases:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.purchases)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Payments:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.payments)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Income:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.income)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Closing Balance:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.closingBalance)}</Text>
        </View>
        <Text style={styles.transactionTitle}>Transactions:</Text>
        {cardData.transactions && cardData.transactions.map((transaction, index) => (
          <View key={index} style={styles.transactionRow}>
            <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
            <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
          </View>
        ))}
      </View>
    ))}
  </View>
);

const renderCreditUtilization = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Credit Utilization Report</Text>
    {Object.entries(data).map(([cardName, cardData]) => (
      <View key={cardName} style={styles.creditCardSection}>
        <Text style={styles.reportSubtitle}>{cardName}</Text>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Credit Limit:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.limit)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Current Balance:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.currentBalance)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Available Credit:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.availableCredit)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Utilization:</Text>
          <Text style={styles.reportValue}>{cardData.utilization.toFixed(2)}%</Text>
        </View>
      </View>
    ))}
  </View>
);

const renderPaymentHistory = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Payment History Report</Text>
    {data.map((payment, index) => (
      <View key={index} style={styles.paymentRow}>
        <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
        <Text style={styles.paymentCardName}>{payment.creditCardName}</Text>
        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
      </View>
    ))}
  </View>
);

const renderDebtReductionProjection = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Debt Reduction Projection</Text>
    {Object.entries(data).map(([cardName, cardData]) => (
      <View key={cardName} style={styles.creditCardSection}>
        <Text style={styles.reportSubtitle}>{cardName}</Text>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Current Balance:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.currentBalance)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Avg. Monthly Payment:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.averageMonthlyPayment)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Avg. Monthly Spending:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.averageMonthlySpending)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Net Monthly Payment:</Text>
          <Text style={styles.reportValue}>{formatCurrency(cardData.netMonthlyPayment)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Months to Pay Off:</Text>
          <Text style={styles.reportValue}>{cardData.monthsToPayOff}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Projected Payoff Date:</Text>
          <Text style={styles.reportValue}>{cardData.projectedPayoffDate}</Text>
        </View>
      </View>
    ))}
  </View>
);

const renderCategoryCreditCardUsage = (data) => (
  <View style={styles.reportContainer}>
    <Text style={styles.reportTitle}>Category Credit Card Usage</Text>
    {Object.entries(data).map(([category, categoryData]) => (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.reportSubtitle}>{category}</Text>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Total Amount:</Text>
          <Text style={styles.reportValue}>{formatCurrency(categoryData.totalAmount)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Transaction Count:</Text>
          <Text style={styles.reportValue}>{categoryData.transactionCount}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Avg. Transaction Amount:</Text>
          <Text style={styles.reportValue}>{formatCurrency(categoryData.averageTransactionAmount)}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>Percentage of Total:</Text>
          <Text style={styles.reportValue}>{categoryData.percentageOfTotal.toFixed(2)}%</Text>
        </View>
      </View>
    ))}
  </View>
);

const renderReportTypeModal = () => (
  <Modal
    visible={showReportTypeModal}
    transparent={true}
    animationType="slide"
  >
    <View style={styles.modalContainer}>
      <ScrollView style={styles.modalContent}>
        {reportTypes.map((category, index) => (
          <View key={index}>
            <Text style={styles.categoryHeader}>{category.category}</Text>
            {category.reports.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.modalItem}
                onPress={() => {
                  setReportType(type.value);
                  setShowReportTypeModal(false);
                  setIsYTD(type.value === 'ytd-summary');
                }}
              >
                <Text>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  </Modal>
);

return (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Financial Reports</Text>
    
    <View style={styles.reportTypeContainer}>
      <TouchableOpacity 
        style={styles.reportTypeButton} 
        onPress={() => setShowReportTypeModal(true)}
      >
        <Text style={reportType ? styles.reportTypeText : styles.reportTypePlaceholder}>
          {reportType ? reportTypes.find(category => category.reports.some(report => report.value === reportType))?.reports.find(report => report.value === reportType)?.label : "Select a report to generate..."}
        </Text>
      </TouchableOpacity>
    </View>

    {reportType !== 'ytd-summary' && (
      <TouchableOpacity 
        style={styles.ytdButton} 
        onPress={() => setIsYTD(!isYTD)}
      >
        <Text style={styles.buttonText}>{isYTD ? 'Custom Date Range' : 'Year-to-Date'}</Text>
      </TouchableOpacity>
    )}
    {renderDateSelection()}

    {showStartDatePicker && (
      <DateTimePicker
        value={startDate}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          setShowStartDatePicker(false);
          if (selectedDate) setStartDate(selectedDate);
        }}
      />
    )}

    {showEndDatePicker && (
      <DateTimePicker
      value={endDate}
      mode="date"
      display="default"
      onChange={(event, selectedDate) => {
        setShowEndDatePicker(false);
        if (selectedDate) setEndDate(selectedDate);
      }}
    />
  )}

  <TouchableOpacity style={styles.generateButton} onPress={handleGenerateReport} disabled={isLoading || !reportType}>
    <Text style={styles.buttonText}>{isLoading ? 'Generating...' : 'Generate Report'}</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.exportButton} onPress={handleExportReport} disabled={!reportData || isLoading}>
    <Text style={styles.buttonText}>Export to CSV</Text>
  </TouchableOpacity>

  {isLoading && <ActivityIndicator size="large" color="#0000ff" />}

  <View style={styles.reportContainer}>
    {reportData && renderReportData()}
  </View>

  {renderReportTypeModal()}
</ScrollView>
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
color: '#333',
},
reportTypeContainer: {
borderWidth: 1,
borderColor: '#ccc',
borderRadius: 5,
marginBottom: 20,
backgroundColor: '#fff',
},
reportTypeButton: {
padding: 15,
},
reportTypeText: {
color: '#333',
},
reportTypePlaceholder: {
color: '#999',
},
dateContainer: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 20,
},
dateButton: {
padding: 10,
borderWidth: 1,
borderColor: '#ccc',
borderRadius: 5,
flex: 1,
marginHorizontal: 5,
backgroundColor: '#fff',
},
generateButton: {
backgroundColor: '#4CAF50',
padding: 15,
borderRadius: 5,
alignItems: 'center',
marginBottom: 10,
},
exportButton: {
backgroundColor: '#2196F3',
padding: 15,
borderRadius: 5,
alignItems: 'center',
marginBottom: 20,
},
buttonText: {
color: 'white',
fontWeight: 'bold',
},
reportContainer: {
marginTop: 20,
borderWidth: 1,
borderColor: '#ccc',
borderRadius: 5,
padding: 15,
backgroundColor: '#fff',
},
reportTitle: {
fontSize: 20,
fontWeight: 'bold',
marginBottom: 15,
color: '#333',
},
reportSubtitle: {
fontSize: 16,
fontWeight: 'bold',
marginTop: 10,
marginBottom: 10,
color: '#444',
},
reportSection: {
marginBottom: 15,
},
reportRow: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 5,
},
reportLabel: {
flex: 1,
fontSize: 16,
color: '#555',
},
reportValue: {
fontSize: 16,
fontWeight: 'bold',
color: '#333',
},
positiveValue: {
color: 'green',
},
negativeValue: {
color: 'red',
},
modalContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
modalContent: {
backgroundColor: 'white',
padding: 20,
borderRadius: 10,
width: '80%',
maxHeight: '80%',
},
categoryHeader: {
fontSize: 18,
fontWeight: 'bold',
marginTop: 15,
marginBottom: 10,
color: '#333',
},
modalItem: {
padding: 15,
borderBottomWidth: 1,
borderBottomColor: '#ccc',
},
categorySection: {
marginBottom: 20,
},
tableHeader: {
flexDirection: 'row',
borderBottomWidth: 1,
borderBottomColor: '#ccc',
paddingBottom: 10,
marginBottom: 5,
},
tableRow: {
flexDirection: 'row',
paddingVertical: 4,
borderBottomWidth: 1,
borderBottomColor: '#eee',
},
dateHeader: {
flex: 2,
fontWeight: 'bold',
paddingRight: 5,
},
amountHeader: {
flex: 2,
fontWeight: 'bold',
textAlign: 'left',
paddingRight: 5,
},
descriptionHeader: {
flex: 3,
fontWeight: 'bold',
textAlign: 'left',
},
creditCardHeader: {
flex: 1.5,
fontWeight: 'bold',
textAlign: 'left',
},
dateCell: {
flex: 2,
paddingRight: 5,
fontSize: 10,
},
amountCell: {
flex: 2,
textAlign: 'left',
paddingRight: 5,
fontSize: 10,
},
descriptionCell: {
flex: 3,
fontSize: 10,
},
creditCardCell: {
flex: 1,
textAlign: 'left',
fontSize: 10,
},
ytdButton: {
backgroundColor: '#4CAF50',
padding: 10,
borderRadius: 5,
alignItems: 'center',
marginBottom: 10,
},
creditCardSection: {
marginBottom: 20,
borderWidth: 1,
borderColor: '#ccc',
borderRadius: 5,
padding: 10,
},
transactionTitle: {
fontSize: 16,
fontWeight: 'bold',
marginTop: 10,
marginBottom: 5,
color: '#444',
},
transactionRow: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 5,
},
transactionDate: {
flex: 2.7,
color: '#555',
marginRight: 5,
paddingRight: 5,
},
transactionDescription: {
flex: 4,
color: '#333',
},
transactionAmount: {
flex: 2,
textAlign: 'right',
color: '#333',
},
paymentRow: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 10,
borderBottomWidth: 1,
borderBottomColor: '#ccc',
paddingBottom: 5,
},
paymentDate: {
flex: 1,
color: '#555',
},
paymentCardName: {
flex: 2,
color: '#333',
},
paymentAmount: {
flex: 1,
textAlign: 'right',
color: '#333',
},
});

export default ReportsScreen;

// File: D:\Coding Projects\budget-planner-app\src\screens\UserProfileScreen.js
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { getUserProfile, updateUserProfile, getInvestments, updateInvestment, getLoanInformation, updateLoanInformation } from '../services/FirebaseService';

const UserProfileScreen = ({ navigation }) => {
  const [initialCashBalance, setInitialCashBalance] = useState('');
  const [investments, setInvestments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [newInvestment, setNewInvestment] = useState({ name: '', amount: '', startDate: new Date() });
  const [newLoan, setNewLoan] = useState({ name: '', amount: '', interestRate: '', startDate: new Date() });
  const [showInvestmentDatePicker, setShowInvestmentDatePicker] = useState(false);
  const [showLoanDatePicker, setShowLoanDatePicker] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadInvestments();
    loadLoans();
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

  const loadInvestments = async () => {
    try {
      const fetchedInvestments = await getInvestments();
      setInvestments(fetchedInvestments);
    } catch (error) {
      console.error('Error loading investments:', error);
      Alert.alert('Error', 'Failed to load investments. Please try again.');
    }
  };

  const loadLoans = async () => {
    try {
      const fetchedLoans = await getLoanInformation();
      setLoans(fetchedLoans);
    } catch (error) {
      console.error('Error loading loans:', error);
      Alert.alert('Error', 'Failed to load loans. Please try again.');
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

  const handleAddInvestment = async () => {
    if (!newInvestment.name || !newInvestment.amount) {
      Alert.alert('Error', 'Please enter both name and amount for the investment.');
      return;
    }
    try {
      await updateInvestment({ 
        ...newInvestment, 
        amount: parseFloat(newInvestment.amount),
        startDate: newInvestment.startDate.toISOString()
      });
      setNewInvestment({ name: '', amount: '', startDate: new Date() });
      loadInvestments();
      Alert.alert('Success', 'Investment added successfully');
    } catch (error) {
      console.error('Error adding investment:', error);
      Alert.alert('Error', 'Failed to add investment. Please try again.');
    }
  };

  const handleAddLoan = async () => {
    if (!newLoan.name || !newLoan.amount || !newLoan.interestRate) {
      Alert.alert('Error', 'Please enter name, amount, and interest rate for the loan.');
      return;
    }
    try {
      await updateLoanInformation({ 
        ...newLoan, 
        amount: parseFloat(newLoan.amount),
        interestRate: parseFloat(newLoan.interestRate),
        startDate: newLoan.startDate.toISOString()
      });
      setNewLoan({ name: '', amount: '', interestRate: '', startDate: new Date() });
      loadLoans();
      Alert.alert('Success', 'Loan added successfully');
    } catch (error) {
      console.error('Error adding loan:', error);
      Alert.alert('Error', 'Failed to add loan. Please try again.');
    }
  };

  const onChangeInvestmentDate = (event, selectedDate) => {
    const currentDate = selectedDate || newInvestment.startDate;
    setShowInvestmentDatePicker(Platform.OS === 'ios');
    setNewInvestment({...newInvestment, startDate: currentDate});
  };

  const onChangeLoanDate = (event, selectedDate) => {
    const currentDate = selectedDate || newLoan.startDate;
    setShowLoanDatePicker(Platform.OS === 'ios');
    setNewLoan({...newLoan, startDate: currentDate});
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
          <Text style={styles.sectionTitle}>Investments</Text>
          {investments.map((investment, index) => (
            <View key={index} style={styles.item}>
              <Text>{investment.name}: ${investment.amount.toFixed(2)}</Text>
              <Text>Start Date: {new Date(investment.startDate).toLocaleDateString()}</Text>
            </View>
          ))}
          <TextInput
            style={styles.input}
            value={newInvestment.name}
            onChangeText={(text) => setNewInvestment({...newInvestment, name: text})}
            placeholder="Investment Name"
          />
          <TextInput
            style={styles.input}
            value={newInvestment.amount}
            onChangeText={(text) => setNewInvestment({...newInvestment, amount: text})}
            keyboardType="numeric"
            placeholder="Investment Amount"
          />
          <TouchableOpacity style={styles.input} onPress={() => setShowInvestmentDatePicker(true)}>
            <Text>{newInvestment.startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showInvestmentDatePicker && (
            <DateTimePicker
              testID="investmentDatePicker"
              value={newInvestment.startDate}
              mode="date"
              display="default"
              onChange={onChangeInvestmentDate}
            />
          )}
          <TouchableOpacity style={styles.button} onPress={handleAddInvestment}>
            <Text style={styles.buttonText}>Add Investment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loans</Text>
          {loans.map((loan, index) => (
            <View key={index} style={styles.item}>
              <Text>{loan.name}: ${loan.amount.toFixed(2)} at {loan.interestRate}% interest</Text>
              <Text>Start Date: {new Date(loan.startDate).toLocaleDateString()}</Text>
            </View>
          ))}
          <TextInput
            style={styles.input}
            value={newLoan.name}
            onChangeText={(text) => setNewLoan({...newLoan, name: text})}
            placeholder="Loan Name"
          />
          <TextInput
            style={styles.input}
            value={newLoan.amount}
            onChangeText={(text) => setNewLoan({...newLoan, amount: text})}
            keyboardType="numeric"
            placeholder="Loan Amount"
          />
          <TextInput
            style={styles.input}
            value={newLoan.interestRate}
            onChangeText={(text) => setNewLoan({...newLoan, interestRate: text})}
            keyboardType="numeric"
            placeholder="Interest Rate (%)"
          />
          <TouchableOpacity style={styles.input} onPress={() => setShowLoanDatePicker(true)}>
            <Text>{newLoan.startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showLoanDatePicker && (
            <DateTimePicker
              testID="loanDatePicker"
              value={newLoan.startDate}
              mode="date"
              display="default"
              onChange={onChangeLoanDate}
            />
          )}
          <TouchableOpacity style={styles.button} onPress={handleAddLoan}>
            <Text style={styles.buttonText}>Add Loan</Text>
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
});

export default UserProfileScreen;

// File: D:\Coding Projects\budget-planner-app\src\screens\YearlyBudgetScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { getBudgetGoals, updateBudgetGoal } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import { Ionicons } from '@expo/vector-icons';

const YearlyBudgetScreen = ({ navigation }) => {
  const [yearlyBudget, setYearlyBudget] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadYearlyBudget();
  }, [selectedYear]);

  const loadYearlyBudget = async () => {
    setIsLoading(true);
    const yearBudget = {};
    for (let month = 1; month <= 12; month++) {
      const goals = await getBudgetGoals(selectedYear, month);
      yearBudget[month] = EXPENSE_CATEGORIES.reduce((acc, category) => {
        const goal = goals.find(g => g.category === category) || { amount: '0', isRecurring: false };
        acc[category] = goal;
        return acc;
      }, {});
    }
    setYearlyBudget(yearBudget);
    setTimeout(() => setIsLoading(false), 3000); // Ensure loader shows for at least 3 seconds
  };

  const handleUpdateGoal = async (month, category, amount, isRecurring) => {
    const updatedYearlyBudget = { ...yearlyBudget };
    
    // Update the current month
    updatedYearlyBudget[month][category] = { 
      ...updatedYearlyBudget[month][category], 
      amount, 
      isRecurring 
    };

    // If recurring, update all future months
    if (isRecurring) {
      for (let futureMonth = month + 1; futureMonth <= 12; futureMonth++) {
        updatedYearlyBudget[futureMonth][category] = { 
          ...updatedYearlyBudget[futureMonth][category], 
          amount, 
          isRecurring 
        };
      }
    }

    setYearlyBudget(updatedYearlyBudget);

    // Update in the database
    await updateBudgetGoal(category, {
      amount,
      isRecurring,
      year: selectedYear,
      month,
    });

    // If recurring, update future months in the database
    if (isRecurring) {
      for (let futureMonth = month + 1; futureMonth <= 12; futureMonth++) {
        await updateBudgetGoal(category, {
          amount,
          isRecurring,
          year: selectedYear,
          month: futureMonth,
        });
      }
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const renderMonthlyBudget = (month) => {
    const monthName = new Date(selectedYear, month - 1, 1).toLocaleString('default', { month: 'long' });
    return (
      <View key={month} style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{monthName}</Text>
        {EXPENSE_CATEGORIES.map(category => {
          const goal = yearlyBudget[month]?.[category] || { amount: '0', isRecurring: false };
          return (
            <View key={category} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{category}</Text>
              {editMode ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.input}
                    value={goal.amount.toString()}
                    onChangeText={(text) => handleUpdateGoal(month, category, text, goal.isRecurring)}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Recurring</Text>
                    <Switch
                      value={goal.isRecurring}
                      onValueChange={(value) => handleUpdateGoal(month, category, goal.amount, value)}
                    />
                  </View>
                </View>
              ) : (
                <Text style={styles.budgetAmount}>{formatCurrency(goal.amount)}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yearly Budget</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.yearSelector}>
          <TouchableOpacity onPress={() => setSelectedYear(selectedYear - 1)}>
            <Text style={styles.yearButton}>Previous Year</Text>
          </TouchableOpacity>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <TouchableOpacity onPress={() => setSelectedYear(selectedYear + 1)}>
            <Text style={styles.yearButton}>Next Year</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(!editMode)}>
          <Text style={styles.editButtonText}>{editMode ? 'View Mode' : 'Edit Mode'}</Text>
        </TouchableOpacity>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(renderMonthlyBudget)}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e0e0e0',
  },
  yearButton: {
    color: '#2196F3',
    fontSize: 16,
  },
  yearText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthContainer: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    flex: 1,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    marginRight: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 5,
    fontSize: 12,
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default YearlyBudgetScreen;

// File: D:\Coding Projects\budget-planner-app\src\services\FirebaseService.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc, doc, where, setDoc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseConfig } from '../config';
import { getCategoryType } from '../utils/categories';
import { calculateCreditCardBalance } from '../utils/creditCardUtils';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User signed up successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error.code, error.message);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const getCurrentUser = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? user.uid : 'No user');
    callback(user);
  });
};

export const addTransaction = async (transaction) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const transactionToSave = {
      ...transaction,
      amount: Number(transaction.amount),
      type: getCategoryType(transaction.category),
      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
      userId: user.uid,
      creditCard: Boolean(transaction.creditCard),
      creditCardId: transaction.creditCardId || null,
      isCardPayment: Boolean(transaction.isCardPayment)
    };

    console.log('Attempting to save transaction:', transactionToSave);
    const docRef = await addDoc(collection(db, 'transactions'), transactionToSave);
    console.log('Transaction saved successfully with ID:', docRef.id);

    if (transactionToSave.creditCard && transactionToSave.creditCardId) {
      await updateCreditCardBalance(transactionToSave.creditCardId, transactionToSave.amount, transactionToSave.type, transactionToSave.isCardPayment);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const addMultipleTransactions = async (transactions) => {
  const results = [];
  for (const transaction of transactions) {
    try {
      const id = await addTransaction(transaction);
      results.push({ success: true, id });
    } catch (error) {
      console.error('Error adding transaction in batch:', error);
      results.push({ success: false, error: error.message });
    }
  }
  return results;
};

export const getTransactions = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount),
      date: doc.data().date.toDate(),
      creditCard: Boolean(doc.data().creditCard),
      isCardPayment: Boolean(doc.data().isCardPayment)
    }));
    console.log(`Retrieved ${transactions.length} transactions for user:`, user.uid);
    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw new Error('Failed to fetch transactions. Please try again later.');
  }
};

export const updateTransaction = async (id, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const transactionRef = doc(db, 'transactions', id);
    if (updatedData.category) {
      updatedData.type = getCategoryType(updatedData.category);
    }
    if (updatedData.creditCard !== undefined) {
      updatedData.creditCard = Boolean(updatedData.creditCard);
    }
    if (updatedData.isCardPayment !== undefined) {
      updatedData.isCardPayment = Boolean(updatedData.isCardPayment);
    }
    await updateDoc(transactionRef, updatedData);
    console.log('Transaction updated successfully:', id);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const transactionRef = doc(db, 'transactions', id);
    await deleteDoc(transactionRef);
    console.log('Transaction deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const updateBudgetGoal = async (category, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const goalRef = doc(db, 'budgetGoals', `${user.uid}_${category}`);
    await setDoc(goalRef, {
      ...updatedData,
      userId: user.uid,
      category: category,
      amount: Number(updatedData.amount)
    }, { merge: true });
    console.log('Budget goal updated successfully for category:', category);
  } catch (error) {
    console.error('Error updating budget goal:', error);
    throw error;
  }
};

export const getBudgetGoals = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'budgetGoals'),
      where('userId', '==', user.uid)
    );
    
    const snapshot = await getDocs(q);
    const budgetGoals = snapshot.docs.map(doc => ({
      id: doc.id.split('_')[1],
      ...doc.data(),
      amount: Number(doc.data().amount)
    }));
    console.log(`Retrieved ${budgetGoals.length} budget goals for user:`, user.uid);
    return budgetGoals;
  } catch (error) {
    console.error('Error getting budget goals:', error);
    throw error;
  }
};

export const addCreditCard = async (cardData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const cardToSave = {
      ...cardData,
      userId: user.uid,
      balance: Number(cardData.startingBalance) || 0,
      limit: Number(cardData.limit) || 0,
      startingBalance: Number(cardData.startingBalance) || 0,
      startDate: Timestamp.fromDate(cardData.startDate || new Date()),
      lastUpdated: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(collection(db, 'creditCards'), cardToSave);
    console.log('Credit card added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding credit card:', error);
    throw error;
  }
};

export const getCreditCards = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'creditCards'),
      where('userId', '==', user.uid)
    );
    
    const snapshot = await getDocs(q);
    const transactions = await getTransactions();
    
    const creditCards = snapshot.docs.map(doc => {
      const data = doc.data();
      const card = {
        id: doc.id,
        ...data,
        limit: Number(data.limit) || 0,
        startingBalance: Number(data.startingBalance) || 0,
        startDate: data.startDate ? data.startDate.toDate() : new Date(),
      };
      card.balance = calculateCreditCardBalance(card, transactions);
      return card;
    });
    return creditCards;
  } catch (error) {
    console.error('Error getting credit cards:', error);
    throw error;
  }
};

export const updateCreditCard = async (id, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const cardRef = doc(db, 'creditCards', id);
    const cardDoc = await getDoc(cardRef);
    
    if (cardDoc.exists()) {
      const currentData = cardDoc.data();
      const transactions = await getTransactions();
      const card = {
        id,
        ...currentData,
        ...updatedData,
        startingBalance: updatedData.startingBalance !== undefined ? updatedData.startingBalance : currentData.startingBalance,
        startDate: updatedData.startDate ? new Date(updatedData.startDate) : currentData.startDate,
      };
      const newBalance = calculateCreditCardBalance(card, transactions);

      await updateDoc(cardRef, {
        ...updatedData,
        balance: newBalance,
        limit: updatedData.limit !== undefined ? updatedData.limit : currentData.limit,
        startingBalance: card.startingBalance,
        startDate: Timestamp.fromDate(card.startDate),
        lastUpdated: Timestamp.fromDate(new Date())
      });
      console.log('Credit card updated successfully:', id);
    } else {
      console.error('Credit card not found:', id);
    }
  } catch (error) {
    console.error('Error updating credit card:', error);
    throw error;
  }
};

export const deleteCreditCard = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const cardRef = doc(db, 'creditCards', id);
    await deleteDoc(cardRef);
    console.log('Credit card deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting credit card:', error);
    throw error;
  }
};

const updateCreditCardBalance = async (cardId, amount, transactionType, isCardPayment) => {
  try {
    const cardRef = doc(db, 'creditCards', cardId);
    const cardDoc = await getDoc(cardRef);
    
    if (cardDoc.exists()) {
      const card = cardDoc.data();
      const transactions = await getTransactions();
      const newBalance = calculateCreditCardBalance({...card, id: cardId}, transactions);

      await updateDoc(cardRef, { 
        balance: newBalance,
        lastUpdated: Timestamp.fromDate(new Date())
      });
      console.log('Credit card balance updated:', cardId, 'New balance:', newBalance);
    } else {
      console.error('Credit card not found:', cardId);
    }
  } catch (error) {
    console.error('Error updating credit card balance:', error);
    throw error;
  }
};

export const onCreditCardsUpdate = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    return () => {};
  }

  const q = query(
    collection(db, 'creditCards'),
    where('userId', '==', user.uid)
  );

  return onSnapshot(q, async (snapshot) => {
    const transactions = await getTransactions();
    const creditCards = snapshot.docs.map(doc => {
      const data = doc.data();
      const card = {
        id: doc.id,
        ...data,
        limit: Number(data.limit) || 0,
        startingBalance: Number(data.startingBalance) || 0,
        startDate: data.startDate ? data.startDate.toDate() : new Date(),
      };
      card.balance = calculateCreditCardBalance(card, transactions);
      return card;
    });
    callback(creditCards);
  });
};

export const getInvestments = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const investmentsRef = collection(db, 'investments');
    const q = query(investmentsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting investments:', error);
    throw error;
  }
};

export const updateInvestment = async (investmentData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const investmentRef = doc(db, 'investments', investmentData.id || uuidv4());
    await setDoc(investmentRef, { ...investmentData, userId: user.uid }, { merge: true });
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
};

export const getLoanInformation = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const loansRef = collection(db, 'loans');
    const q = query(loansRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting loan information:', error);
    throw error;
  }
};

export const updateLoanInformation = async (loanData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const loanRef = doc(db, 'loans', loanData.id || uuidv4());
    await setDoc(loanRef, { ...loanData, userId: user.uid }, { merge: true });
  } catch (error) {
    console.error('Error updating loan information:', error);
    throw error;
  }
};

export default {
  signUp,
  signIn,
  logOut,
  resetPassword,
  getCurrentUser,
  addTransaction,
  addMultipleTransactions,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  updateBudgetGoal,
  getBudgetGoals,
  addCreditCard,
  getCreditCards,
  updateCreditCard,
  deleteCreditCard,
  onCreditCardsUpdate,
  getInvestments,
  updateInvestment,
  getLoanInformation,
  updateLoanInformation,
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\balanceSheetReport.js
import { getCreditCards, getInvestments, getLoans, getUserProfile } from '../FirebaseService';

export const generateBalanceSheetReport = async (transactions, asOfDate) => {
  console.log('Generating balance sheet report');
  try {
    const creditCards = await getCreditCards();
    const investments = await getInvestments();
    const loans = await getLoans();
    const userProfile = await getUserProfile();

    // Calculate cash balance
    let cashBalance = userProfile?.initialCashBalance || 0;
    const cashTransactions = transactions.filter(t => !t.creditCard);
    cashBalance += cashTransactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount);
    }, 0);

    // Calculate credit card balances
    const creditCardBalances = creditCards.reduce((acc, card) => {
      acc[card.name] = card.balance;
      return acc;
    }, {});

    // Update credit card balances based on transactions
    transactions.forEach(t => {
      if (t.creditCard && t.creditCardId) {
        if (t.isCardPayment) {
          creditCardBalances[t.creditCardId] = (creditCardBalances[t.creditCardId] || 0) - Number(t.amount);
        } else if (t.type === 'expense') {
          creditCardBalances[t.creditCardId] = (creditCardBalances[t.creditCardId] || 0) + Number(t.amount);
        }
      }
    });

    // Calculate investment values
    const investmentValues = investments.reduce((acc, investment) => {
      acc[investment.id] = investment.amount;
      return acc;
    }, {});

    // Calculate loan balances
    const loanBalances = loans.reduce((acc, loan) => {
      acc[loan.id] = loan.amount;
      return acc;
    }, {});

    // Calculate totals
    const totalAssets = cashBalance + Object.values(investmentValues).reduce((sum, value) => sum + value, 0);
    const totalLiabilities = Object.values(creditCardBalances).reduce((sum, balance) => sum + balance, 0) +
                             Object.values(loanBalances).reduce((sum, balance) => sum + balance, 0);
    const netWorth = totalAssets - totalLiabilities;

    return {
      asOfDate: asOfDate.toISOString(),
      assets: {
        cash: cashBalance,
        investments: investmentValues,
        total: totalAssets
      },
      liabilities: {
        creditCards: creditCardBalances,
        loans: loanBalances,
        total: totalLiabilities
      },
      netWorth: netWorth
    };
  } catch (error) {
    console.error('Error in generateBalanceSheetReport:', error);
    // Return a default structure even if there's an error
    return {
      asOfDate: asOfDate.toISOString(),
      assets: { cash: 0, investments: {}, total: 0 },
      liabilities: { creditCards: {}, loans: {}, total: 0 },
      netWorth: 0
    };
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\budgetReports.js
import { EXPENSE_CATEGORIES } from '../../utils/categories';
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';
import { getBudgetGoals } from '../FirebaseService';

export const generateBudgetVsActual = async (transactions, startDate, endDate) => {
  console.log('Generating budget vs actual');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const budgetGoals = await getBudgetGoals(year, month);

    return Promise.all(EXPENSE_CATEGORIES.map(async (category) => {
      const budgetGoal = budgetGoals.find(goal => goal.category === category);
      const budgeted = budgetGoal ? Number(budgetGoal.amount) : 0;

      const actual = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardActual = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalActual = actual + creditCardActual;

      return {
        category,
        budgeted,
        actual: totalActual,
        difference: budgeted - totalActual
      };
    }));
  } catch (error) {
    console.error('Error in generateBudgetVsActual:', error);
    throw error;
  }
};

export default {
  generateBudgetVsActual,
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\cashFlowReports.js
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateCashFlowStatement = (transactions) => {
  console.log('Generating cash flow statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    const cashInflow = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const cashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      cashInflow,
      cashOutflow,
      netCashFlow,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments,
      details: {
        regularIncome: totals.totalRegularIncome,
        creditCardIncome: totals.totalCreditCardIncome,
        regularExpenses: totals.totalRegularExpenses,
        creditCardPurchases: totals.totalCreditCardPurchases,
        creditCardPayments: totals.totalCreditCardPayments
      }
    };
  } catch (error) {
    console.error('Error in generateCashFlowStatement:', error);
    throw error;
  }
};

export const generateDetailedCashFlowStatement = (transactions) => {
  console.log('Generating detailed cash flow statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    const cashInflow = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const cashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      cashInflow: {
        total: cashInflow,
        regularIncome: totals.totalRegularIncome,
        creditCardIncome: totals.totalCreditCardIncome
      },
      cashOutflow: {
        total: cashOutflow,
        regularExpenses: totals.totalRegularExpenses,
        creditCardPayments: totals.totalCreditCardPayments
      },
      netCashFlow,
      creditCardActivity: {
        purchases: totals.totalCreditCardPurchases,
        payments: totals.totalCreditCardPayments
      },
      nonCashExpenses: totals.totalCreditCardPurchases,
      netIncomeEffect: cashInflow - (totals.totalRegularExpenses + totals.totalCreditCardPurchases)
    };
  } catch (error) {
    console.error('Error in generateDetailedCashFlowStatement:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\categoryCreditCardUsage.js
import { EXPENSE_CATEGORIES } from '../../utils/categories';

export const generateCategoryCreditCardUsage = (transactions) => {
  console.log('Generating category-specific credit card usage report');
  try {
    const creditCardTransactions = transactions.filter(t => t.creditCard && !t.isCardPayment);
    const report = {};

    EXPENSE_CATEGORIES.forEach(category => {
      const categoryTransactions = creditCardTransactions.filter(t => t.category === category);
      const totalAmount = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const transactionCount = categoryTransactions.length;

      report[category] = {
        totalAmount: totalAmount,
        transactionCount,
        averageTransactionAmount: transactionCount > 0 ? totalAmount / transactionCount : 0
      };
    });

    // Calculate percentages
    const totalCreditCardSpending = Object.values(report).reduce((sum, cat) => sum + cat.totalAmount, 0);
    Object.keys(report).forEach(category => {
      report[category].percentageOfTotal = totalCreditCardSpending > 0 
        ? (report[category].totalAmount / totalCreditCardSpending) * 100 
        : 0;
    });

    return report;
  } catch (error) {
    console.error('Error in generateCategoryCreditCardUsage:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\categoryReports.js
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, getCategoryType } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';

export const generateCategoryBreakdown = (transactions) => {
  console.log('Generating category breakdown');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const categories = {};

    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      categories[category] = regularExpenses + creditCardExpenses;
    });

    return categories;
  } catch (error) {
    console.error('Error in generateCategoryBreakdown:', error);
    throw error;
  }
};

export const generateCategoryTransactionDetail = (transactions) => {
  console.log('Generating category transaction detail');
  try {
    const categoryTransactions = {};
    ALL_CATEGORIES.forEach(category => {
      categoryTransactions[category] = [];
    });

    transactions.forEach(t => {
      categoryTransactions[t.category].push({
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        creditCard: t.creditCard,
        isCardPayment: t.isCardPayment
      });
    });

    // Sort transactions within each category by date
    Object.keys(categoryTransactions).forEach(category => {
      categoryTransactions[category].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return categoryTransactions;
  } catch (error) {
    console.error('Error in generateCategoryTransactionDetail:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\creditCardReports.js
import { categorizeTransactions } from '../../utils/reportUtils';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

export const generateCreditCardStatement = (transactions, creditCards, startDate, endDate) => {
  console.log('Generating credit card statement');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const creditCardStatement = {};

    creditCards.forEach(card => {
      const openingBalance = calculateCreditCardBalance(card, transactions.filter(t => new Date(t.date) < startDate));
      const closingBalance = calculateCreditCardBalance(card, transactions.filter(t => new Date(t.date) <= endDate));

      const cardTransactions = transactions.filter(t => 
        t.creditCardId === card.id &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      );

      const purchases = cardTransactions.filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const payments = cardTransactions.filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const income = cardTransactions.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      creditCardStatement[card.name] = {
        openingBalance: openingBalance.toFixed(2),
        purchases: purchases.toFixed(2),
        payments: payments.toFixed(2),
        income: income.toFixed(2),
        closingBalance: closingBalance.toFixed(2),
        transactions: cardTransactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount.toFixed(2),
          type: t.type,
          isCardPayment: t.isCardPayment
        }))
      };
    });

    return creditCardStatement;
  } catch (error) {
    console.error('Error in generateCreditCardStatement:', error);
    throw error;
  }
};

export default {
  generateCreditCardStatement
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\creditUtilizationReport.js
import { getCreditCards } from '../FirebaseService';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

export const generateCreditUtilizationReport = async (transactions) => {
  console.log('Generating credit utilization report');
  try {
    const creditCards = await getCreditCards();
    const report = {};

    for (const card of creditCards) {
      const currentBalance = calculateCreditCardBalance(card, transactions);
      const utilization = (currentBalance / card.limit) * 100;

      report[card.name] = {
        limit: card.limit,
        currentBalance: currentBalance.toFixed(2),
        availableCredit: (card.limit - currentBalance).toFixed(2),
        utilization: utilization.toFixed(2)
      };
    }

    return report;
  } catch (error) {
    console.error('Error in generateCreditUtilizationReport:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\csvExport.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const exportReportToCSV = async (reportData, reportType) => {
  console.log('Exporting report to CSV', reportType);
  let csvContent = '';

  try {
    switch (reportType) {
      case 'monthly-summary':
      case 'savings-rate':
        csvContent = `Total Income,Total Expenses,Net Savings,Savings Rate,Credit Card Purchases,Credit Card Payments\n${reportData.totalIncome},${reportData.totalExpenses},${reportData.netSavings},${reportData.savingsRate}%,${reportData.creditCardPurchases},${reportData.creditCardPayments}`;
        break;
      case 'category-breakdown':
      case 'income-sources':
        csvContent = 'Category,Amount\n';
        Object.entries(reportData).forEach(([category, amount]) => {
          csvContent += `${category},${amount}\n`;
        });
        break;
      case 'budget-vs-actual':
        csvContent = 'Category,Budgeted,Actual,Difference\n';
        reportData.forEach(item => {
          csvContent += `${item.category},${item.budgeted},${item.actual},${item.difference}\n`;
        });
        break;
      case 'ytd-summary':
      case 'custom-range':
        csvContent = 'Total Income,Total Expenses,Net Savings,Savings Rate,Credit Card Purchases,Credit Card Payments\n';
        csvContent += `${reportData.totalIncome},${reportData.totalExpenses},${reportData.netSavings},${reportData.savingsRate}%,${reportData.creditCardPurchases},${reportData.creditCardPayments}\n\n`;
        csvContent += 'Top Expenses\nCategory,Amount\n';
        reportData.topExpenses.forEach(expense => {
          csvContent += `${expense.category},${expense.amount}\n`;
        });
        break;
      case 'expense-trend':
        csvContent = 'Month,Total Expense,Credit Card Purchases\n';
        reportData.forEach(item => {
          csvContent += `${item.month},${item.totalExpense},${item.creditCardPurchases}\n`;
        });
        break;
      case 'cash-flow':
        csvContent = 'Cash Inflow,Cash Outflow,Credit Card Purchases,Credit Card Payments,Net Cash Flow\n';
        csvContent += `${reportData.cashInflow},${reportData.cashOutflow},${reportData.creditCardPurchases},${reportData.creditCardPayments},${reportData.netCashFlow}`;
        break;
      case 'category-transaction-detail':
        csvContent = 'Category,Date,Amount,Description,Credit Card,Is Card Payment\n';
        Object.entries(reportData).forEach(([category, transactions]) => {
          transactions.forEach(t => {
            csvContent += `${category},${t.date},${t.amount},${t.description},${t.creditCard},${t.isCardPayment}\n`;
          });
        });
        break;
      case 'credit-card-statement':
        csvContent = 'Credit Card,Opening Balance,Purchases,Payments,Income,Closing Balance\n';
        Object.entries(reportData).forEach(([cardName, cardData]) => {
          csvContent += `${cardName},${cardData.openingBalance},${cardData.purchases},${cardData.payments},${cardData.income},${cardData.closingBalance}\n`;
        });
        csvContent += '\nTransactions\n';
        csvContent += 'Credit Card,Date,Description,Amount,Type\n';
        Object.entries(reportData).forEach(([cardName, cardData]) => {
          cardData.transactions.forEach(t => {
            csvContent += `${cardName},${t.date},${t.description},${t.amount},${t.type}\n`;
          });
        });
        break;
      default:
        throw new Error('Invalid report type for CSV export');
    }

    const fileName = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Report CSV' });
    return 'CSV exported successfully. You can now choose where to save or share the file.';
  } catch (error) {
    console.error('Error in exportReportToCSV:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\debtReductionProjection.js
import { getCreditCards } from '../FirebaseService';
import { calculateCreditCardBalance } from '../../utils/creditCardUtils';

const calculateMonthsBetweenDates = (date1, date2) => {
  return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
};

export const generateDebtReductionProjection = async (transactions) => {
  console.log('Generating debt reduction projection');
  try {
    const creditCards = await getCreditCards();
    const report = {};
    const currentDate = new Date();

    for (const card of creditCards) {
      const cardStartDate = new Date(card.startDate);
      const cardTransactions = transactions.filter(t => 
        t.creditCardId === card.id && new Date(t.date) >= cardStartDate
      );
      
      const monthsCovered = calculateMonthsBetweenDates(cardStartDate, currentDate);

      const totalPayments = cardTransactions
        .filter(t => t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalSpending = cardTransactions
        .filter(t => t.type === 'expense' && !t.isCardPayment)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const averageMonthlyPayment = monthsCovered > 0 ? totalPayments / monthsCovered : 0;
      const averageMonthlySpending = monthsCovered > 0 ? totalSpending / monthsCovered : 0;

      const netMonthlyPayment = averageMonthlyPayment - averageMonthlySpending;
      const currentBalance = calculateCreditCardBalance(card, transactions);
      const monthsToPayOff = netMonthlyPayment > 0 ? Math.ceil(currentBalance / netMonthlyPayment) : Infinity;

      report[card.name] = {
        currentBalance: currentBalance.toFixed(2),
        startDate: card.startDate,
        averageMonthlyPayment: averageMonthlyPayment.toFixed(2),
        averageMonthlySpending: averageMonthlySpending.toFixed(2),
        netMonthlyPayment: netMonthlyPayment.toFixed(2),
        monthsToPayOff: monthsToPayOff === Infinity ? 'N/A' : monthsToPayOff,
        projectedPayoffDate: monthsToPayOff === Infinity ? 'N/A' : new Date(currentDate.getTime() + monthsToPayOff * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
    }

    return report;
  } catch (error) {
    console.error('Error in generateDebtReductionProjection:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\incomeReports.js
import { INCOME_CATEGORIES } from '../../utils/categories';
import { categorizeTransactions } from '../../utils/reportUtils';

export const generateIncomeSourcesAnalysis = (transactions) => {
  console.log('Generating income sources analysis');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const incomeSources = {};

    INCOME_CATEGORIES.forEach(category => {
      const regularIncome = categorizedTransactions.regularIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardIncome = categorizedTransactions.creditCardIncome
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      incomeSources[category] = regularIncome + creditCardIncome;
    });

    return incomeSources;
  } catch (error) {
    console.error('Error in generateIncomeSourcesAnalysis:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\index.js
import { getTransactions, getBudgetGoals, getCreditCards } from '../FirebaseService';
import * as summaryReports from './summaryReports';
import * as categoryReports from './categoryReports';
import * as budgetReports from './budgetReports';
import * as incomeReports from './incomeReports';
import * as savingsReports from './savingsReports';
import * as trendReports from './trendReports';
import * as cashFlowReports from './cashFlowReports';
import * as creditCardReports from './creditCardReports';
import { exportReportToCSV } from './csvExport';
import { generateCreditUtilizationReport } from './creditUtilizationReport';
import { generatePaymentHistoryReport } from './paymentHistoryReport';
import { generateDebtReductionProjection } from './debtReductionProjection';
import { generateCategoryCreditCardUsage } from './categoryCreditCardUsage';
import { generateBalanceSheetReport } from './balanceSheetReport';

export const generateReport = async (reportType, startDate, endDate) => {
  try {
    console.log('Fetching transactions, budget goals, and credit cards');
    const transactions = await getTransactions();
    const budgetGoals = await getBudgetGoals();
    const creditCards = await getCreditCards();
    
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    console.log('Filtered transactions:', filteredTransactions.length);

    switch (reportType) {
      case 'monthly-summary':
        return summaryReports.generateMonthlySummary(filteredTransactions);
      case 'category-breakdown':
        return categoryReports.generateCategoryBreakdown(filteredTransactions);
      case 'budget-vs-actual':
        return budgetReports.generateBudgetVsActual(filteredTransactions, budgetGoals);
      case 'income-sources':
        return incomeReports.generateIncomeSourcesAnalysis(filteredTransactions);
      case 'savings-rate':
        return savingsReports.generateSavingsRateReport(filteredTransactions);
      case 'ytd-summary':
      case 'custom-range':
        return summaryReports.generateCustomRangeReport(filteredTransactions);
      case 'expense-trend':
        return trendReports.generateExpenseTrendAnalysis(filteredTransactions);
      case 'cash-flow':
        return cashFlowReports.generateCashFlowStatement(filteredTransactions);
      case 'detailed-cash-flow':
        return cashFlowReports.generateDetailedCashFlowStatement(filteredTransactions);
      case 'category-transaction-detail':
        return categoryReports.generateCategoryTransactionDetail(filteredTransactions);
      case 'credit-card-statement':
        return creditCardReports.generateCreditCardStatement(filteredTransactions, creditCards, startDate, endDate);
      case 'credit-utilization':
        return generateCreditUtilizationReport(filteredTransactions);
      case 'payment-history':
        return generatePaymentHistoryReport(filteredTransactions);
      case 'debt-reduction-projection':
        return generateDebtReductionProjection(filteredTransactions);
      case 'category-credit-card-usage':
        return generateCategoryCreditCardUsage(filteredTransactions);
      case 'balance-sheet':
        return generateBalanceSheetReport(filteredTransactions, endDate);
      default:
        throw new Error('Invalid report type');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export { exportReportToCSV };

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\paymentHistoryReport.js
import { getCreditCards } from '../FirebaseService';

export const generatePaymentHistoryReport = async (transactions) => {
  console.log('Generating payment history report');
  try {
    const creditCards = await getCreditCards();
    const creditCardMap = creditCards.reduce((map, card) => {
      map[card.id] = card.name;
      return map;
    }, {});

    const creditCardPayments = transactions.filter(t => t.creditCard && t.isCardPayment);
    
    const paymentHistory = creditCardPayments.map(payment => ({
      date: new Date(payment.date).toLocaleDateString(),
      amount: Number(payment.amount).toFixed(2),
      creditCardId: payment.creditCardId,
      creditCardName: creditCardMap[payment.creditCardId] || 'Unknown Card'
    }));

    return paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error in generatePaymentHistoryReport:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\savingsReports.js
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateSavingsRateReport = (transactions) => {
  console.log('Generating savings rate report');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const totalExpenses = totals.totalRegularExpenses + totals.totalCreditCardPurchases;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments
    };
  } catch (error) {
    console.error('Error in generateSavingsRateReport:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\summaryReports.js
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';
import { EXPENSE_CATEGORIES } from '../../utils/categories';

export const generateMonthlySummary = (transactions) => {
  console.log('Generating monthly summary');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const totals = calculateTotals(categorizedTransactions);

    const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
    const totalExpenses = totals.totalRegularExpenses + totals.totalCreditCardPurchases;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      creditCardPurchases: totals.totalCreditCardPurchases,
      creditCardPayments: totals.totalCreditCardPayments
    };
  } catch (error) {
    console.error('Error in generateMonthlySummary:', error);
    throw error;
  }
};

export const generateCustomRangeReport = (transactions) => {
  console.log('Generating custom range report');
  try {
    const summary = generateMonthlySummary(transactions);
    const categorizedTransactions = categorizeTransactions(transactions);
    
    const expenseBreakdown = {};
    EXPENSE_CATEGORIES.forEach(category => {
      const regularExpenses = categorizedTransactions.regularExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const creditCardExpenses = categorizedTransactions.creditCardPurchases
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      expenseBreakdown[category] = regularExpenses + creditCardExpenses;
    });

    const topExpenses = Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    return {
      ...summary,
      topExpenses
    };
  } catch (error) {
    console.error('Error in generateCustomRangeReport:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\services\ReportService\trendReports.js
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';

export const generateExpenseTrendAnalysis = (transactions) => {
  console.log('Generating expense trend analysis');
  try {
    const categorizedTransactions = categorizeTransactions(transactions);
    const monthlyExpenses = {};

    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyExpenses[month]) {
        monthlyExpenses[month] = {
          regularExpenses: 0,
          creditCardPurchases: 0
        };
      }
      
      if (t.type === 'expense') {
        if (t.creditCard && !t.isCardPayment) {
          monthlyExpenses[month].creditCardPurchases += Number(t.amount);
        } else if (!t.creditCard) {
          monthlyExpenses[month].regularExpenses += Number(t.amount);
        }
      }
    });

    return Object.entries(monthlyExpenses).map(([month, expenses]) => ({
      month,
      totalExpense: expenses.regularExpenses + expenses.creditCardPurchases,
      regularExpenses: expenses.regularExpenses,
      creditCardPurchases: expenses.creditCardPurchases
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  } catch (error) {
    console.error('Error in generateExpenseTrendAnalysis:', error);
    throw error;
  }
};

// File: D:\Coding Projects\budget-planner-app\src\utils\categories.js
export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance/Contract Work',
  'Investments',
  'Gifts',
  'Other Income'
];

export const EXPENSE_CATEGORIES = [
  'Housing (Rent/Mortgage)',
  'Utilities',
  'Groceries',
  'Transportation',
  'Healthcare',
  'Insurance',
  'Dining Out/Takeaway',
  'Entertainment',
  'Shopping',
  'Education',
  'Debt Payment',
  'Savings/Investments',
  'Miscellaneous/Other'
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryType(category) {
  return INCOME_CATEGORIES.includes(category) ? 'income' : 'expense';
}

export function getCategoryName(category) {
  return ALL_CATEGORIES.find(cat => cat === category) || 'Unknown Category';
}

// File: D:\Coding Projects\budget-planner-app\src\utils\creditCardUtils.js
export const calculateCreditCardBalance = (card, transactions) => {
    let balance = Number(card.startingBalance);
    const startDate = new Date(card.startDate);
  
    const relevantTransactions = transactions.filter(t => 
      t.creditCardId === card.id &&
      new Date(t.date) >= startDate
    );
  
    relevantTransactions.forEach(t => {
      if (t.type === 'expense' && !t.isCardPayment) {
        balance += Number(t.amount);
      } else if (t.isCardPayment || t.type === 'income') {
        balance -= Number(t.amount);
      }
    });
  
    return balance;
  };

// File: D:\Coding Projects\budget-planner-app\src\utils\financialCalculations.js
export const calculateTotalAssets = (cashBalance, investments) => {
    const investmentTotal = Object.values(investments).reduce((sum, value) => sum + value, 0);
    return cashBalance + investmentTotal;
  };
  
  export const calculateTotalLiabilities = (creditCardBalances, loans) => {
    const creditCardTotal = Object.values(creditCardBalances).reduce((sum, balance) => sum + balance, 0);
    const loanTotal = Object.values(loans).reduce((sum, balance) => sum + balance, 0);
    return creditCardTotal + loanTotal;
  };
  
  export const calculateNetWorth = (totalAssets, totalLiabilities) => {
    return totalAssets - totalLiabilities;
  };
  
  export const calculateCreditUtilization = (creditCardBalances, creditCards) => {
    let totalBalance = 0;
    let totalLimit = 0;
  
    creditCards.forEach(card => {
      totalBalance += creditCardBalances[card.id] || 0;
      totalLimit += card.limit;
    });
  
    return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  };

// File: D:\Coding Projects\budget-planner-app\src\utils\helpers.js
export const calculateTotalIncome = (transactions) => {
    return transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  };
  
  export const calculateTotalExpenses = (transactions) => {
    return transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };
  
  export const calculateRemainingBalance = (transactions) => {
    return transactions.reduce((balance, t) => balance + t.amount, 0);
  };
  

// File: D:\Coding Projects\budget-planner-app\src\utils\reportUtils.js
export const categorizeTransactions = (transactions) => {
  return {
    regularIncome: transactions.filter(t => t.type === 'income' && !t.creditCard),
    regularExpenses: transactions.filter(t => t.type === 'expense' && !t.creditCard),
    creditCardPurchases: transactions.filter(t => t.type === 'expense' && t.creditCard && !t.isCardPayment),
    creditCardPayments: transactions.filter(t => t.type === 'expense' && t.creditCard && t.isCardPayment),
    creditCardIncome: transactions.filter(t => t.type === 'income' && t.creditCard),
  };
};

export const calculateTotals = (categorizedTransactions) => {
  const sumAmount = (transactions) => transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    totalRegularIncome: sumAmount(categorizedTransactions.regularIncome),
    totalRegularExpenses: sumAmount(categorizedTransactions.regularExpenses),
    totalCreditCardPurchases: sumAmount(categorizedTransactions.creditCardPurchases),
    totalCreditCardPayments: sumAmount(categorizedTransactions.creditCardPayments),
    totalCreditCardIncome: sumAmount(categorizedTransactions.creditCardIncome),
  };
};

// File: D:\Coding Projects\budget-planner-app\src\utils\validation.js
export const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };
  
  export const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return re.test(password);
  };
  
  export const sanitizeInput = (input) => {
    // Remove any HTML tags and trim whitespace
    return input.replace(/<[^>]*>?/gm, '').trim();
  };
  
  export const validateAmount = (amount) => {
    return !isNaN(amount) && parseFloat(amount) > 0;
  };
  
  export const validateDate = (date) => {
    return !isNaN(Date.parse(date));
  };
  
  export const validateCategory = (category, validCategories) => {
    return validCategories.includes(category);
  };