import React from 'react';
import { StatusBar } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

enableScreens();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar
          translucent={false}
          barStyle="light-content"
          backgroundColor="#1A2035"
        />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
