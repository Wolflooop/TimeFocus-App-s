import { enableScreens } from 'react-native-screens';
enableScreens();

import 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

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