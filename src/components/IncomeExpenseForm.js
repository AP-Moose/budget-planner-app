import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';

function IncomeExpenseForm() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = () => {
    // TODO: Implement submission to Firebase
    console.log('Submitting:', { amount, category, date });
  };

  return (
    <View>
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <Button title="Add Transaction" onPress={handleSubmit} />
    </View>
  );
}

export default IncomeExpenseForm;