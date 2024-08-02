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
      {EXPENSE_CATEGORIES.map((category) => {
        const amount = categorySums[category.id] || 0;
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        return (
          <View key={category.id} style={styles.categoryItem}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryAmount}>${amount.toFixed(2)} ({percentage.toFixed(1)}%)</Text>
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CategorySummary;