import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';

const SUPPORT_EMAIL = 'admin@quickgift.ng';

// Only ways of reaching us that really work.
const SUPPORT_OPTIONS = [
  { icon: 'mail-outline', label: 'Email us', sub: SUPPORT_EMAIL, color: '#4C7CB0', action: `mailto:${SUPPORT_EMAIL}` },
  { icon: 'chatbox-ellipses-outline', label: 'Send feedback', sub: 'Report an issue or share an idea', color: '#E8632F', screen: 'Feedback' },
];

// Answers describe what the app does today.
const FAQS = [
  { q: 'How do I track my order?', a: 'Open the Orders tab and tap an order to see its status, the items in it and the delivery address.' },
  { q: 'Can I cancel an order or a booking?', a: 'Yes. Open the Orders tab and tap Cancel. An order can be cancelled while it is pending or confirmed, and a booking while it is pending, accepted or confirmed.' },
  { q: 'How do refunds work?', a: 'When a paid order or booking is cancelled, the amount you paid is refunded to your QuickGift wallet. You can use your wallet balance to pay for your next order.' },
  { q: 'How do I pay?', a: 'You can pay by card at checkout, or from your wallet if it has enough money in it. You can add money to your wallet from the Wallet screen.' },
  { q: 'How do I withdraw my earnings?', a: 'Open Wallet, choose Withdraw, pick your bank account and enter the amount. Withdrawals are processed by our team, usually within 1-2 working days.' },
  { q: 'How do I become a verified provider?', a: 'Complete your business profile and add your services. Our team reviews every new provider, and you are notified once your account is approved.' },
  { q: 'How do I delete my account?', a: 'Open Settings and choose Delete Account. Withdraw any wallet balance first, and wait for orders or bookings in progress to finish.' },
];

export default function HelpSupportScreen({ navigation }) {
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
          <Text className="text-xl font-bold text-gray-800">Help & Support</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Contact Us</Text>
        <View className="gap-3 mb-6">
          {SUPPORT_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={i}
              className="flex-row items-center bg-white rounded-2xl p-4 gap-3"
              style={{
                shadowColor: '#211F1C',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
              onPress={() => {
                if (opt.screen) {
                  navigation.navigate(opt.screen);
                } else if (opt.action) {
                  Linking.openURL(opt.action).catch(() => {
                    Alert.alert('Email us', `Write to us at ${SUPPORT_EMAIL} and we will get back to you.`);
                  });
                }
              }}
            >
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center"
                style={{ backgroundColor: opt.color + '15' }}
              >
                <Ionicons name={opt.icon} size={20} color={opt.color} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800">{opt.label}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{opt.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#B5AFA2" />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">FAQs</Text>
        <View className="gap-3 mb-6">
          {FAQS.map((faq, i) => (
            <View
              key={i}
              className="bg-white rounded-2xl p-4"
              style={{
                shadowColor: '#211F1C',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-sm font-semibold text-gray-800">{faq.q}</Text>
              <Text className="text-xs text-gray-500 mt-2 leading-[18px]">{faq.a}</Text>
            </View>
          ))}
        </View>

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
