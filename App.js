// ─────────────────────────────────────────────
//  APP ENTRY POINT
// ─────────────────────────────────────────────

import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScanProvider } from './src/context/ScanContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/utils/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
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
    </GestureHandlerRootView>
  );
}
