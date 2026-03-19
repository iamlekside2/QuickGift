import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/Auth/SplashScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import CompleteSetupScreen from '../screens/Provider/CompleteSetupScreen';
import BuyerTabs from './BuyerTabs';
import ProviderTabs from './ProviderTabs';
import CartScreen from '../screens/Shared/CartScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#35615D" />
      </View>
    );
  }

  const isProvider = user?.role === 'provider';
  const needsSetup = isProvider && user?.profile_complete === false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
        </>
      ) : needsSetup ? (
        <Stack.Screen name="CompleteSetup" component={CompleteSetupScreen} />
      ) : (
        <Stack.Screen
          name="MainApp"
          component={isProvider ? ProviderTabs : BuyerTabs}
        />
      )}
      <Stack.Screen name="Cart" component={CartScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
