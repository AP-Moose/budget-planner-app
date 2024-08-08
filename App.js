import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/AppNavigator';
import { MonthProvider } from './src/context/MonthContext';
import { LogBox } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './src/config';

LogBox.ignoreLogs(['AsyncStorage has been extracted from react-native core']);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default function App() {
  return (
    <MonthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </MonthProvider>
  );
}