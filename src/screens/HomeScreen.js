import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { addTransaction, getTransactions } from '../services/FirebaseService';

function HomeScreen({ navigation }) {
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    async function testDatabase() {
      try {
        // Test writing to Firestore
        const newTransaction = {
          amount: 50,
          description: 'Test transaction',
          date: new Date(),
          type: 'expense'
        };
        const docId = await addTransaction(newTransaction);
        console.log('Test transaction added with ID:', docId);

        // Test reading from Firestore
        const transactions = await getTransactions();
        console.log('Transactions:', transactions);

        setTestMessage('Database connection successful');
      } catch (e) {
        console.error('Database test error:', e);
        setTestMessage('Error connecting to database');
      }
    }

    testDatabase();
  }, []);

  return (
    <View>
      <Text>Welcome to Budget Planner</Text>
      <Text>Database test: {testMessage}</Text>
      <Button
        title="Add Transaction"
        onPress={() => navigation.navigate('AddTransaction')}
      />
    </View>
  );
}

export default HomeScreen;