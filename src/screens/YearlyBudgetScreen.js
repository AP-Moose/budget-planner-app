import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { getBudgetGoals, updateBudgetGoal, clearAllBudgetGoals, deleteBudgetGoal } from '../services/FirebaseService';  // Ensure the correct function is imported
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
    try {
      const yearGoals = await getBudgetGoals(selectedYear);
      const yearBudget = {};
      for (let month = 1; month <= 12; month++) {
        yearBudget[month] = EXPENSE_CATEGORIES.reduce((acc, category) => {
          const goal = yearGoals.find(g => g.month === month && g.category === category) || { amount: '0', isRecurring: false };
          acc[category] = goal;
          return acc;
        }, {});
      }
      setYearlyBudget(yearBudget);
    } catch (error) {
      console.error('Error loading yearly budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGoal = async (startMonth, category, amount, isRecurring) => {
    const updatedYearlyBudget = { ...yearlyBudget };

    // Update the current month
    updatedYearlyBudget[startMonth][category] = {
        ...updatedYearlyBudget[startMonth][category],
        amount,
        isRecurring,
    };

    setYearlyBudget(updatedYearlyBudget);

    // Determine the months to update based on whether the goal is recurring
    const monthsToUpdate = isRecurring ? Array.from({ length: 12 - startMonth + 1 }, (_, i) => startMonth + i) : [startMonth];

    // Update in the database for the selected months
    await updateBudgetGoal(category, {
        amount,
        isRecurring,
        year: selectedYear,
    }, selectedYear, monthsToUpdate);

    // If the goal is switched to non-recurring, only then clean up the other months
    if (!isRecurring && startMonth < 12) {
        const monthsToClear = Array.from({ length: 12 - startMonth }, (_, i) => startMonth + i + 1);
        for (const month of monthsToClear) {
            console.log(`Checking and possibly deleting for month ${month}`);
            await deleteBudgetGoal(category, selectedYear, month);
        }
    }
};


  const clearAllGoalsForYear = () => {
    Alert.alert(
      `Clear All Budget Goals`,
      `Clear all budget goals, or just for this year (${selectedYear})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All-Time', onPress: () => confirmClearAllGoals(true) },
        { text: `Clear for ${selectedYear}`, onPress: () => confirmClearAllGoals(false) },
      ],
      { cancelable: true }
    );
  };

  const confirmClearAllGoals = (clearForAllTime) => {
    Alert.alert(
      'Are you sure?',
      clearForAllTime
        ? 'This will delete all of your budget goals for all time that you’ve ever set.'
        : `This will delete all goals for ${selectedYear}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          onPress: async () => {
            await clearAllBudgetGoals(clearForAllTime ? null : selectedYear);
            loadYearlyBudget();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const resetMonthGoals = async (month) => {
    Alert.alert(
        `Reset Budget Goals for ${new Date(selectedYear, month - 1, 1).toLocaleString('default', { month: 'long' })}`,
        'Are you sure you want to reset all goals for this month?',
        [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', onPress: async () => {
                const updatedYearlyBudget = { ...yearlyBudget };
                EXPENSE_CATEGORIES.forEach(async category => {
                    updatedYearlyBudget[month][category] = { amount: '0', isRecurring: false };
                    await deleteBudgetGoal(category, selectedYear, month); // Ensure it deletes the correct month/year
                });
                setYearlyBudget(updatedYearlyBudget);
            }},
        ],
        { cancelable: true }
    );
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
        <TouchableOpacity style={styles.resetButton} onPress={() => resetMonthGoals(month)}>
          <Text style={styles.resetButtonText}>Reset Month</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Back to Monthly</Text>
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
        <TouchableOpacity style={styles.clearButton} onPress={clearAllGoalsForYear}>
          <Text style={styles.clearButtonText}>Clear All Budget Goals</Text>
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
    marginLeft: 10,
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
  resetButton: {
    backgroundColor: '#FF6B6B',
    padding: 5,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  clearButtonText: {
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
