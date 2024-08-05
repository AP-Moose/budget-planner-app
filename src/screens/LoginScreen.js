import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { signIn, signUp, resetPassword } from '../services/FirebaseService';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async () => {
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!validateEmail(sanitizedEmail) || !validatePassword(sanitizedPassword)) {
      Alert.alert('Invalid Input', 'Please enter a valid email and password (at least 8 characters, including uppercase, lowercase, and number).');
      return;
    }

    try {
      if (isLogin) {
        await signIn(sanitizedEmail, sanitizedPassword);
        navigation.navigate('Home');
      } else {
        await signUp(sanitizedEmail, sanitizedPassword);
        Alert.alert('Success', 'Account created successfully. You can now log in.');
        setIsLogin(true);
      }
    } catch (error) {
      console.error('Authentication Error:', error.message);
      Alert.alert('Authentication Error', error.message);
    }
  };

  const handleForgotPassword = async () => {
    const sanitizedEmail = sanitizeInput(email);
    if (!validateEmail(sanitizedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await resetPassword(sanitizedEmail);
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.');
    } catch (error) {
      console.error('Password Reset Error:', error.message);
      Alert.alert('Password Reset Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
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
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchButtonText}>
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
      {isLogin && (
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  switchButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
  forgotPassword: {
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 16,
  },
});

export default LoginScreen;