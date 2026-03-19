import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function EditProfileScreen({ navigation }) {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || 'Lagos');

  const handleSave = () => {
    Alert.alert('Profile Updated', 'Your profile has been saved successfully.');
    navigation.goBack();
  };

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
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
          </View>
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-base text-teal font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-teal items-center justify-center">
            <Text className="text-white text-3xl font-bold">{fullName.charAt(0) || 'U'}</Text>
          </View>
          <TouchableOpacity className="mt-2">
            <Text className="text-sm text-teal font-medium">Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
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
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Full Name</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-[13px] font-bold text-gray-700 mb-2">Phone Number</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+234..."
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-[13px] font-bold text-gray-700 mb-2">Email</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="your@email.com"
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-[13px] font-bold text-gray-700 mb-2">City</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 border border-gray-100"
            value={city}
            onChangeText={setCity}
            placeholder="Lagos"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          className="bg-teal py-4 rounded-2xl items-center mb-10"
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={handleSave}
        >
          <Text className="text-base font-bold text-white">Save Changes</Text>
        </TouchableOpacity>

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
