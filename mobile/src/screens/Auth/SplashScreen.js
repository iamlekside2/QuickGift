import React, { useEffect } from 'react';
import { View, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const logo = require('../../../assets/images/logo.png');

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2500);

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
