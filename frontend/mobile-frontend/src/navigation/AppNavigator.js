import React, { createRef, useEffect } from 'react';
import MainNavigator from './MainNavigator';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen     from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen      from '../screens/auth/LoginScreen';
import RegisterScreen   from '../screens/auth/RegisterScreen';
import { useAuth }      from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export const navigationRef = createRef();

if (__DEV__) {
  globalThis.nav = {
    navigate: (screen) => navigationRef.current?.navigate(screen),
    replace:  (screen) => navigationRef.current?.dispatch(StackActions.replace(screen)),
  };
}

export default function AppNavigator() {
  const { authenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && authenticated) {
      navigationRef.current?.dispatch(StackActions.replace('Main'));
    }
  }, [authenticated, loading]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash">
        <Stack.Screen name="Splash"      component={SplashScreen} />
        <Stack.Screen name="Onboarding"  component={OnboardingScreen} />
        <Stack.Screen name="Login"       component={LoginScreen} />
        <Stack.Screen name="Register"    component={RegisterScreen} />
        <Stack.Screen name="Main"        component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}