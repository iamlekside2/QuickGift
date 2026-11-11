import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Switch, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../utils/errors';
import { notifyError } from '../../utils/haptics';

const NOTIF_STORAGE_KEY = '@quickgift_notification_prefs';

export default function SettingsScreen({ navigation }) {
  const { deleteAccount, isAuthenticated, isGuest, user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);

  // Load notification preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
        if (stored) {
          const prefs = JSON.parse(stored);
          setPushNotifs(prefs.push ?? true);
          setEmailNotifs(prefs.email ?? true);
          setSmsNotifs(prefs.sms ?? false);
        }
      } catch (err) {
        console.log('Error loading notification prefs:', err);
      }
    };
    loadPrefs();
  }, []);

  // Persist notification preferences whenever they change
  useEffect(() => {
    const savePrefs = async () => {
      try {
        await AsyncStorage.setItem(
          NOTIF_STORAGE_KEY,
          JSON.stringify({ push: pushNotifs, email: emailNotifs, sms: smsNotifs })
        );
      } catch (err) {
        console.log('Error saving notification prefs:', err);
      }
    };
    savePrefs();
  }, [pushNotifs, emailNotifs, smsNotifs]);

  // Really deletes the account on the server. On success the session ends
  // (which returns the app to the sign-in screens); if the server refuses, for
  // example because the wallet still holds money, its reason is shown.
  const confirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      // Signed out: this screen is unmounted by the navigator.
    } catch (err) {
      setDeleting(false);
      notifyError();
      Alert.alert(
        'Account not deleted',
        apiError(err, 'We could not delete your account right now. Please try again.'),
      );
    }
  };

  const handleDeleteAccount = () => {
    if (deleting) return;
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const PRIVACY_URL = 'https://quickgift.ng/privacy';
  const TERMS_URL = 'https://quickgift.ng/terms';

  const accountItems = [
    // Signed-in accounts only: set a password, or change the existing one.
    ...(isAuthenticated && !isGuest
      ? [{
          icon: 'lock-closed-outline',
          label: 'Password',
          value: user?.has_password ? 'Change' : 'Not set',
          onPress: () => navigation.navigate('ChangePassword'),
        }]
      : []),
    { icon: 'language-outline', label: 'Language', value: 'English' },
    { icon: 'cash-outline', label: 'Currency', value: 'NGN (\u20A6)' },
    { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => navigation.navigate('PrivacyPolicy') },
    { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => navigation.navigate('Terms') },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View
        className="px-5 pb-4 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#211F1C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Settings</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Notifications</Text>
        <View
          className="bg-white rounded-2xl overflow-hidden mb-6"
          style={{
            shadowColor: '#211F1C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {[
            { label: 'Push Notifications', sub: 'Booking alerts, messages', value: pushNotifs, set: setPushNotifs },
            { label: 'Email Notifications', sub: 'Order confirmations, receipts', value: emailNotifs, set: setEmailNotifs },
            { label: 'SMS Notifications', sub: 'Important updates only', value: smsNotifs, set: setSmsNotifs },
          ].map((item, i) => (
            <View key={i} className={`flex-row items-center justify-between p-4 ${i < 2 ? 'border-b border-gray-100' : ''}`}>
              <View>
                <Text className="text-sm font-semibold text-gray-800">{item.label}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{item.sub}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.set}
                trackColor={{ false: '#EAE3D8', true: '#1F4A45' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Account */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Account</Text>
        <View
          className="bg-white rounded-2xl overflow-hidden mb-6"
          style={{
            shadowColor: '#211F1C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {accountItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              className={`flex-row items-center p-4 gap-3 ${i < accountItems.length - 1 ? 'border-b border-gray-100' : ''}`}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={20} color="#6E6A63" />
              <Text className="flex-1 text-sm font-medium text-gray-800">{item.label}</Text>
              {item.value && <Text className="text-xs text-gray-500">{item.value}</Text>}
              <Ionicons name="chevron-forward" size={16} color="#B5AFA2" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone (signed-in accounts only: a guest has nothing to delete) */}
        {isAuthenticated && !isGuest ? (
          <>
            <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Danger Zone</Text>
            <TouchableOpacity
              className="bg-red-50 rounded-2xl p-4 flex-row items-center gap-3 mb-6"
              onPress={handleDeleteAccount}
              disabled={deleting}
              style={{ opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#D24B4B" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#D24B4B" />
              )}
              <View className="flex-1">
                <Text className="text-sm font-bold text-red-500">{deleting ? 'Deleting your account...' : 'Delete Account'}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Permanently delete your account and data</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : null}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
