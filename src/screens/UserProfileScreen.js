import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { getUserProfile, updateUserProfile, getInvestments, updateInvestment, getLoanInformation, updateLoanInformation } from '../services/FirebaseService';

const UserProfileScreen = ({ navigation }) => {
  const [initialCashBalance, setInitialCashBalance] = useState('');
  const [investments, setInvestments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [newInvestment, setNewInvestment] = useState({ name: '', amount: '' });
  const [newLoan, setNewLoan] = useState({ name: '', amount: '', interestRate: '' });

  useEffect(() => {
    loadUserProfile();
    loadInvestments();
    loadLoans();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setInitialCashBalance(profile.initialCashBalance ? profile.initialCashBalance.toString() : '');
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    }
  };

  const loadInvestments = async () => {
    try {
      const fetchedInvestments = await getInvestments();
      setInvestments(fetchedInvestments);
    } catch (error) {
      console.error('Error loading investments:', error);
      Alert.alert('Error', 'Failed to load investments. Please try again.');
    }
  };

  const loadLoans = async () => {
    try {
      const fetchedLoans = await getLoanInformation();
      setLoans(fetchedLoans);
    } catch (error) {
      console.error('Error loading loans:', error);
      Alert.alert('Error', 'Failed to load loans. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      await updateUserProfile({ initialCashBalance });
      Alert.alert('Success', 'User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      Alert.alert('Error', 'Failed to update user profile. Please try again.');
    }
  };

  const handleAddInvestment = async () => {
    if (!newInvestment.name || !newInvestment.amount) {
      Alert.alert('Error', 'Please enter both name and amount for the investment.');
      return;
    }
    try {
      await updateInvestment({ ...newInvestment, amount: parseFloat(newInvestment.amount) });
      setNewInvestment({ name: '', amount: '' });
      loadInvestments();
      Alert.alert('Success', 'Investment added successfully');
    } catch (error) {
      console.error('Error adding investment:', error);
      Alert.alert('Error', 'Failed to add investment. Please try again.');
    }
  };

  const handleAddLoan = async () => {
    if (!newLoan.name || !newLoan.amount || !newLoan.interestRate) {
      Alert.alert('Error', 'Please enter name, amount, and interest rate for the loan.');
      return;
    }
    try {
      await updateLoanInformation({ 
        ...newLoan, 
        amount: parseFloat(newLoan.amount),
        interestRate: parseFloat(newLoan.interestRate)
      });
      setNewLoan({ name: '', amount: '', interestRate: '' });
      loadLoans();
      Alert.alert('Success', 'Loan added successfully');
    } catch (error) {
      console.error('Error adding loan:', error);
      Alert.alert('Error', 'Failed to add loan. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>User Profile</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Initial Cash Balance</Text>
          <TextInput
            style={styles.input}
            value={initialCashBalance}
            onChangeText={setInitialCashBalance}
            keyboardType="numeric"
            placeholder="Enter initial cash balance"
          />
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save Cash Balance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investments</Text>
          {investments.map((investment, index) => (
            <View key={index} style={styles.item}>
              <Text>{investment.name}: ${investment.amount.toFixed(2)}</Text>
            </View>
          ))}
          <TextInput
            style={styles.input}
            value={newInvestment.name}
            onChangeText={(text) => setNewInvestment({...newInvestment, name: text})}
            placeholder="Investment Name"
          />
          <TextInput
            style={styles.input}
            value={newInvestment.amount}
            onChangeText={(text) => setNewInvestment({...newInvestment, amount: text})}
            keyboardType="numeric"
            placeholder="Investment Amount"
          />
          <TouchableOpacity style={styles.button} onPress={handleAddInvestment}>
            <Text style={styles.buttonText}>Add Investment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loans</Text>
          {loans.map((loan, index) => (
            <View key={index} style={styles.item}>
              <Text>{loan.name}: ${loan.amount.toFixed(2)} at {loan.interestRate}% interest</Text>
            </View>
          ))}
          <TextInput
            style={styles.input}
            value={newLoan.name}
            onChangeText={(text) => setNewLoan({...newLoan, name: text})}
            placeholder="Loan Name"
          />
          <TextInput
            style={styles.input}
            value={newLoan.amount}
            onChangeText={(text) => setNewLoan({...newLoan, amount: text})}
            keyboardType="numeric"
            placeholder="Loan Amount"
          />
          <TextInput
            style={styles.input}
            value={newLoan.interestRate}
            onChangeText={(text) => setNewLoan({...newLoan, interestRate: text})}
            keyboardType="numeric"
            placeholder="Interest Rate (%)"
          />
          <TouchableOpacity style={styles.button} onPress={handleAddLoan}>
            <Text style={styles.buttonText}>Add Loan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
});

export default UserProfileScreen;