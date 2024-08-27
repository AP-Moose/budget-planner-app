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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default YearlyBudgetScreen;