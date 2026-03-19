import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput as PaperInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { providersAPI } from '../../services/api';

const logoSmall = require('../../../assets/images/logo-small.png');

const paperTheme = {
  colors: {
    primary: '#35615D',
    onSurfaceVariant: '#9CA3AF',
    outline: '#E5E7EB',
    background: '#F9FAFB',
  },
  roundness: 12,
};

const SERVICE_TYPES = [
  'Hair Styling',
  'Makeup',
  'Nails',
  'Barber',
  'Massage',
  'Waxing',
  'Skincare',
  'Lashes',
  'Other',
];

export default function CompleteSetupScreen() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1); // 1 = business info, 2 = service & location
  const [loading, setLoading] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const isStep1Valid = businessName.trim().length >= 2;
  const isStep2Valid = serviceType && city.trim().length >= 2;

  const handleNext = () => {
    if (!isStep1Valid) {
      Alert.alert('Required', 'Please enter your business name');
      return;
    }
    setStep(2);
  };

  const handleComplete = async () => {
    if (!isStep2Valid) {
      Alert.alert('Required', 'Please select a service type and enter your city');
      return;
    }
    setLoading(true);
    try {
      await providersAPI.register({
        business_name: businessName.trim(),
        service_type: serviceType,
        city: city.trim(),
        location: location.trim() || city.trim(),
        bio: bio.trim() || undefined,
      });
      // Mark profile as complete in local user state
      updateUser({ profile_complete: true });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-3xl bg-orange-light items-center justify-center mb-4"
            style={{
              shadowColor: '#FD8950',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Ionicons name="storefront-outline" size={36} color="#FD8950" />
          </View>
          <Text className="text-2xl font-extrabold text-gray-800 mb-2">
            Complete Your Setup
          </Text>
          <Text className="text-sm text-gray-400 text-center leading-5 px-4">
            Hi {user?.full_name?.split(' ')[0]}! Set up your business profile so customers can find and book you.
          </Text>
        </View>

        {/* Progress */}
        <View className="flex-row items-center mb-8 px-4">
          <View className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-teal' : 'bg-gray-200'}`} />
          <View className="w-3" />
          <View className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-teal' : 'bg-gray-200'}`} />
        </View>

        {step === 1 ? (
          <>
            {/* Step 1: Business Info */}
            <Text className="text-lg font-bold text-gray-800 mb-1">Business Info</Text>
            <Text className="text-sm text-gray-400 mb-5">What's the name of your business?</Text>

            <View className="mb-4">
              <PaperInput
                mode="outlined"
                label="Business Name"
                placeholder="e.g. GlowUp Studio"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
                left={<PaperInput.Icon icon="store-outline" color="#9CA3AF" />}
                theme={paperTheme}
                outlineStyle={{ borderRadius: 12 }}
                style={{ backgroundColor: '#F9FAFB' }}
              />
            </View>

            <View className="mb-6">
              <PaperInput
                mode="outlined"
                label="Short Bio (optional)"
                placeholder="Tell customers about yourself..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                left={<PaperInput.Icon icon="text-box-outline" color="#9CA3AF" />}
                theme={paperTheme}
                outlineStyle={{ borderRadius: 12 }}
                style={{ backgroundColor: '#F9FAFB' }}
              />
            </View>

            <TouchableOpacity
              className={`py-4 rounded-2xl items-center ${isStep1Valid ? 'bg-teal' : 'bg-gray-200'}`}
              style={isStep1Valid ? {
                shadowColor: '#35615D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              } : undefined}
              onPress={handleNext}
              disabled={!isStep1Valid}
              activeOpacity={0.85}
            >
              <Text className={`text-base font-bold ${isStep1Valid ? 'text-white' : 'text-gray-400'}`}>
                Next
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Step 2: Service & Location */}
            <Text className="text-lg font-bold text-gray-800 mb-1">Service & Location</Text>
            <Text className="text-sm text-gray-400 mb-5">What do you offer and where are you based?</Text>

            {/* Service Type Chips */}
            <View className="mb-5">
              <Text className="text-sm font-bold text-gray-700 mb-3">Service Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {SERVICE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    className={`px-4 py-2.5 rounded-xl border ${
                      serviceType === type
                        ? 'bg-teal border-teal'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onPress={() => setServiceType(type)}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        serviceType === type ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* City */}
            <View className="mb-4">
              <PaperInput
                mode="outlined"
                label="City"
                placeholder="e.g. Lagos"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
                left={<PaperInput.Icon icon="city-variant-outline" color="#9CA3AF" />}
                theme={paperTheme}
                outlineStyle={{ borderRadius: 12 }}
                style={{ backgroundColor: '#F9FAFB' }}
              />
            </View>

            {/* Location / Area */}
            <View className="mb-6">
              <PaperInput
                mode="outlined"
                label="Area / Address (optional)"
                placeholder="e.g. Lekki Phase 1, Lagos"
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
                left={<PaperInput.Icon icon="map-marker-outline" color="#9CA3AF" />}
                theme={paperTheme}
                outlineStyle={{ borderRadius: 12 }}
                style={{ backgroundColor: '#F9FAFB' }}
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-4 rounded-2xl items-center border-2 border-gray-200"
                onPress={() => setStep(1)}
              >
                <Text className="text-base font-bold text-gray-600">Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-[2] py-4 rounded-2xl items-center ${isStep2Valid ? 'bg-teal' : 'bg-gray-200'}`}
                style={isStep2Valid ? {
                  shadowColor: '#35615D',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                } : undefined}
                onPress={handleComplete}
                disabled={!isStep2Valid || loading}
                activeOpacity={0.85}
              >
                <Text className={`text-base font-bold ${isStep2Valid ? 'text-white' : 'text-gray-400'}`}>
                  {loading ? 'Setting up...' : 'Start Selling'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
