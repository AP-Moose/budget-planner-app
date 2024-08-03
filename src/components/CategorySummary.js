import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EXPENSE_CATEGORIES, getCategoryName } from '../utils/categories';

function CategorySummary({ transactions }) {
  const categorySums = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'expense') {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    }
    return acc;
  }, {});

  const totalExpenses = Object.values(categorySums).reduce((sum, amount) => sum + amount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Summary</Text>
      <Text style={styles.totalExpenses}>Total Expenses: ${totalExpenses.toFixed(2)}</Text>
      {EXPENSE_CATEGORIES.map((category) => {
        const amount = categorySums[category] || 0;
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        return (
          <View key={category} style={styles.categoryItem}>
            <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
              <Text style={styles.categoryPercentage}>({percentage.toFixed(1)}%)</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  totalExpenses: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#F44336',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
  },
});

export default CategorySummary;