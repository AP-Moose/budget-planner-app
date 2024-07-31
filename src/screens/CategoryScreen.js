import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getTransactions } from '../services/FirebaseService';

function CategoryScreen() {
  const [categories, setCategories] = useState({});

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      const transactions = await getTransactions();
      const categoryTotals = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'expense') {
          acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        }
        return acc;
      }, {});
      setCategories(categoryTotals);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }

  const renderItem = ({ item }) => (
    <View style={styles.categoryItem}>
      <Text style={styles.categoryName}>{item[0]}</Text>
      <Text style={styles.categoryAmount}>${item[1].toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Categories</Text>
      <FlatList
        data={Object.entries(categories)}
        renderItem={renderItem}
        keyExtractor={(item) => item[0]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  categoryName: {
    fontSize: 16,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CategoryScreen;