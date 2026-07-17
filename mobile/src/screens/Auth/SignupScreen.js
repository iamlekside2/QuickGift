import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import AppInput from '../../components/common/AppInput';
import Button from '../../components/common/Button';
import { SerifHeadline } from '../../components/common/Typography';

const logoSmall = require('../../../assets/images/logo-small.png');

const ROLES = [
  { id: 'user', label: 'Shop & book', icon: 'gift-outline' },
  { id: 'provider', label: 'Offer services', icon: 'briefcase-outline' },
];

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const { checkPhone, sendOTP } = useAuth();

  const normalizePhone = (raw) => {
    const digits = raw.replace(/[^0-9+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('0')) return '+234' + digits.slice(1);
    if (digits.startsWith('234')) return '+' + digits;
    return '+234' + digits;
  };

  const isValidPhone = phone.replace(/[^0-9]/g, '').length >= 7;
  const isFormValid = fullName.trim().length >= 2 && isValidPhone;

  const handleSignup = async () => {
    if (!isFormValid) {
      Alert.alert('Missing Info', 'Please enter your name and a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = normalizePhone(phone);

      const { exists } = await checkPhone(fullPhone);
      if (exists) {
        Alert.alert(
          'Account Exists',
          'This phone number is already registered. Please log in instead.',
          [
            { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setLoading(false);
        return;
      }

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
      className="flex-1 bg-cream-warm"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="px-5"
      >
        {/* Header */}
        <View className="items-center mb-7">
          <Image source={logoSmall} style={{ width: 56, height: 56, resizeMode: 'contain', marginBottom: 18 }} />
          <SerifHeadline text="Create your account" emphasis="account" size={28} style={{ textAlign: 'center' }} />
          <Text className="text-[14px] text-ink-soft mt-2">Join QuickGift in seconds</Text>
        </View>

        {/* Role Selection */}
        <Text className="text-[13px] font-bold text-ink-soft mb-2">I want to</Text>
        <View className="flex-row gap-3 mb-5">
          {ROLES.map((role) => {
            const active = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                className={`flex-1 items-center py-4 rounded-[16px] border-[1.5px] ${
                  active ? 'border-teal bg-teal-light' : 'border-line-border bg-white'
                }`}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.85}
              >
                <View
                  className={`w-12 h-12 rounded-[14px] items-center justify-center mb-2 ${
                    active ? 'bg-teal' : 'bg-sand'
                  }`}
                >
                  <Ionicons name={role.icon} size={22} color={active ? '#fff' : '#6E6A63'} />
                </View>
                <Text className={`text-[13.5px] font-bold ${active ? 'text-teal' : 'text-ink-soft'}`}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Full Name */}
        <AppInput
          label="Full Name"
          placeholder="John Doe"
          value={fullName}
          onChangeText={setFullName}
          type="text"
          icon="person-outline"
        />

        {/* Phone Number */}
        <AppInput
          label="Phone Number"
          placeholder="801 234 5678"
          value={phone}
          onChangeText={setPhone}
          type="phone"
        />

        {/* Continue */}
        <Button
          title={loading ? 'Sending OTP…' : 'Continue'}
          onPress={handleSignup}
          disabled={!isFormValid}
          loading={loading}
          style={{ marginTop: 4 }}
        />

        {/* Login link */}
        <View className="flex-row justify-center mt-5">
          <Text className="text-[13.5px] text-ink-soft">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-[13.5px] text-teal font-bold">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
