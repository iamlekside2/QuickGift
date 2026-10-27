import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import Button from '../../components/common/Button';
import { SerifHeadline } from '../../components/common/Typography';
import { useAuth } from '../../context/AuthContext';

export default function OTPScreen({ navigation, route }) {
  const { phone, otpDev, fullName, role, isRegistration } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const { verifyOTP, register, sendOTP } = useAuth();

  // Auto-fill OTP if dev code is available
  useEffect(() => {
    if (otpDev) {
      const digits = otpDev.toString().split('').slice(0, 6);
      setOtp(digits);
    }
  }, [otpDev]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isComplete = otp.every((digit) => digit !== '');

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    try {
      const code = otp.join('');
      if (isRegistration) {
        // Register new account then verify
        await register({
          full_name: fullName,
          phone,
          role: role || 'user',
          otp: code,
        });
      } else {
        // Login with OTP
        await verifyOTP(phone, code);
      }
      // Navigation is handled automatically by RootNavigator when user state updates
    } catch (err) {
      const detail = err.response?.data?.detail || 'Invalid OTP. Please try again.';
      const isAlreadyRegistered = detail.includes('already registered');
      Alert.alert(
        isAlreadyRegistered ? 'Account Exists' : 'Error',
        detail,
        isAlreadyRegistered
          ? [
              { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
              { text: 'Cancel', style: 'cancel' },
            ]
          : [{ text: 'OK' }]
      );
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendOTP(phone);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('OTP Sent', 'A new code has been sent to your phone');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  // Format phone for display
  const displayPhone = phone || '+234 ****';

  return (
    <View
      className="flex-1 bg-cream-warm px-5"
      style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
    >
      <StatusBar style="dark" />

      {/* Back Button */}
      <TouchableOpacity
        className="w-10 h-10 rounded-[14px] bg-sand items-center justify-center mb-8"
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color="#211F1C" />
      </TouchableOpacity>

      {/* Header */}
      <View className="items-center mb-10">
        <View
          className="w-20 h-20 rounded-[24px] bg-teal-light items-center justify-center mb-4"
        >
          <Ionicons name="shield-checkmark-outline" size={36} color="#1F4A45" />
        </View>
        <SerifHeadline text="Verify your phone" emphasis="phone" size={28} />
        <Text className="text-[13.5px] text-ink-soft text-center leading-5 mt-2">
          Enter the 6-digit code sent to{'\n'}
          <Text className="font-bold text-ink">{displayPhone}</Text>
        </Text>
      </View>

      {/* Dev OTP banner */}
      {otpDev && (
        <View className="bg-orange-light rounded-2xl p-3.5 mb-5 items-center">
          <Text className="text-xs text-orange font-bold">Dev OTP: {otpDev}</Text>
        </View>
      )}

      {/* OTP Input Row */}
      <View className="flex-row justify-center gap-2.5 mb-8">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            className={`w-12 h-14 rounded-2xl text-center text-xl font-bold ${
              digit ? 'bg-teal-light text-teal' : 'bg-gray-50 text-gray-800'
            }`}
            style={{
              borderWidth: 2,
              borderColor: digit ? '#1F4A45' : 'transparent',
              fontSize: 20,
            }}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            autoFocus={index === 0}
          />
        ))}
      </View>

      {/* Verify Button */}
      <Button
        title={isRegistration ? 'Create Account' : 'Verify & Login'}
        onPress={handleVerify}
        loading={loading}
        disabled={!isComplete}
        size="lg"
        style={{ width: '100%' }}
      />

      {/* Resend Row */}
      <View className="items-center mt-8">
        {timer > 0 ? (
          <Text className="text-sm text-gray-400">
            Resend code in <Text className="font-bold text-gray-600">{timer}s</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text className="text-sm text-teal font-bold">Resend Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
