import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GiftsHomeScreen from '../screens/Gifts/GiftsHomeScreen';
import GiftsListScreen from '../screens/Gifts/GiftsListScreen';
import GiftDetailScreen from '../screens/Gifts/GiftDetailScreen';

const Stack = createNativeStackNavigator();

export default function GiftsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GiftsHome" component={GiftsHomeScreen} />
      <Stack.Screen name="GiftsList" component={GiftsListScreen} />
      <Stack.Screen name="GiftDetail" component={GiftDetailScreen} />
    </Stack.Navigator>
  );
}
