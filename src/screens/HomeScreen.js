import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions } from '../services/FirebaseService';
import TransactionList from '../components/TransactionList';

function HomeScreen({ navigation, route }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const loadTransactions = useCallback(async () => {
    try {
      const fetchedTransactions = await getTransactions();
      setTransactions(fetchedTransactions);
      calculateBalance(fetchedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        loadTransactions();
        navigation.setParams({ refresh: undefined });
      }
    }, [route.params?.refresh, loadTransactions, navigation])
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function calculateBalance(transactions) {
    const total = transactions.reduce((acc, transaction) => {
      return transaction.type === 'income' ? acc + transaction.amount : acc - transaction.amount;
    }, 0);
    setBalance(total);
  }

  const handleTransactionPress = useCallback((transaction) => {
    navigation.navigate('TransactionDetail', { transaction });
  }, [navigation]);

  const renderHeader = () => (
    <>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceTitle}>Current Balance</Text>
        <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.incomeButton]}
          onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
        >
          <Text style={styles.buttonText}>Add Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.expenseButton]}
          onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
        >
          <Text style={styles.buttonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
    </>
  );

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={renderHeader}
      data={transactions.slice(0, 5)}
      renderItem={({ item }) => (
        <TransactionList
          transactions={[item]}
          onTransactionPress={handleTransactionPress}
          showTitle={false}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 20,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceTitle: {
    fontSize: 18,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  incomeButton: {
    backgroundColor: '#4CAF50',
  },
  expenseButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
});

export default HomeScreen;