import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBudgetGoals, getTransactions } from '../../services/FirebaseService';

const BudgetGoalsDashboard = () => {
  const [estimatedExpenses, setEstimatedExpenses] = useState(0);
  const [actualExpenses, setActualExpenses] = useState(0);
  const [actualIncome, setActualIncome] = useState(0);
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const goals = await getBudgetGoals();
      const transactions = await getTransactions();

      const totalEstimated = goals.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
      setEstimatedExpenses(totalEstimated);

      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long' });
      setCurrentMonth(currentMonthName);

      const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      });

      const totalActualExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      setActualExpenses(totalActualExpenses);

      const totalActualIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      setActualIncome(totalActualIncome);
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentMonth} Budget Overview</Text>
      <Text style={styles.item}>Estimated {currentMonth} Expenses: {formatCurrency(estimatedExpenses)}</Text>
      <Text style={styles.item}>Actual {currentMonth} Expenses: {formatCurrency(actualExpenses)}</Text>
      <Text style={styles.item}>Actual {currentMonth} Income: {formatCurrency(actualIncome)}</Text>
      <Text style={styles.item}>Income Goal: {formatCurrency(estimatedExpenses)}</Text>
      <Text style={[styles.item, actualIncome >= estimatedExpenses ? styles.positive : styles.negative]}>
        Income vs Estimated Expenses: {formatCurrency(actualIncome - estimatedExpenses)}
      </Text>
      <Text style={[styles.item, actualIncome >= estimatedExpenses ? styles.positive : styles.negative]}>
        Income Goal Progress: {formatCurrency(actualIncome - estimatedExpenses)}
        {actualIncome >= estimatedExpenses ? ' (Goal reached!)' : ' (Not reached yet)'}
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
  positive: {
    color: 'green',
  },
  negative: {
    color: 'red',
  },
});

export default BudgetGoalsDashboard;