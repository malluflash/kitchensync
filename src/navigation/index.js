import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

import InventoryScreen from '../screens/InventoryScreen';
import StoragesScreen from '../screens/StoragesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ItemDetailsScreen from '../screens/ItemDetailsScreen';
import PremiumUpgradeScreen from '../screens/PremiumUpgradeScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import RecipesScreen from '../screens/RecipesScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Storages: focused ? 'grid' : 'grid-outline',
            History: focused ? 'time' : 'time-outline',
            Alerts: focused ? 'notifications' : 'notifications-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={InventoryScreen} />
      <Tab.Screen 
         name="Storages" 
         component={StoragesScreen} 
         options={{
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', color: colors.gold }
         }} 
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <RootStack.Screen name="Main" component={TabNavigator} />
      <RootStack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="ItemDetails"
        component={ItemDetailsScreen}
      />
      <RootStack.Screen
        name="PremiumUpgrade"
        component={PremiumUpgradeScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="Shopping"
        component={ShoppingListScreen}
      />
      <RootStack.Screen
        name="Recipes"
        component={RecipesScreen}
      />
      <RootStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
      />
      <RootStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
      />
    </RootStack.Navigator>
  );
}
