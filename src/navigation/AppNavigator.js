import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import FilesScreen    from '../screens/FilesScreen';
import ByTypeScreen   from '../screens/ByTypeScreen';
import TypeDetailScreen from '../screens/TypeDetailScreen';
import { colors, radii } from '../utils/theme';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function FilesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
      <Stack.Screen name="FilesList"  component={FilesScreen} />
      <Stack.Screen name="TypeDetail" component={TypeDetailScreen} />
    </Stack.Navigator>
  );
}

function TypesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
      <Stack.Screen name="TypesGrid"  component={ByTypeScreen} />
      <Stack.Screen name="TypeDetail" component={TypeDetailScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.subtext,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Files"
          component={FilesStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 18 }}>📁</Text>
            ),
          }}
        />
        <Tab.Screen
          name="ByType"
          component={TypesStack}
          options={{
            tabBarLabel: 'By Type',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 18 }}>⊞</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 82 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});