import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import CategoryScreen from './screens/CategoryScreen';
import CategoryDetailScreen from './screens/CategoryDetailScreen';
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
        initialParams={{ refresh: false }}
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
      <Stack.Screen 
        name="CategoryDetail" 
        component={CategoryDetailScreen} 
        options={({ route }) => ({ title: route.params.category })}
      />
    </Stack.Navigator>
  );
}

function CategoriesStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation, options }) => {
          return <Header title={options.title || route.name} />;
        },
      })}
    >
      <Stack.Screen 
        name="CategoriesScreen" 
        component={CategoryScreen} 
        options={{ title: 'Categories' }} 
      />
      <Stack.Screen 
        name="CategoryDetail" 
        component={CategoryDetailScreen} 
        options={({ route }) => ({ title: route.params.category })}
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
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ headerShown: false }} 
        listeners={({ navigation }) => ({
          tabPress: e => {
            // Prevent default behavior
            e.preventDefault();
            
            // Reset the stack to HomeScreen with refresh param
            navigation.navigate('HomeScreen', { refresh: true });
          },
        })}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default AppNavigator;