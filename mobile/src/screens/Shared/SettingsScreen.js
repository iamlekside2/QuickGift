import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }) {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View
        className="px-5 pb-4 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
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
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
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
            shadowColor: '#1F2937',
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
                trackColor={{ false: '#E5E7EB', true: '#35615D' }}
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
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {[
            { icon: 'language-outline', label: 'Language', value: 'English' },
            { icon: 'cash-outline', label: 'Currency', value: 'NGN (₦)' },
            { icon: 'shield-outline', label: 'Privacy Policy' },
            { icon: 'document-text-outline', label: 'Terms of Service' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              className={`flex-row items-center p-4 gap-3 ${i < 3 ? 'border-b border-gray-100' : ''}`}
            >
              <Ionicons name={item.icon} size={20} color="#6B7280" />
              <Text className="flex-1 text-sm font-medium text-gray-800">{item.label}</Text>
              {item.value && <Text className="text-xs text-gray-500">{item.value}</Text>}
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Danger Zone</Text>
        <TouchableOpacity className="bg-red-50 rounded-2xl p-4 flex-row items-center gap-3 mb-6">
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-red-500">Delete Account</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Permanently delete your account and data</Text>
          </View>
        </TouchableOpacity>

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
