import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBudgetGoals, getTransactions } from '../../services/FirebaseService';

const BudgetGoalsDashboard = () => {
  const [estimatedExpenses, setEstimatedExpenses] = useState(0);
  const [actualExpenses, setActualExpenses] = useState(0);
  const [targetIncome, setTargetIncome] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const goals = await getBudgetGoals();
      const transactions = await getTransactions();

      const totalEstimated = goals.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
      setEstimatedExpenses(totalEstimated);
      setTargetIncome(totalEstimated);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const totalActual = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear &&
                 t.type === 'expense';
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      setActualExpenses(totalActual);
    };

    fetchData();
  }, []);

  const difference = estimatedExpenses - actualExpenses;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Budget Overview</Text>
      <Text style={styles.item}>Estimated Monthly Expenses: ${estimatedExpenses.toFixed(2)}</Text>
      <Text style={styles.item}>Actual Monthly Expenses: ${actualExpenses.toFixed(2)}</Text>
      <Text style={styles.item}>Target Income: ${targetIncome.toFixed(2)}</Text>
      <Text style={[styles.item, difference > 0 ? styles.underBudget : styles.overBudget]}>
        You are ${Math.abs(difference).toFixed(2)} {difference > 0 ? 'under' : 'over'} budget
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    fontSize: 16,
    marginBottom: 5,
  },
  underBudget: {
    color: 'green',
  },
  overBudget: {
    color: 'red',
  },
});

export default BudgetGoalsDashboard;