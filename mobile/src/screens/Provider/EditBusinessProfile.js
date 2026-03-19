import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['Nails', 'Hair Styling', 'Makeup', 'Barber', 'Waxing', 'Massage'];
const SERVICE_TYPES = ['Home Service', 'Salon Visit', 'Both'];

export default function EditBusinessProfile({ navigation }) {
  const [name, setName] = useState('Test Provider');
  const [bio, setBio] = useState('Professional nail technician with 5+ years experience.');
  const [category, setCategory] = useState('Nails');
  const [phone, setPhone] = useState('+234 809 876 5432');
  const [email, setEmail] = useState('provider@quickgift.ng');
  const [address, setAddress] = useState('15 Admiralty Way, Lekki, Lagos');
  const [serviceType, setServiceType] = useState('Both');

  const handleSave = () => {
    Alert.alert('Profile Updated', 'Your business profile has been saved.');
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
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
          <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Business Info Card */}
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
          {/* Business Name */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Business Name</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={name}
            onChangeText={setName}
            placeholder="Your business name"
            placeholderTextColor="#9CA3AF"
          />

          {/* Bio */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Bio</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={bio}
            onChangeText={setBio}
            placeholder="Describe your business..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            style={{ textAlignVertical: 'top', minHeight: 100 }}
          />

          {/* Category */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                className={`px-4 py-2 rounded-xl ${
                  category === cat ? 'bg-teal' : 'bg-white border border-gray-100'
                }`}
                style={category === cat ? {
                  shadowColor: '#35615D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                } : undefined}
                onPress={() => setCategory(cat)}
              >
                <Text className={`text-sm font-medium ${
                  category === cat ? 'text-white' : 'text-gray-600'
                }`}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Info Card */}
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
          {/* Phone */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Phone</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />

          {/* Email */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Email</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 mb-4 border border-gray-100"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />

          {/* Address */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Address</Text>
          <TextInput
            className="bg-white rounded-2xl px-4 py-4 text-sm text-gray-800 border border-gray-100"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Service Type Card */}
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
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Service Type</Text>
          <View className="flex-row gap-2">
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                className={`flex-1 py-3 rounded-2xl items-center ${
                  serviceType === type ? 'bg-teal' : 'bg-white border border-gray-100'
                }`}
                style={serviceType === type ? {
                  shadowColor: '#35615D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                } : undefined}
                onPress={() => setServiceType(type)}
              >
                <Text className={`text-xs font-medium ${
                  serviceType === type ? 'text-white' : 'text-gray-600'
                }`}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
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
