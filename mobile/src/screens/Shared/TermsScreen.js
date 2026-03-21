import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen({ navigation }) {
  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View
        className="flex-row items-center px-5 pb-4 bg-white border-b border-gray-100"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-800">Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-sm text-gray-400 mb-4">Last updated: March 2026</Text>

        <Text className="text-base font-bold text-gray-800 mb-2">1. Acceptance of Terms</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          By using QuickGift, you agree to these Terms of Service. If you do not agree, please do not use the app. These terms apply to all users including buyers, providers, and sellers.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">2. Services</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          QuickGift is a marketplace connecting gift buyers with sellers and beauty service providers. We facilitate transactions but are not the direct seller or service provider. Each provider/seller operates independently.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">3. User Accounts</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          You must provide accurate information when creating an account. You are responsible for maintaining the security of your account. You must be at least 18 years old to use this service.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">4. Payments & Refunds</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          Payments are processed through Paystack. A 10% platform fee applies to all transactions. Refunds for cancelled orders are credited to your QuickGift wallet. Withdrawal to bank accounts is processed within 24 hours.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">5. Provider/Seller Obligations</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          Providers and sellers must: maintain accurate listings, fulfill orders promptly, maintain quality standards, and comply with all applicable laws. QuickGift reserves the right to suspend or remove accounts that violate these terms.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">6. Limitation of Liability</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          QuickGift is not liable for: quality of third-party products or services, delivery delays caused by logistics partners, or disputes between buyers and providers. We provide a platform and facilitate, but do not guarantee outcomes.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">7. Contact</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-8">
          For questions about these terms, contact support@quickgift.ng.
        </Text>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
