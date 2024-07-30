import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import CategoryScreen from './screens/CategoryScreen';
import Header from './components/Header';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation, options }) => {
          return <Header title={options.title || route.name} />;
        },
      })}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Budget Planner' }} 
      />
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen} 
        options={{ title: 'Add Transaction' }} 
      />
      <Stack.Screen 
        name="Category" 
        component={CategoryScreen} 
        options={{ title: 'Categories' }} 
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;