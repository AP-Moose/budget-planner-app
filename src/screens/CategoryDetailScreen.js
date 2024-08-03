import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, deleteTransaction } from '../services/FirebaseService';
import { getCategoryName } from '../utils/categories';

function CategoryDetailScreen({ route, navigation }) {
  const { category, type } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const loadCategoryTransactions = useCallback(async () => {
    try {
      const allTransactions = await getTransactions();
      const categoryTransactions = allTransactions.filter(
        (transaction) => transaction.category === category && transaction.type === type
      );
      setTransactions(categoryTransactions);
      const total = categoryTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading category transactions:', error);
    }
  }, [category, type]);

  useFocusEffect(
    useCallback(() => {
      loadCategoryTransactions();
    }, [loadCategoryTransactions])
  );

  const handleTransactionPress = (transaction) => {
    navigation.navigate('TransactionDetail', { transaction });
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await deleteTransaction(transactionId);
      Alert.alert('Success', 'Transaction deleted successfully');
      loadCategoryTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
    }
  };

  const renderItem = (data) => (
    <TouchableOpacity
      style={styles.rowFront}
      onPress={() => handleTransactionPress(data.item)}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDate}>
          {new Date(data.item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.transactionDescription}>{data.item.description}</Text>
      </View>
      <Text style={[styles.transactionAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        {type === 'income' ? '+' : '-'}${data.item.amount.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDeleteTransaction(data.item.id)}
      >
        <Text style={styles.backTextWhite}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
      <Text style={[styles.totalAmount, type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        Total: {type === 'income' ? '+' : '-'}${totalAmount.toFixed(2)}
      </Text>
      <SwipeListView
        data={transactions}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        previewRowKey={'0'}
        previewOpenValue={-40}
        previewOpenDelay={3000}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
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
    justifyContent: 'space-between',
    paddingLeft: 15,
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
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CategoryDetailScreen;