import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryName } from '../utils/categories';

function CategoryScreen({ navigation }) {
  const [expenseCategories, setExpenseCategories] = useState({});
  const [incomeCategories, setIncomeCategories] = useState({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);

  const loadTransactions = useCallback(async () => {
    try {
      const transactions = await getTransactions();
      const expenseSums = {};
      const incomeSums = {};
      let expenseTotal = 0;
      let incomeTotal = 0;

      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          expenseSums[transaction.category] = (expenseSums[transaction.category] || 0) + transaction.amount;
          expenseTotal += transaction.amount;
        } else if (transaction.type === 'income') {
          incomeSums[transaction.category] = (incomeSums[transaction.category] || 0) + transaction.amount;
          incomeTotal += transaction.amount;
        }
      });

      setExpenseCategories(expenseSums);
      setIncomeCategories(incomeSums);
      setTotalExpenses(expenseTotal);
      setTotalIncome(incomeTotal);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleCategoryPress = (category, amount, type) => {
    navigation.navigate('CategoryDetail', { category, amount, type });
  };

  const renderCategoryItem = (item, total, type) => {
    const [categoryId, amount] = item;
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    return (
      <TouchableOpacity 
        style={styles.categoryItem}
        onPress={() => handleCategoryPress(categoryId, amount, type)}
      >
        <Text style={styles.categoryName}>{getCategoryName(categoryId)}</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
          <Text style={styles.categoryPercentage}>({percentage.toFixed(1)}%)</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title, total) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionTotal}>Total: ${total.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[
          { type: 'expense', data: Object.entries(expenseCategories) },
          { type: 'income', data: Object.entries(incomeCategories) }
        ]}
        renderItem={({ item }) => (
          <View>
            {renderSectionHeader(
              item.type === 'expense' ? 'Expense Categories' : 'Income Categories',
              item.type === 'expense' ? totalExpenses : totalIncome
            )}
            {item.data.map((category) => 
              renderCategoryItem(
                category, 
                item.type === 'expense' ? totalExpenses : totalIncome,
                item.type
              )
            )}
          </View>
        )}
        keyExtractor={(item, index) => item.type + index}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sectionHeader: {
    padding: 20,
    backgroundColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTotal: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
  },
});

export default CategoryScreen;