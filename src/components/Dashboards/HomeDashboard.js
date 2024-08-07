import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBudgetGoals } from '../../services/FirebaseService';

const HomeDashboard = ({ currentMonth, transactions }) => {
  const [actualIncome, setActualIncome] = useState(0);
  const [actualExpenses, setActualExpenses] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      setActualIncome(income);
      setActualExpenses(expenses);
    };

    fetchData();
  }, [transactions]);

  const formatCurrency = (amount) => `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cashFlow = actualIncome - actualExpenses;

  const getCashFlowMessage = () => {
    if (cashFlow > 0) {
      return `Positive cash flow: ${formatCurrency(cashFlow)}`;
    } else if (cashFlow < 0) {
      return `Negative cash flow: ${formatCurrency(cashFlow)}`;
    }
    return 'Cash flow is balanced';
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.boxTitle}>Cash Flow</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Income:</Text>
          <Text style={styles.value}>{formatCurrency(actualIncome)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Expenses:</Text>
          <Text style={styles.value}>{formatCurrency(actualExpenses)}</Text>
        </View>
        <View style={styles.barContainer}>
          <Text style={styles.barLabel}>-</Text>
          <View style={styles.barWrapper}>
            <View style={[
              styles.bar,
              { 
                backgroundColor: cashFlow > 0 ? 'green' : (cashFlow < 0 ? 'red' : 'gray'),
                width: `${Math.abs(cashFlow) / Math.max(actualIncome, actualExpenses) * 50}%`,
                marginLeft: cashFlow >= 0 ? '50%' : `${50 - Math.abs(cashFlow) / Math.max(actualIncome, actualExpenses) * 50}%`
              }
            ]} />
            <View style={styles.barCenter} />
          </View>
          <Text style={styles.barLabel}>+</Text>
        </View>
        <Text style={styles.cashFlowMessage}>{getCashFlowMessage()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  barWrapper: {
    flex: 1,
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  bar: {
    height: '100%',
    position: 'absolute',
  },
  barCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'black',
  },
  barLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  cashFlowMessage: {
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