import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBudgetGoals, getTransactions } from '../../services/FirebaseService';

const HomeDashboard = () => {
  const [budgetLeft, setBudgetLeft] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const goals = await getBudgetGoals();
      const transactions = await getTransactions();

      const totalBudget = goals.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
      setTotalBudget(totalBudget);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const totalSpent = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear &&
                 t.type === 'expense';
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      setBudgetLeft(totalBudget - totalSpent);
    };

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Budget Summary</Text>
      <Text style={styles.item}>Total Budget: ${totalBudget.toFixed(2)}</Text>
      <Text style={[styles.item, budgetLeft > 0 ? styles.positive : styles.negative]}>
        Budget Left: ${Math.abs(budgetLeft).toFixed(2)}
        {budgetLeft < 0 ? ' (Over budget)' : ''}
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

export default HomeDashboard;