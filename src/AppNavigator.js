import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import CategoryScreen from './screens/CategoryScreen';
import CategoryDetailScreen from './screens/CategoryDetailScreen';
import BudgetGoalsScreen from './screens/BudgetGoalsScreen';
import LoginScreen from './screens/LoginScreen';
import Header from './components/Header';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from './services/FirebaseService';

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
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Budget Planner' }} 
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
        name="Categories" 
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

function BudgetGoalsStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation, options }) => {
          return <Header title={options.title || route.name} />;
        },
      })}
    >
      <Stack.Screen 
        name="BudgetGoals" 
        component={BudgetGoalsScreen} 
        options={{ title: 'Budget Goals' }} 
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CategoriesTab') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'BudgetGoalsTab') {
            iconName = focused ? 'flag' : 'flag-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{ headerShown: false, title: 'Home' }} 
      />
      <Tab.Screen 
        name="CategoriesTab" 
        component={CategoriesStack}
        options={{ headerShown: false, title: 'Categories' }}
      />
      <Tab.Screen 
        name="BudgetGoalsTab" 
        component={BudgetGoalsStack}
        options={{ headerShown: false, title: 'Goals' }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = getCurrentUser((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (initializing) {
    // You might want to show a loading screen here
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

export default AppNavigator;