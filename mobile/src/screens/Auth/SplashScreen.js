import React, { useEffect } from 'react';
import { View, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logo = require('../../../assets/images/logo.png');
const ONBOARDING_SEEN_KEY = '@quickgift_onboarding_seen';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        // Skip onboarding if already seen — go straight to login
        navigation.replace(seen === 'true' ? 'Login' : 'Onboarding');
      } catch {
        navigation.replace('Onboarding');
      }
    };
    const timer = setTimeout(checkOnboarding, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <StatusBar style="dark" />
      <Image
        source={logo}
        style={{ width: 180, height: 180, resizeMode: 'contain' }}
      />
    </View>
  );
}
