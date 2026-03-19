import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput as PaperInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const paperTheme = {
  colors: {
    primary: '#35615D',
    onSurfaceVariant: '#9CA3AF',
    outline: '#E5E7EB',
    background: '#F9FAFB',
  },
  roundness: 12,
};

const POPULAR_AREAS = [
  'Lekki, Lagos',
  'Ikeja, Lagos',
  'Victoria Island, Lagos',
  'Surulere, Lagos',
  'Ajah, Lagos',
  'Yaba, Lagos',
  'Wuse, Abuja',
  'Garki, Abuja',
  'Maitama, Abuja',
  'GRA, Port Harcourt',
  'Bodija, Ibadan',
  'Enugu South',
];

export default function SetLocationScreen() {
  const { user, updateProfile, updateUser } = useAuth();
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = area.trim().length >= 2;

  const handleContinue = async () => {
    if (!isValid) {
      Alert.alert('Required', 'Please enter or select your area');
      return;
    }
    setLoading(true);
    try {
      // Save area as both city and address on the backend
      await updateProfile({ city: area.trim(), address: area.trim() });
      updateUser({ city: area.trim() });
    } catch (err) {
      // If API fails, just save locally
      updateUser({ city: area.trim() });
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
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Platform.OS === 'ios' ? 70 : 50,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-3xl bg-teal-light items-center justify-center mb-4"
            style={{
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Ionicons name="location-outline" size={36} color="#35615D" />
          </View>
          <Text className="text-2xl font-extrabold text-gray-800 mb-2">
            Set Your Location
          </Text>
          <Text className="text-sm text-gray-400 text-center leading-5 px-4">
            Hi {user?.full_name?.split(' ')[0]}! Tell us your area so we can show you nearby gift shops and beauty providers.
          </Text>
        </View>

        {/* Popular Areas */}
        <View className="mb-5">
          <Text className="text-sm font-bold text-gray-700 mb-3">Popular Areas</Text>
          <View className="flex-row flex-wrap gap-2">
            {POPULAR_AREAS.map((a) => (
              <TouchableOpacity
                key={a}
                className={`px-3.5 py-2.5 rounded-xl border ${
                  area === a
                    ? 'bg-teal border-teal'
                    : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => setArea(a)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    area === a ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Or type it */}
        <View className="mb-8">
          <PaperInput
            mode="outlined"
            label="Or type your area"
            placeholder="e.g. Ikoyi, Lagos"
            value={area}
            onChangeText={setArea}
            autoCapitalize="words"
            left={<PaperInput.Icon icon="map-marker-outline" color="#9CA3AF" />}
            theme={paperTheme}
            outlineStyle={{ borderRadius: 12 }}
            style={{ backgroundColor: '#F9FAFB' }}
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${isValid ? 'bg-teal' : 'bg-gray-200'}`}
          style={isValid ? {
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          } : undefined}
          onPress={handleContinue}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          <Text className={`text-base font-bold ${isValid ? 'text-white' : 'text-gray-400'}`}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
