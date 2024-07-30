import React from 'react';
import { View, Text, Button } from 'react-native';
import TransactionList from '../components/TransactionList';
import CategorySummary from '../components/CategorySummary';

function HomeScreen({ navigation }) {
  return (
    <View>
      <Text>Welcome to Budget Planner</Text>
      <Button
        title="Add Transaction"
        onPress={() => navigation.navigate('AddTransaction')}
      />
      <TransactionList />
      <CategorySummary />
    </View>
  );
}

export default HomeScreen;
