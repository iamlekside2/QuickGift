import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BeautyHomeScreen from '../screens/Beauty/BeautyHomeScreen';
import ProvidersListScreen from '../screens/Beauty/ProvidersListScreen';
import ProviderProfileScreen from '../screens/Beauty/ProviderProfileScreen';
import BookingScreen from '../screens/Beauty/BookingScreen';

const Stack = createNativeStackNavigator();

export default function BeautyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BeautyHome" component={BeautyHomeScreen} />
      <Stack.Screen name="ProvidersList" component={ProvidersListScreen} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
    </Stack.Navigator>
  );
}
