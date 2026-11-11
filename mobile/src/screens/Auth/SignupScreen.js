import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { useAuth } from '../../context/AuthContext';
import AppInput from '../../components/common/AppInput';
import Button from '../../components/common/Button';
import { SerifHeadline } from '../../components/common/Typography';
import { apiError, apiStatus } from '../../utils/errors';
import { referralAPI } from '../../services/api';

const logoSmall = require('../../../assets/images/logo-small.png');

const ROLES = [
  { id: 'user', label: 'Shop & book', icon: 'gift-outline' },
  { id: 'provider', label: 'Offer services', icon: 'briefcase-outline' },
];

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
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
  // Text messages are not live yet, so the verification code can only reach a
  // new account by email: the address is required for now.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  // A password means the account can always sign in, even when a code cannot
  // be delivered.
  const passwordOk = password.length >= 6;
  const isFormValid = fullName.trim().length >= 2 && isValidPhone && emailOk && passwordOk;

  const handleSignup = async () => {
    if (!isFormValid) {
      Alert.alert(
        'Missing Info',
        !emailOk
          ? 'Please enter a valid email address. We send your verification code there.'
          : !passwordOk
            ? 'Please choose a password of at least 6 characters.'
            : 'Please enter your name and a valid phone number.',
      );
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

      // A friend's code is optional. Say so now if it is wrong, rather than
      // after the verification code has been sent. If the check itself cannot
      // be reached, carry on: the server simply ignores a code it cannot use.
      const friendCode = referralCode.trim();
      if (friendCode) {
        let valid = true;
        try {
          valid = (await referralAPI.check(friendCode)).data?.valid !== false;
        } catch {
          valid = true;
        }
        if (!valid) {
          Alert.alert(
            'Referral code not recognised',
            'Please check the code with your friend, or clear the field to continue without one.',
          );
          setLoading(false);
          return;
        }
      }

      const cleanEmail = email.trim().toLowerCase();
      const data = await sendOTP(fullPhone, cleanEmail);
      navigation.navigate('OTP', {
        phone: fullPhone,
        email: cleanEmail,
        otpDev: data?.otp_dev,
        sentTo: data?.sent_to,
        fullName: fullName.trim(),
        password,
        referralCode: friendCode || undefined,
        role: selectedRole,
        isRegistration: true,
      });
    } catch (err) {
      Alert.alert(
        apiStatus(err) === 503 ? 'Code not sent' : 'Could not send code',
        apiError(err, 'We could not send your code. Please try again.'),
      );
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

        {/* Email (required while text messages are not live) */}
        <AppInput
          label="Email"
          placeholder="you@email.com"
          value={email}
          onChangeText={setEmail}
          type="email"
          icon="mail-outline"
        />
        <Text className="text-[12px] text-ink-soft -mt-2 mb-3">
          We send your verification code to this email.
        </Text>

        {/* Password */}
        <AppInput
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          type="password"
          error={password.length > 0 && !passwordOk ? 'Use at least 6 characters' : ''}
        />

        {/* Friend's referral code (optional) */}
        <AppInput
          label="Referral code (optional)"
          placeholder="Got a code from a friend?"
          value={referralCode}
          onChangeText={(t) => setReferralCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          type="text"
          icon="gift-outline"
          maxLength={16}
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
