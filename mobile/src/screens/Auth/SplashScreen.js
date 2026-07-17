import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERIF_FAMILY, SERIF_ITALIC_FAMILY } from '../../components/common/Typography';

const logo = require('../../../assets/images/logo-small.png');
const ONBOARDING_SEEN_KEY = '@quickgift_onboarding_seen';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        navigation.replace(seen === 'true' ? 'Login' : 'Onboarding');
      } catch {
        navigation.replace('Onboarding');
      }
    };
    const timer = setTimeout(checkOnboarding, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-cream-warm items-center justify-center">
      <StatusBar style="dark" />

      <Image source={logo} style={{ width: 76, height: 76, resizeMode: 'contain' }} />

      {/* Serif italic wordmark — "Gift" in terracotta */}
      <Text style={{ fontFamily: SERIF_FAMILY, fontSize: 40, color: '#211F1C', marginTop: 18 }}>
        Quick
        <Text style={{ fontFamily: SERIF_ITALIC_FAMILY, color: '#E8632F' }}>Gift</Text>
      </Text>

      <Text
        className="text-ink-caption font-bold"
        style={{ fontSize: 12, letterSpacing: 3, marginTop: 10 }}
      >
        GIFTS & ARTISANS, SAME DAY
      </Text>
    </View>
  );
}
