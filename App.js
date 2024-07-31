import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/AppNavigator';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './src/config';

// Initialize Firebase
initializeApp(firebaseConfig);

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}