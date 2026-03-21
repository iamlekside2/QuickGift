import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const SUPPORT_OPTIONS = [
  { icon: 'call-outline', label: 'Call us', sub: '+234 810 123 4567', color: '#35615D', action: 'tel:+2348101234567' },
  { icon: 'mail-outline', label: 'Email us', sub: 'support@quickgift.co', color: '#3B82F6', action: 'mailto:support@quickgift.co' },
  { icon: 'logo-whatsapp', label: 'WhatsApp', sub: 'Chat with our support team', color: '#25D366', action: 'https://wa.me/2348101234567' },
];

const FAQS = [
  { q: 'How do I track my order?', a: 'Go to Orders tab and tap on any order to see real-time tracking status.' },
  { q: 'How long does delivery take?', a: 'Same-day delivery is available for most items within Lagos. Other cities take 1-2 business days.' },
  { q: 'Can I cancel a booking?', a: 'Yes, you can cancel up to 2 hours before the scheduled time for a full refund.' },
  { q: 'How do I withdraw my earnings?', a: 'Go to Wallet > Withdraw and enter your bank details. Withdrawals are processed within 24 hours.' },
  { q: 'How do I become a verified provider?', a: 'Complete your business profile, add services, and submit your ID for verification.' },
];

export default function HelpSupportScreen({ navigation }) {
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
                shadowColor: '#1F2937',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
              onPress={() => opt.action && Linking.openURL(opt.action)}
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
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
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
                shadowColor: '#1F2937',
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
