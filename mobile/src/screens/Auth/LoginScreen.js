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
import { apiError, apiStatus } from '../../utils/errors';
import { notifyError } from '../../utils/haptics';

const logoSmall = require('../../../assets/images/logo-small.png');

/**
 * Sign in. Two ways in:
 *  - 'password': phone number + password (always works).
 *  - 'code': a one-time code sent to the email on the account. This is also
 *    the "forgot password" route: sign in with a code, then set a new password
 *    in Settings.
 */
export default function LoginScreen({ navigation }) {
  const { sendOTP, login, guestLogin } = useAuth();
  const [mode, setMode] = useState('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizePhone = (raw) => {
    const digits = raw.replace(/[^0-9+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('0')) return '+234' + digits.slice(1);
    if (digits.startsWith('234')) return '+' + digits;
    return '+234' + digits;
  };

  const phoneOk = phone.replace(/[^0-9]/g, '').length >= 7;
  const canSubmit = mode === 'password' ? phoneOk && password.length > 0 : phoneOk;

  const handlePasswordLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await login(normalizePhone(phone), password);
      // RootNavigator swaps to the app once the session is saved.
    } catch (err) {
      notifyError();
      const status = apiStatus(err);
      if (status === 401) {
        // Wrong password, or an account that has never set one.
        Alert.alert(
          'Could not sign in',
          'That phone number and password do not match. If you have not set a password yet, sign in with a code instead.',
          [
            { text: 'Use a code', onPress: () => setMode('code') },
            { text: 'Try again', style: 'cancel' },
          ],
        );
      } else {
        // 429 lockout, 403 deactivated, network errors: show what the server said.
        Alert.alert('Could not sign in', apiError(err, 'Please check your connection and try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneOk) {
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
        sentTo: data?.sent_to,
        isRegistration: false,
      });
    } catch (err) {
      const message = apiError(err, 'We could not send your code. Please try again.');
      if (apiStatus(err) === 503) {
        // No channel could deliver the code. The server says what to do.
        Alert.alert('Code not sent', message, [
          { text: 'Use my password', onPress: () => setMode('password') },
          { text: 'Create an account', onPress: () => navigation.navigate('Signup') },
          { text: 'OK', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Could not send code', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isPassword = mode === 'password';

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
          <Text className="text-[14px] text-ink-soft mt-2 text-center">
            {isPassword
              ? 'Sign in with your phone number and password'
              : 'We will send a code to the email on your account'}
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

        {isPassword ? (
          <AppInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            type="password"
          />
        ) : null}

        {/* Continue */}
        <Button
          title={
            isPassword
              ? (loading ? 'Signing in…' : 'Sign in')
              : (loading ? 'Sending code…' : 'Send me a code')
          }
          onPress={isPassword ? handlePasswordLogin : handleSendOTP}
          disabled={!canSubmit}
          loading={loading}
          style={{ marginTop: 4 }}
        />

        {/* Switch between password and code */}
        <TouchableOpacity
          className="items-center py-4"
          onPress={() => setMode(isPassword ? 'code' : 'password')}
          disabled={loading}
        >
          <Text className="text-[13.5px] text-teal font-bold">
            {isPassword ? 'Forgot password? Sign in with a code' : 'Sign in with my password instead'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center gap-4 mb-6 mt-1">
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
