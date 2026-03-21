import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import AppInput from '../../components/common/AppInput';

const CATEGORIES = ['Nails', 'Hair Styling', 'Makeup', 'Barber', 'Waxing', 'Massage'];
const SERVICE_TYPES = ['Home Service', 'Salon Visit', 'Both'];

export default function EditBusinessProfile({ navigation }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || user?.description || '');
  const [category, setCategory] = useState(user?.category || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || user?.city || '');
  const [serviceType, setServiceType] = useState(user?.service_type || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        full_name: name,
        bio,
        category,
        phone,
        email,
        address,
        service_type: serviceType,
      });
      Alert.alert('Profile Updated', 'Your business profile has been saved.');
      navigation.goBack();
    } catch (e) {
      console.log('Error saving profile:', e);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
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
          <AppInput
            label="Business Name"
            value={name}
            onChangeText={setName}
            placeholder="Your business name"
            type="text"
          />

          {/* Bio */}
          <AppInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Describe your business..."
            type="multiline"
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
          <AppInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Your phone number"
            type="phone"
          />

          {/* Email */}
          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Your email address"
            type="email"
          />

          {/* Address */}
          <AppInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Your business address"
            type="text"
            icon="location-outline"
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
            opacity: saving ? 0.7 : 1,
          }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Save Changes</Text>
          )}
        </TouchableOpacity>

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
