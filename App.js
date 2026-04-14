import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScanProvider } from './src/context/ScanContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/utils/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.bg}
        translucent={false}
      />
      <ScanProvider>
        <AppNavigator />
      </ScanProvider>
    </SafeAreaProvider>
  );
}