import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getTransactions } from '../services/FirebaseService';
import { getCategoryName } from '../utils/categories';

function CategoryDetailScreen({ route }) {
  const { category, amount, type } = route.params;
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadCategoryTransactions();
  }, []);

  const loadCategoryTransactions = async () => {
    try {
      const allTransactions = await getTransactions();
      const categoryTransactions = allTransactions.filter(
        (transaction) => transaction.category === category && transaction.type === type
      );
      setTransactions(categoryTransactions);
    } catch (error) {
      console.error('Error loading category transactions:', error);
    }
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
      </View>
      <Text style={[styles.transactionAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        {type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
      <Text style={[styles.totalAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        Total: {type === 'income' ? '+' : '-'}${amount.toFixed(2)}
      </Text>
      <Text style={styles.transactionsTitle}>Transactions:</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CategoryDetailScreen;