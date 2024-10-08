import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getFirestore, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useMonth } from '../../context/MonthContext';
import { categorizeTransactions, calculateTotals } from '../../utils/reportUtils';
import { getAuth } from 'firebase/auth';

const HomeDashboard = () => {
  const { currentMonth } = useMonth();
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalCashOutflow: 0,
    netCashFlow: 0,
    creditCardPurchases: 0,
    creditCardPayments: 0,
  });

  useEffect(() => {
    const unsubscribe = loadDashboardData();
    return () => unsubscribe && unsubscribe();
  }, [currentMonth]);

  const loadDashboardData = () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();
  
      if (!user) {
        throw new Error('No user logged in');
      }
  
      const transactionsRef = collection(db, 'transactions');
      
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999); // Ensures the full last day is included
      
      const q = query(
        transactionsRef,
        where('userId', '==', user.uid),
        where('date', '>=', startOfMonth),
        where('date', '<=', endOfMonth),
        orderBy('date', 'desc')
      );
  
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        const categorizedTransactions = categorizeTransactions(transactions);
        const totals = calculateTotals(categorizedTransactions);
  
        const totalIncome = totals.totalRegularIncome + totals.totalCreditCardIncome;
        const totalExpenses = totals.totalRegularExpenses + totals.totalCreditCardPurchases;
        const totalCashOutflow = totals.totalRegularExpenses + totals.totalCreditCardPayments + totals.totalLoanPayments;
  
        const netCashFlow = totalIncome - totalCashOutflow;
  
        setDashboardData({
          totalIncome,
          totalExpenses,
          totalCashOutflow,
          netCashFlow,
          creditCardPurchases: totals.totalCreditCardPurchases,
          creditCardPayments: totals.totalCreditCardPayments,
        });
      });
  
      return unsubscribe; // Unsubscribe from updates when the component unmounts
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };
  

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getCashFlowColor = (amount) => {
    if (amount > 0) return 'green';
    if (amount < 0) return 'red';
    return 'gray';
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.boxTitle}>Monthly Financial Overview</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Total Income:</Text>
          <Text style={styles.value}>{formatCurrency(dashboardData.totalIncome)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total Expenses:</Text>
          <Text style={styles.value}>{formatCurrency(dashboardData.totalExpenses)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total Cash Outflow:</Text>
          <Text style={styles.value}>{formatCurrency(dashboardData.totalCashOutflow)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Credit Card Purchases:</Text>
          <Text style={styles.value}>{formatCurrency(dashboardData.creditCardPurchases)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Credit Card Payments:</Text>
          <Text style={styles.value}>{formatCurrency(dashboardData.creditCardPayments)}</Text>
        </View>

        <Text
          style={[
            styles.cashFlowMessage,
            { color: getCashFlowColor(dashboardData.netCashFlow) },
          ]}
        >
          {dashboardData.netCashFlow > 0
            ? `Positive cash flow: ${formatCurrency(dashboardData.netCashFlow)}`
            : `Negative cash flow: ${formatCurrency(dashboardData.netCashFlow)}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  box: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  boxTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cashFlowMessage: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 15,
    color: '#777',
  },
});

export default HomeDashboard;
