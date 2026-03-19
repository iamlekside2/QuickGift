import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Image, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput as PaperInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const logoSmall = require('../../../assets/images/logo-small.png');

const paperTheme = {
  colors: {
    primary: '#35615D',
    onSurfaceVariant: '#9CA3AF',
    outline: '#E5E7EB',
    background: '#F9FAFB',
  },
  roundness: 12,
};

export default function LoginScreen({ navigation }) {
  const { sendOTP, guestLogin } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizePhone = (raw) => {
    const digits = raw.replace(/[^0-9+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('0')) return '+234' + digits.slice(1);
    if (digits.startsWith('234')) return '+' + digits;
    return '+234' + digits;
  };

  const isValid = phone.replace(/[^0-9]/g, '').length >= 7;

  const handleSendOTP = async () => {
    if (!isValid) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = normalizePhone(phone);
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

        {/* Phone Input — Material Outlined with +234 prefix */}
        <View className="mb-6">
          <PaperInput
            mode="outlined"
            label="Phone Number"
            placeholder="801 234 5678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            left={<PaperInput.Affix text="+234" textStyle={{ color: '#374151', fontWeight: '600' }} />}
            theme={paperTheme}
            outlineStyle={{ borderRadius: 12 }}
            style={{ backgroundColor: '#F9FAFB' }}
            autoFocus
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${isValid ? 'bg-teal' : 'bg-gray-200'}`}
          style={isValid ? {
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          } : undefined}
          onPress={handleSendOTP}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          <Text className={`text-base font-bold ${isValid ? 'text-white' : 'text-gray-400'}`}>
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
