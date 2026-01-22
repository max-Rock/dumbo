import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import OrdersScreen from '../screens/OrdersScreen';
import MenuScreen from '../screens/MenuScreen';
import AddMenuItemScreen from '../screens/AddMenuItemScreen';
import EarningsScreen from '../screens/EarningsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Settings02Icon, Money03Icon, MenuRestaurantIcon, Invoice04Icon } from '@hugeicons/core-free-icons'

const Tab = createBottomTabNavigator();
const MenuStack = createStackNavigator();

function MenuStackScreen() {
  return (
    <MenuStack.Navigator>
      <MenuStack.Screen 
        name="MenuList" 
        component={MenuScreen}
        options={{ headerShown: false }}
      />
      <MenuStack.Screen 
        name="AddMenuItem" 
        component={AddMenuItemScreen}
        options={{ 
          title: 'Add Menu Item',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
        }}
      />
    </MenuStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={Invoice04Icon} size={size} color={color} />
          ),
          title: 'Live Orders',
        }}
      />
      <Tab.Screen
        name="Menu"
        // component={MenuScreen}
        component={MenuStackScreen}
        options={{
          // headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={MenuRestaurantIcon} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={Money03Icon} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={Settings02Icon} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}