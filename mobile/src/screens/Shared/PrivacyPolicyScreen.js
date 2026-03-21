import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen({ navigation }) {
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
        <Text className="flex-1 text-center text-lg font-bold text-gray-800">Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-sm text-gray-400 mb-4">Last updated: March 2026</Text>

        <Text className="text-base font-bold text-gray-800 mb-2">1. Information We Collect</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          We collect information you provide directly: name, phone number, email, delivery addresses, and payment information. We also collect location data (with your permission) to show nearby providers and enable delivery services.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">2. How We Use Your Information</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          Your information is used to: process orders and deliveries, connect you with service providers, process payments, send order updates and notifications, improve our services, and provide customer support.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">3. Information Sharing</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          We share your information with: delivery partners (Kwik Delivery) to fulfill orders, payment processors (Paystack) to process payments, and service providers you book with. We never sell your personal data to third parties.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">4. Data Security</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          We use industry-standard encryption (HTTPS, bcrypt for passwords) to protect your data. Payment information is processed securely through Paystack and is never stored on our servers.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">5. Your Rights</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          You can: access your personal data, update your profile information, delete your account, and opt out of marketing communications. Contact support@quickgift.ng for any privacy-related requests.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">6. Location Data</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-4">
          We request location access to show nearby service providers and calculate delivery routes. Location data is only collected when you explicitly grant permission and can be revoked at any time through your device settings.
        </Text>

        <Text className="text-base font-bold text-gray-800 mb-2">7. Contact Us</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-8">
          If you have questions about this privacy policy, contact us at support@quickgift.ng or call +234 810 123 4567.
        </Text>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
