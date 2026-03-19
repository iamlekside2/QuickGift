import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Image, TextInput, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';

const logoSmall = require('../../../assets/images/logo-small.png');

export default function LoginScreen({ navigation }) {
  const { sendOTP, guestLogin } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhone = (text) => {
    // Strip non-digits
    const digits = text.replace(/[^0-9]/g, '');
    setPhone(digits);
  };

  const getFullPhone = () => {
    if (phone.startsWith('0')) return '+234' + phone.slice(1);
    if (phone.startsWith('234')) return '+' + phone;
    if (phone.startsWith('+234')) return phone;
    return '+234' + phone;
  };

  const isValidPhone = () => {
    const digits = phone.replace(/[^0-9]/g, '');
    return digits.length >= 10 && digits.length <= 13;
  };

  const handleSendOTP = async () => {
    if (!isValidPhone()) {
      Alert.alert('Invalid Number', 'Please enter a valid Nigerian phone number');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = getFullPhone();
      const data = await sendOTP(fullPhone);
      navigation.navigate('OTP', {
        phone: fullPhone,
        otpDev: data?.otp_dev,
        isRegistration: false,
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        {/* Header */}
        <View className="items-center mb-10">
          <View
            className="w-24 h-24 rounded-3xl bg-teal-light items-center justify-center mb-5"
            style={{
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Image
              source={logoSmall}
              style={{ width: 56, height: 56, resizeMode: 'contain' }}
            />
          </View>
          <Text className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">
            Welcome Back
          </Text>
          <Text className="text-base text-gray-400 font-medium">
            Enter your phone number to log in
          </Text>
        </View>

        {/* Phone Input */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-2">Phone Number</Text>
          <View
            className="flex-row items-center bg-gray-50 rounded-2xl overflow-hidden"
            style={{
              borderWidth: 2,
              borderColor: phone ? '#35615D' : '#F3F4F6',
            }}
          >
            <View className="px-4 py-4 bg-gray-100 border-r border-gray-200">
              <Text className="text-base font-bold text-gray-600">+234</Text>
            </View>
            <TextInput
              className="flex-1 px-4 py-4 text-base text-gray-800 font-medium"
              placeholder="801 234 5678"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={formatPhone}
              maxLength={11}
              autoFocus
            />
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${isValidPhone() ? 'bg-teal' : 'bg-gray-200'}`}
          style={isValidPhone() ? {
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          } : undefined}
          onPress={handleSendOTP}
          disabled={!isValidPhone() || loading}
          activeOpacity={0.85}
        >
          <Text className={`text-base font-bold ${isValidPhone() ? 'text-white' : 'text-gray-400'}`}>
            {loading ? 'Sending OTP...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center gap-4 my-6">
          <View className="flex-1 h-px bg-gray-100" />
          <Text className="text-xs text-gray-300 font-medium">OR</Text>
          <View className="flex-1 h-px bg-gray-100" />
        </View>

        {/* Sign up */}
        <View className="flex-row justify-center">
          <Text className="text-sm text-gray-400">New here? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text className="text-sm text-teal font-bold">Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Guest */}
        <TouchableOpacity className="items-center py-3 mt-2" onPress={() => guestLogin()}>
          <Text className="text-sm text-gray-300 font-medium">Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
