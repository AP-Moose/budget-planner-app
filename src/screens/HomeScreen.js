import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, deleteTransaction } from '../services/FirebaseService';
import { getCategoryName } from '../utils/categories';
import SearchBar from '../components/SearchBar';

function HomeScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef(null);

  const loadTransactions = useCallback(async () => {
    try {
      const fetchedTransactions = await getTransactions();
      setTransactions(fetchedTransactions);
      setFilteredTransactions(fetchedTransactions);
      const newBalance = fetchedTransactions.reduce((sum, transaction) => {
        return transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount;
      }, 0);
      setBalance(newBalance);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    const filtered = transactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(query.toLowerCase()) ||
        getCategoryName(transaction.category).toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [transactions]);

  const handleAddTransaction = useCallback((type) => {
    navigation.navigate('AddTransaction', { type });
  }, [navigation]);

  const handleTransactionPress = useCallback((transaction) => {
    navigation.navigate('TransactionDetail', { transaction });
  }, [navigation]);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    try {
      await deleteTransaction(transactionId);
      Alert.alert('Success', 'Transaction deleted successfully');
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
    }
  }, [loadTransactions]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.rowFront}
      onPress={() => handleTransactionPress(item)}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionCategory}>{getCategoryName(item.category)}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
      </Text>
    </TouchableOpacity>
  ), [handleTransactionPress]);

  const renderHiddenItem = useCallback(({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteTransaction(item.id)}
      >
        <Text style={styles.backTextWhite}>Delete</Text>
      </TouchableOpacity>
    </View>
  ), [handleDeleteTransaction]);

  const onRowDidOpen = useCallback((rowKey) => {
    console.log('This row opened', rowKey);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceTitle}>Current Balance</Text>
        <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
      </View>
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search transactions..."
      />
      <SwipeListView
        ref={listRef}
        data={filteredTransactions}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        disableRightSwipe
        keyExtractor={(item) => item.id}
        onRowDidOpen={onRowDidOpen}
        closeOnRowBeginSwipe
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={20}
        updateCellsBatchingPeriod={50}
        windowSize={21}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.addButton, styles.incomeButton]}
          onPress={() => handleAddTransaction('income')}
        >
          <Text style={styles.buttonText}>Add Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addButton, styles.expenseButton]}
          onPress={() => handleAddTransaction('expense')}
        >
          <Text style={styles.buttonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceContainer: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
  },
  balanceTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
  },
  rowFront: {
    backgroundColor: '#FFF',
    borderBottomColor: '#CCC',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: 80,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: 'red',
    right: 0,
  },
  backTextWhite: {
    color: '#FFF',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  addButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default React.memo(HomeScreen);