import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

function TransactionList({ transactions }) {
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionItem} 
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, item.type === 'income' ? styles.income : styles.expense]}>
          ${item.amount.toFixed(2)}
        </Text>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 15,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
});

export default TransactionList;