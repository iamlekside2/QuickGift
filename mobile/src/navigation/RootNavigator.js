import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/Auth/SplashScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import MainTabs from './MainTabs';
import CartScreen from '../screens/Shared/CartScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTPVerification" component={OTPScreen} />
          <Stack.Screen name="MainApp" component={MainTabs} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainApp" component={MainTabs} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
      <Stack.Screen name="Cart" component={CartScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
