// ─────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────

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

// ── Icons ─────────────────────────────────────
function FilesIcon({ focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={{ fontSize: 18 }}>📁</Text>
    </View>
  );
}

function TypesIcon({ focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={{ fontSize: 18 }}>⊞</Text>
    </View>
  );
}

// ── Files stack (files + type detail) ─────────
function FilesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FilesList"   component={FilesScreen} />
      <Stack.Screen name="TypeDetail"  component={TypeDetailScreen} />
    </Stack.Navigator>
  );
}

// ── Types stack ────────────────────────────────
function TypesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TypesGrid"  component={ByTypeScreen} />
      <Stack.Screen name="TypeDetail" component={TypeDetailScreen} />
    </Stack.Navigator>
  );
}

// ── Root Tab Navigator ──────────────────────────
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtext,
      }}
    >
      <Tab.Screen
        name="Files"
        component={FilesStack}
        options={{
          tabBarIcon: ({ focused }) => <FilesIcon focused={focused} />,
          tabBarLabel: 'Files',
        }}
      />
      <Tab.Screen
        name="ByType"
        component={TypesStack}
        options={{
          tabBarIcon: ({ focused }) => <TypesIcon focused={focused} />,
          tabBarLabel: 'By Type',
        }}
      />
    </Tab.Navigator>
  );
}

// ── App Navigator ──────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
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
  tabLabel: {
    fontSize: 11, fontWeight: '600',
  },
  tabIcon: {
    width: 32, height: 32, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.accent + '20',
  },
});
