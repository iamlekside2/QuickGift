import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Image, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import AppInput from '../../components/common/AppInput';
import Button from '../../components/common/Button';
import { SerifHeadline } from '../../components/common/Typography';

const logoSmall = require('../../../assets/images/logo-small.png');

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
      className="flex-1 bg-cream-warm"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="px-5"
      >
        {/* Header */}
        <View className="items-center mb-9">
          <Image source={logoSmall} style={{ width: 56, height: 56, resizeMode: 'contain', marginBottom: 18 }} />
          <SerifHeadline text="Welcome back" emphasis="back" size={30} />
          <Text className="text-[14px] text-ink-soft mt-2">
            Enter your phone number to continue
          </Text>
        </View>

        {/* Phone Input */}
        <AppInput
          label="Phone Number"
          placeholder="801 234 5678"
          value={phone}
          onChangeText={setPhone}
          type="phone"
          autoFocus
        />

        {/* Continue */}
        <Button
          title={loading ? 'Sending OTP…' : 'Continue'}
          onPress={handleSendOTP}
          disabled={!isValid}
          loading={loading}
          style={{ marginTop: 4 }}
        />

        {/* Divider */}
        <View className="flex-row items-center gap-4 my-6">
          <View className="flex-1 h-px bg-line-border" />
          <Text className="text-[12px] text-ink-caption font-semibold">or</Text>
          <View className="flex-1 h-px bg-line-border" />
        </View>

        {/* Guest */}
        <TouchableOpacity
          className="h-[52px] rounded-[16px] border-[1.5px] border-line-border bg-white items-center justify-center"
          onPress={() => guestLogin()}
          activeOpacity={0.85}
        >
          <Text className="text-[15px] text-ink font-bold">Continue as Guest</Text>
        </TouchableOpacity>

        {/* Sign up */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-[13.5px] text-ink-soft">New here? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text className="text-[13.5px] text-teal font-bold">Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
