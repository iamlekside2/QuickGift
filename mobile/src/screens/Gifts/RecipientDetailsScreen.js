import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function RecipientDetailsScreen({ route, navigation }) {
  const gift = route.params?.gift || {};

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  const handleNext = () => {
    navigation.navigate('PaymentScreen', {
      gift,
      recipient: { name, phone, address, note },
    });
  };

  const isValid = name.trim() && phone.trim() && address.trim();

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-5 pb-3 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Recipient Details</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Gift summary */}
        <View
          className="bg-white rounded-2xl p-4 flex-row items-center gap-3 mb-6"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="w-14 h-14 rounded-xl bg-teal-light items-center justify-center">
            <Text style={{ fontSize: 28 }}>🎁</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-800">{gift.name || 'Gift'}</Text>
            <Text className="text-xs text-gray-500">{gift.vendor_name || gift.vendor || ''}</Text>
          </View>
          <Text className="text-base font-extrabold text-teal">₦{(gift.price || 0).toLocaleString()}</Text>
        </View>

        <Text className="text-base font-bold text-gray-800 mb-4">Who's receiving this gift?</Text>

        {/* Form Card */}
        <View
          className="bg-white rounded-2xl p-5 mb-6"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Recipient Name */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Recipient Name</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Samuel Odion"
            placeholderTextColor="#9CA3AF"
          />

          {/* Phone */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Phone Number</Text>
          <View className="flex-row items-center bg-white rounded-2xl mb-4 overflow-hidden border border-gray-100">
            <View className="px-3 py-4 bg-gray-50 flex-row items-center gap-1">
              <Text className="text-sm text-gray-700">🇳🇬 +234</Text>
            </View>
            <TextInput
              className="flex-1 px-3 py-4 text-sm text-gray-800"
              value={phone}
              onChangeText={setPhone}
              placeholder="806 789 1234"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>

          {/* Address */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Delivery Address</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={address}
            onChangeText={setAddress}
            placeholder="15 Freedom Avenue, Lagos"
            placeholderTextColor="#9CA3AF"
          />

          {/* Optional Note */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Personal Note (Optional)</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 border border-gray-100"
            value={note}
            onChangeText={setNote}
            placeholder="Happy Birthday! Wishing you the best..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            style={{ textAlignVertical: 'top', minHeight: 80 }}
          />
        </View>

        <View className="h-[100px]" />
      </ScrollView>

      {/* Bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4"
        style={{
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${isValid ? 'bg-teal' : 'bg-gray-300'}`}
          style={isValid ? {
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          } : undefined}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text className={`text-base font-bold ${isValid ? 'text-white' : 'text-gray-500'}`}>
            Continue to Payment
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
