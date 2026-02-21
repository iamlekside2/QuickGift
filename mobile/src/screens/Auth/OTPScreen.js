import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export default function OTPScreen({ navigation, route }) {
  const { phone, otpDev, fullName, email, isRegistration } = route.params || {};
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
      await verifyOTP(phone, code);
      // Navigation is handled automatically by RootNavigator when user state updates
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Invalid OTP');
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Verify Phone</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phone}>{phone || '+234 ****'}</Text>
        </Text>
      </View>

      {otpDev && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#E65100' }}>Your OTP code: {otpDev}</Text>
        </View>
      )}

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={[styles.otpInput, digit && styles.otpInputFilled]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            autoFocus={index === 0}
          />
        ))}
      </View>

      <Button
        title="Verify"
        onPress={handleVerify}
        loading={loading}
        disabled={!isComplete}
        size="lg"
        style={styles.verifyButton}
      />

      <View style={styles.resendRow}>
        {timer > 0 ? (
          <Text style={styles.timerText}>Resend code in {timer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendText}>Resend Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  phone: {
    fontWeight: '700',
    color: COLORS.text,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundGray,
    textAlign: 'center',
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  verifyButton: {
    width: '100%',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  timerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
  },
  resendText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
