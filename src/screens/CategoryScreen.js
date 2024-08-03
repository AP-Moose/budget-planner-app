import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions } from '../services/FirebaseService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryName } from '../utils/categories';
import { PieChart } from 'react-native-svg-charts';
import SearchBar from '../components/SearchBar';

const screenWidth = Dimensions.get('window').width;

function CategoryScreen({ navigation }) {
  const [expenseCategories, setExpenseCategories] = useState({});
  const [incomeCategories, setIncomeCategories] = useState({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [activeTab, setActiveTab] = useState('expense');
  const [searchQuery, setSearchQuery] = useState('');

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

  const renderCategories = () => {
    const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    const total = activeTab === 'expense' ? totalExpenses : totalIncome;

    const filteredCategories = Object.entries(categories).filter(([categoryId]) => 
      getCategoryName(categoryId).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filteredCategories.map((category) => 
      renderCategoryItem(category, total, activeTab)
    );
  };

  const getChartData = () => {
    const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    const total = activeTab === 'expense' ? totalExpenses : totalIncome;
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    return Object.entries(categories).map(([categoryId, amount], index) => ({
      key: categoryId,
      value: amount,
      svg: { fill: colors[index % colors.length] },
      arc: { outerRadius: '100%', padAngle: 0.02 },
      name: getCategoryName(categoryId),
      percentage: ((amount / total) * 100).toFixed(1)
    }));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
          onPress={() => setActiveTab('expense')}
        >
          <Text style={styles.tabText}>Expenses</Text>
          <Text style={styles.tabAmount}>Total: ${totalExpenses.toFixed(2)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={styles.tabText}>Income</Text>
          <Text style={styles.tabAmount}>Total: ${totalIncome.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search categories..."
      />
      <View style={styles.chartContainer}>
        <PieChart
          style={{ height: 200, width: 200 }}
          data={getChartData()}
          innerRadius="50%"
          outerRadius="100%"
        />
      </View>
      <View style={styles.legendContainer}>
        {getChartData().map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.svg.fill }]} />
            <Text style={styles.legendText}>{item.name}</Text>
          </View>
        ))}
      </View>
      <FlatList
        data={renderCategories()}
        renderItem={({ item }) => item}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tabAmount: {
    fontSize: 14,
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
});

export default CategoryScreen;