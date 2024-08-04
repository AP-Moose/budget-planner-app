import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Image, Text, TouchableOpacity } from 'react-native';
import { signIn, signUp, resetPassword } from '../services/FirebaseService';

const validateEmail = (email) => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!validateEmail(email) || !validatePassword(password)) {
      Alert.alert('Invalid Input', 'Please enter a valid email and password (at least 6 characters).');
      return;
    }

    try {
      await signIn(email, password);
      navigation.navigate('Home');
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

  const handleForgotPassword = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await resetPassword(email);
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.');
    } catch (error) {
      console.error('Password Reset Error:', error.message);
      Alert.alert('Password Reset Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Budget Planner</Text>
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
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} />
        <Button title="Sign Up" onPress={handleSignUp} />
      </View>
      <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 192,
    height: 192,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  forgotPassword: {
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;