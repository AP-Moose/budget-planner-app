import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { signIn, signUp } from '../services/FirebaseService';

const validateEmail = (email) => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!validateEmail(email) || !validatePassword(password)) {
      Alert.alert('Invalid Input', 'Please enter a valid email and password (at least 6 characters).');
      return;
    }

    try {
      await signIn(email, password);
      // Handle successful login (e.g., navigate to main app screen)
    } catch (error) {
      console.error('Login Error:', error.message);
      Alert.alert('Login Error', error.message);
    }
  };

  const handleSignUp = async () => {
    if (!validateEmail(email) || !validatePassword(password)) {
      Alert.alert('Invalid Input', 'Please enter a valid email and password (at least 6 characters).');
      return;
    }

    try {
      await signUp(email, password);
      Alert.alert('Success', 'Account created successfully. You can now log in.');
    } catch (error) {
      console.error('Sign Up Error:', error.message);
      if (error.message.includes('email-already-in-use')) {
        Alert.alert('Sign Up Error', 'This email is already registered. Please try logging in or use a different email.');
      } else {
        Alert.alert('Sign Up Error', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
  },
});

export default LoginScreen;