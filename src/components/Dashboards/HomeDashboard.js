import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBudgetGoals } from '../../services/FirebaseService';

const HomeDashboard = ({ currentMonth, transactions }) => {
  const [budgetLeft, setBudgetLeft] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [actualIncome, setActualIncome] = useState(0);
  const [actualExpenses, setActualExpenses] = useState(0);
  const [incomeGoal, setIncomeGoal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const goals = await getBudgetGoals();
      const totalBudget = goals.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
      setTotalBudget(totalBudget);
      setIncomeGoal(totalBudget); // Set income goal to total budget (estimated monthly expenses)

      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      setActualIncome(income);
      setActualExpenses(expenses);
      setBudgetLeft(totalBudget - expenses);
    };

    fetchData();
  }, [transactions]);

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current {currentMonth.toLocaleString('default', { month: 'long' })} Totals</Text>
      <Text style={styles.item}>Actual Income: {formatCurrency(actualIncome)}</Text>
      <Text style={styles.item}>Actual Expenses: {formatCurrency(actualExpenses)}</Text>
      <Text style={styles.title}>{currentMonth.toLocaleString('default', { month: 'long' })} Budget</Text>
      <Text style={styles.item}>Total Budget: {formatCurrency(totalBudget)}</Text>
      <Text style={[styles.item, budgetLeft > 0 ? styles.positive : styles.negative]}>
        Budget Left: {formatCurrency(Math.abs(budgetLeft))}
        {budgetLeft < 0 ? ' (Over budget)' : ''}
      </Text>
      <Text style={styles.title}>Comparisons</Text>
      <Text style={[styles.item, actualIncome > actualExpenses ? styles.positive : styles.negative]}>
        Income vs Expenses: {formatCurrency(actualIncome - actualExpenses)}
      </Text>
      <Text style={[styles.item, actualIncome > totalBudget ? styles.positive : styles.negative]}>
        Income vs Total Budget: {formatCurrency(actualIncome - totalBudget)}
      </Text>
      <Text style={styles.item}>Income Goal: {formatCurrency(incomeGoal)}</Text>
      <Text style={[styles.item, actualIncome >= incomeGoal ? styles.positive : styles.negative]}>
        Income Goal Progress: {formatCurrency(actualIncome - incomeGoal)}
        {actualIncome >= incomeGoal ? ' (Goal reached!)' : ' (Not reached yet)'}
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
    marginTop: 10,
  },
  item: {
    fontSize: 16,
    marginBottom: 5,
  },
  positive: {
    color: 'green',
  },
  negative: {
    color: 'red',
  },
});

export default HomeDashboard;