import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export default function SignupScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState('user');
  const { dummyLogin } = useAuth();

  const handleSignup = () => {
    dummyLogin(selectedRole);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Choose how you want to use QuickGift</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>I want to join as</Text>

          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'user' && styles.roleCardActive]}
            onPress={() => setSelectedRole('user')}
          >
            <View style={[styles.roleIcon, selectedRole === 'user' && styles.roleIconActive]}>
              <Ionicons name="gift-outline" size={28} color={selectedRole === 'user' ? '#fff' : COLORS.primary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleName, selectedRole === 'user' && styles.roleNameActive]}>Customer</Text>
              <Text style={styles.roleDesc}>Browse and purchase gifts, book beauty services</Text>
            </View>
            <View style={[styles.radioOuter, selectedRole === 'user' && styles.radioOuterActive]}>
              {selectedRole === 'user' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'provider' && styles.roleCardActive]}
            onPress={() => setSelectedRole('provider')}
          >
            <View style={[styles.roleIcon, selectedRole === 'provider' && styles.roleIconActive]}>
              <Ionicons name="cut-outline" size={28} color={selectedRole === 'provider' ? '#fff' : COLORS.primary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleName, selectedRole === 'provider' && styles.roleNameActive]}>Service Provider</Text>
              <Text style={styles.roleDesc}>Offer beauty services, manage bookings and clients</Text>
            </View>
            <View style={[styles.radioOuter, selectedRole === 'provider' && styles.radioOuterActive]}>
              {selectedRole === 'provider' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <Button
            title={selectedRole === 'provider' ? 'Join as Provider' : 'Join as Customer'}
            onPress={handleSignup}
            size="lg"
          />

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
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
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundGray,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconActive: {
    backgroundColor: COLORS.primary,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  roleNameActive: {
    color: COLORS.primary,
  },
  roleDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
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
});
