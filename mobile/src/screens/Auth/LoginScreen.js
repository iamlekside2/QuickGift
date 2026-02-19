import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [loading, setLoading] = useState(false);
  const { sendOTP, guestLogin } = useAuth();

  const isValid = phone.length >= 10;

  const handleSendOTP = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const fullPhone = countryCode + phone;
      const res = await sendOTP(fullPhone);
      navigation.navigate('OTPVerification', {
        phone: fullPhone,
        otpDev: res.otp_dev, // Dev mode: show OTP
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Welcome to QuickGift</Text>
          <Text style={styles.subtitle}>Enter your phone number to get started</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.countryCode}>
              <Text style={styles.flag}>🇳🇬</Text>
              <Text style={styles.codeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.phoneInput, isValid && phone.length > 0 && styles.inputValid]}
              placeholder="8012345678"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>

          <Button
            title="Send OTP"
            onPress={handleSendOTP}
            loading={loading}
            disabled={!isValid}
            size="lg"
            style={styles.otpButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={22} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => { guestLogin(); navigation.replace('MainApp'); }}
          >
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    paddingBottom: 40,
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
  },
  form: {
    gap: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: -SPACING.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundGray,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.xs,
  },
  flag: {
    fontSize: 18,
  },
  codeText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundGray,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputValid: {
    borderColor: COLORS.success,
  },
  otpButton: {
    marginTop: SPACING.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  socialButton: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  bottomText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  guestText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
