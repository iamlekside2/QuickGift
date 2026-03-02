import React from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { dummyLogin, guestLogin } = useAuth();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Welcome to QuickGift</Text>
          <Text style={styles.subtitle}>Choose an account to get started</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={styles.loginCard}
            onPress={() => dummyLogin('user')}
            activeOpacity={0.7}
          >
            <View style={[styles.loginIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="gift-outline" size={26} color={COLORS.primary} />
            </View>
            <View style={styles.loginInfo}>
              <Text style={styles.loginName}>Login as Customer</Text>
              <Text style={styles.loginDesc}>Browse gifts & book beauty services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginCard}
            onPress={() => dummyLogin('provider')}
            activeOpacity={0.7}
          >
            <View style={[styles.loginIcon, { backgroundColor: '#7C3AED15' }]}>
              <Ionicons name="cut-outline" size={26} color="#7C3AED" />
            </View>
            <View style={styles.loginInfo}>
              <Text style={styles.loginName}>Login as Provider</Text>
              <Text style={styles.loginDesc}>Manage bookings & offer services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => guestLogin()}
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
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundGray,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  loginIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginInfo: {
    flex: 1,
  },
  loginName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  loginDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
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
