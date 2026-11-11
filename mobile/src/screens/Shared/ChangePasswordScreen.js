import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../../components/common/ScreenHeader';
import AppInput from '../../components/common/AppInput';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../utils/errors';
import { notifySuccess, notifyError } from '../../utils/haptics';

const MIN_LENGTH = 6;

/**
 * Set a password (for an account that has only ever signed in with a code) or
 * change the existing one. With a password the account can always sign in,
 * even when a verification code cannot be delivered.
 */
export default function ChangePasswordScreen({ navigation }) {
  const { user, setPassword } = useAuth();
  const hasPassword = !!user?.has_password;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSave =
    next.length >= MIN_LENGTH && confirm === next && (!hasPassword || current.length > 0);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await setPassword(next, hasPassword ? current : undefined);
      notifySuccess();
      Alert.alert(
        hasPassword ? 'Password changed' : 'Password set',
        'You can now sign in with your phone number and this password.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      notifyError();
      Alert.alert('Password not saved', apiError(err, 'We could not save your password. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-cream"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScreenHeader
        variant="stack"
        title={hasPassword ? 'Change password' : 'Set a password'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView className="px-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="text-[13.5px] text-ink-soft leading-5 mt-4 mb-5">
          {hasPassword
            ? 'Enter your current password, then choose a new one.'
            : 'A password lets you sign in at any time, even if a verification code cannot reach you.'}
        </Text>

        {hasPassword ? (
          <AppInput
            label="Current password"
            placeholder="Your current password"
            value={current}
            onChangeText={setCurrent}
            type="password"
          />
        ) : null}

        <AppInput
          label="New password"
          placeholder={`At least ${MIN_LENGTH} characters`}
          value={next}
          onChangeText={setNext}
          type="password"
          error={tooShort ? `Use at least ${MIN_LENGTH} characters` : ''}
        />

        <AppInput
          label="Confirm new password"
          placeholder="Type it again"
          value={confirm}
          onChangeText={setConfirm}
          type="password"
          error={mismatch ? 'The two passwords do not match' : ''}
        />

        <Button
          title={saving ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
          onPress={handleSave}
          disabled={!canSave}
          loading={saving}
          style={{ marginTop: 8 }}
        />
        <View className="h-10" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
