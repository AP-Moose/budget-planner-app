import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBudgetGoals } from '../../services/FirebaseService';

const HomeDashboard = ({ currentMonth, transactions }) => {
  const [budgetLeft, setBudgetLeft] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [actualIncome, setActualIncome] = useState(0);
  const [actualExpenses, setActualExpenses] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const goals = await getBudgetGoals();
      const totalBudget = goals.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
      setTotalBudget(totalBudget);

      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      setActualIncome(income);
      setActualExpenses(expenses);
      setBudgetLeft(totalBudget - expenses);
    };

    fetchData();
  }, [transactions]);

  const formatCurrency = (amount) => `$${Math.abs(amount).toFixed(2)}`;

  const incomeDifference = actualIncome - actualExpenses;
  const budgetUsedPercentage = (actualExpenses / totalBudget) * 100;

  const getIncomeComparisonMessage = () => {
    if (incomeDifference > 0) {
      return `You've earned ${formatCurrency(incomeDifference)} more than you've spent.`;
    } else if (incomeDifference < 0) {
      return `You've spent ${formatCurrency(incomeDifference)} more than you've earned.`;
    }
    return '';
  };

  const getBudgetMessage = () => {
    if (budgetLeft > 0) {
      return `You have ${formatCurrency(budgetLeft)} left in your budget.`;
    } else if (budgetLeft < 0) {
      return `You are ${formatCurrency(budgetLeft)} over budget.`;
    }
    return 'You have used exactly your budget.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.boxTitle}>{currentMonth.toLocaleString('default', { month: 'long' })} Totals</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Actual Expenses:</Text>
          <Text style={styles.value}>{formatCurrency(actualExpenses)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Actual Income:</Text>
          <Text style={styles.value}>{formatCurrency(actualIncome)}</Text>
        </View>
        <View style={styles.barContainer}>
          <View style={[
            styles.bar,
            incomeDifference > 0 ? { backgroundColor: 'green', width: `${Math.min((incomeDifference / actualIncome) * 100, 100)}%` } :
            { backgroundColor: 'red', width: `${Math.min((Math.abs(incomeDifference) / actualExpenses) * 100, 100)}%` }
          ]} />
        </View>
        <Text style={styles.comparisonMessage}>{getIncomeComparisonMessage()}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>Budget Usage</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${budgetUsedPercentage}%`, backgroundColor: budgetLeft >= 0 ? 'green' : 'red' }]} />
        </View>
        <Text style={styles.progressText}>
          {formatCurrency(actualExpenses)}/{formatCurrency(totalBudget)}
        </Text>
        <Text style={styles.budgetMessage}>{getBudgetMessage()}</Text>
      </View>
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
  box: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  barContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 10,
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  comparisonMessage: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 5,
    fontSize: 16,
  },
  budgetMessage: {
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default HomeDashboard;