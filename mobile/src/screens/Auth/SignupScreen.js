import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Image,
  TextInput, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const logoSmall = require('../../../assets/images/logo-small.png');

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const { sendOTP } = useAuth();

  const formatPhone = (text) => {
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

  const isFormValid = () => fullName.trim().length >= 2 && isValidPhone();

  const handleSignup = async () => {
    if (!isFormValid()) {
      Alert.alert('Missing Info', 'Please enter your name and a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = getFullPhone();
      const data = await sendOTP(fullPhone);
      navigation.navigate('OTP', {
        phone: fullPhone,
        otpDev: data?.otp_dev,
        fullName: fullName.trim(),
        role: selectedRole,
        isRegistration: true,
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
        <View className="items-center mb-8">
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
            Join QuickGift
          </Text>
          <Text className="text-base text-gray-400 font-medium">
            Create your account in seconds
          </Text>
        </View>

        {/* Full Name */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-700 mb-2">Full Name</Text>
          <TextInput
            className="bg-gray-50 rounded-2xl px-4 py-4 text-base text-gray-800 font-medium"
            style={{
              borderWidth: 2,
              borderColor: fullName ? '#35615D' : '#F3F4F6',
            }}
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        {/* Phone Number */}
        <View className="mb-5">
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
            />
          </View>
        </View>

        {/* Role Selection */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-3">I want to join as</Text>
          <View className="flex-row gap-3">
            {/* Customer */}
            <TouchableOpacity
              className={`flex-1 items-center py-4 rounded-2xl border-2 ${
                selectedRole === 'user'
                  ? 'border-teal bg-teal-light'
                  : 'border-gray-100 bg-white'
              }`}
              onPress={() => setSelectedRole('user')}
            >
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center mb-2 ${
                  selectedRole === 'user' ? 'bg-teal' : 'bg-teal-light'
                }`}
              >
                <Ionicons
                  name="gift-outline"
                  size={24}
                  color={selectedRole === 'user' ? '#fff' : '#35615D'}
                />
              </View>
              <Text className={`text-sm font-bold ${
                selectedRole === 'user' ? 'text-teal' : 'text-gray-600'
              }`}>
                Customer
              </Text>
            </TouchableOpacity>

            {/* Provider */}
            <TouchableOpacity
              className={`flex-1 items-center py-4 rounded-2xl border-2 ${
                selectedRole === 'provider'
                  ? 'border-teal bg-teal-light'
                  : 'border-gray-100 bg-white'
              }`}
              onPress={() => setSelectedRole('provider')}
            >
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center mb-2 ${
                  selectedRole === 'provider' ? 'bg-teal' : 'bg-orange-light'
                }`}
              >
                <Ionicons
                  name="cut-outline"
                  size={24}
                  color={selectedRole === 'provider' ? '#fff' : '#FD8950'}
                />
              </View>
              <Text className={`text-sm font-bold ${
                selectedRole === 'provider' ? 'text-teal' : 'text-gray-600'
              }`}>
                Provider
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${isFormValid() ? 'bg-teal' : 'bg-gray-200'}`}
          style={isFormValid() ? {
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          } : undefined}
          onPress={handleSignup}
          disabled={!isFormValid() || loading}
          activeOpacity={0.85}
        >
          <Text className={`text-base font-bold ${isFormValid() ? 'text-white' : 'text-gray-400'}`}>
            {loading ? 'Sending OTP...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        {/* Login link */}
        <View className="flex-row justify-center mt-5">
          <Text className="text-sm text-gray-400">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-sm text-teal font-bold">Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
