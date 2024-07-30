import React from 'react';
import { View, Text, FlatList } from 'react-native';

function TransactionList() {
  // TODO: Fetch transactions from Firebase
  const transactions = [
    { id: '1', amount: 100, category: 'Income', date: '2024-07-30' },
    { id: '2', amount: -50, category: 'Groceries', date: '2024-07-31' },
  ];

  return (
    <View>
      <Text>Recent Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>{`${item.date}: ${item.category} - $${item.amount}`}</Text>
        )}
      />
    </View>
  );
}

export default TransactionList;