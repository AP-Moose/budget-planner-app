import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions } from '../services/FirebaseService';
import { getCategoryName } from '../utils/categories';
import { PieChart } from 'react-native-svg-charts';
import { useMonth } from '../context/MonthContext';
import MonthNavigator from '../components/MonthNavigator';
import { categorizeTransactions, calculateTotals } from '../utils/reportUtils';

const screenWidth = Dimensions.get('window').width;

function CategoryScreen({ navigation }) {
  const { currentMonth, setCurrentMonth } = useMonth();
  const [expenseCategories, setExpenseCategories] = useState({});
  const [incomeCategories, setIncomeCategories] = useState({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [activeTab, setActiveTab] = useState('expense');
  const [pieChartData, setPieChartData] = useState([]);

  const loadTransactions = useCallback(async () => {
    try {
      const transactions = await getTransactions();
      const currentMonthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === currentMonth.getMonth() &&
          transactionDate.getFullYear() === currentMonth.getFullYear()
        );
      });

      const categorizedTransactions = categorizeTransactions(currentMonthTransactions);
      const totals = calculateTotals(categorizedTransactions);

      const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
      const totalExpenses = totals.totalRegularExpenses + totals.totalCreditCardPurchases;

      setExpenseCategories(categorizedTransactions.regularExpenses.reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {}));
      setIncomeCategories(categorizedTransactions.regularIncome.reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {}));
      setTotalExpenses(totalExpenses);
      setTotalIncome(totalIncome);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  useEffect(() => {
    updatePieChartData();
  }, [expenseCategories, incomeCategories, activeTab]);

  const updatePieChartData = () => {
    const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    const total = activeTab === 'expense' ? totalExpenses : totalIncome;
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    const data = Object.entries(categories).map(([category, amount], index) => ({
      key: category,
      value: amount,
      svg: { fill: colors[index % colors.length] },
      arc: { outerRadius: '100%', padAngle: 0.02 },
      name: getCategoryName(category),
      percentage: ((amount / total) * 100).toFixed(1)
    }));

    setPieChartData(data);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => navigation.navigate('CategoryDetail', { category: item.key, amount: item.value, type: activeTab })}
    >
      <View style={[styles.categoryColor, { backgroundColor: item.svg.fill }]} />
      <Text style={styles.categoryName}>{item.name}</Text>
      <View style={styles.amountContainer}>
        <Text style={styles.categoryAmount}>${item.value.toFixed(2)}</Text>
        <Text style={styles.categoryPercentage}>({item.percentage}%)</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <MonthNavigator currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
      
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
      
      <Text style={styles.title}>
        {activeTab === 'expense' ? 'Monthly Expense Breakdown' : 'Monthly Income Breakdown'}
      </Text>

      <View style={styles.chartContainer}>
        <PieChart
          style={{ height: 200, width: 200 }}
          data={pieChartData}
          innerRadius="50%"
          outerRadius="100%"
        />
      </View>

      <FlatList
        data={pieChartData}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.key}
        scrollEnabled={false}
      />
    </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 5,
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
  },
});

export default CategoryScreen;