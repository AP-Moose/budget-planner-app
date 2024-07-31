import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import CategoryScreen from './screens/CategoryScreen';
import Header from './components/Header';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation, options }) => {
          return <Header title={options.title || route.name} />;
        },
      })}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ title: 'Budget Planner' }} 
      />
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen} 
        options={{ title: 'Add Transaction' }} 
      />
      <Stack.Screen 
        name="TransactionDetail" 
        component={TransactionDetailScreen} 
        options={{ title: 'Transaction Details' }} 
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'list' : 'list-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
      <Tab.Screen name="Categories" component={CategoryScreen} />
    </Tab.Navigator>
  );
}

export default AppNavigator;