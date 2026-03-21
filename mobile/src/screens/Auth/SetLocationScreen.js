import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput as PaperInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

const paperTheme = {
  colors: {
    primary: '#35615D',
    onSurfaceVariant: '#9CA3AF',
    outline: '#E5E7EB',
    background: '#F9FAFB',
  },
  roundness: 12,
};

// Each area mapped to approximate center coordinates
const POPULAR_AREAS = [
  { name: 'Lekki, Lagos', lat: 6.4478, lng: 3.4723 },
  { name: 'Ikeja, Lagos', lat: 6.6018, lng: 3.3515 },
  { name: 'Victoria Island, Lagos', lat: 6.4281, lng: 3.4219 },
  { name: 'Surulere, Lagos', lat: 6.4969, lng: 3.3488 },
  { name: 'Ajah, Lagos', lat: 6.4698, lng: 3.5852 },
  { name: 'Yaba, Lagos', lat: 6.5158, lng: 3.3752 },
  { name: 'Wuse, Abuja', lat: 9.0579, lng: 7.4951 },
  { name: 'Garki, Abuja', lat: 9.0380, lng: 7.4891 },
  { name: 'Maitama, Abuja', lat: 9.0831, lng: 7.5009 },
  { name: 'GRA, Port Harcourt', lat: 4.8156, lng: 7.0498 },
  { name: 'Bodija, Ibadan', lat: 7.4224, lng: 3.9003 },
  { name: 'Enugu South', lat: 6.4200, lng: 7.5100 },
];

export default function SetLocationScreen() {
  const { user, updateProfile, updateUser } = useAuth();
  const { refreshLocation } = useLocation();
  const [area, setArea] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const isValid = area.trim().length >= 2;

  const handleGPS = async () => {
    setGpsLoading(true);
    try {
      const result = await refreshLocation();
      if (result) {
        const areaName = result.areaName || 'Your Location';
        setArea(areaName);
        setSelectedCoords({ lat: result.lat, lng: result.lng });
      } else {
        Alert.alert(
          'Location Permission',
          'Please enable location access in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Could not get your location. Please select an area manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleAreaSelect = (areaObj) => {
    setArea(areaObj.name);
    setSelectedCoords({ lat: areaObj.lat, lng: areaObj.lng });
  };

  const handleContinue = async () => {
    if (!isValid) {
      Alert.alert('Required', 'Please enter or select your area');
      return;
    }
    setLoading(true);
    try {
      const profileData = { city: area.trim(), address: area.trim() };
      if (selectedCoords) {
        profileData.lat = selectedCoords.lat;
        profileData.lng = selectedCoords.lng;
      }
      await updateProfile(profileData);
      updateUser({ city: area.trim(), lat: selectedCoords?.lat, lng: selectedCoords?.lng });
    } catch (err) {
      updateUser({ city: area.trim(), lat: selectedCoords?.lat, lng: selectedCoords?.lng });
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
        <View className="items-center mb-6">
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
            Hi {user?.full_name?.split(' ')[0]}! We need your location to show nearby providers and gift shops.
          </Text>
        </View>

        {/* GPS Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2.5 py-4 rounded-2xl bg-teal mb-6"
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={handleGPS}
          disabled={gpsLoading}
          activeOpacity={0.85}
        >
          {gpsLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="navigate" size={20} color="#fff" />
          )}
          <Text className="text-white font-bold text-sm">
            {gpsLoading ? 'Getting your location...' : 'Use My Current Location'}
          </Text>
        </TouchableOpacity>

        {/* Detected area display */}
        {selectedCoords && area && (
          <View className="flex-row items-center gap-2 bg-teal-light/50 rounded-xl px-4 py-3 mb-5">
            <Ionicons name="checkmark-circle" size={18} color="#35615D" />
            <Text className="text-sm text-teal font-semibold flex-1">{area}</Text>
          </View>
        )}

        {/* Divider */}
        <View className="flex-row items-center mb-5">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="px-3 text-xs text-gray-400 font-medium">or pick an area</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Popular Areas */}
        <View className="mb-5">
          <View className="flex-row flex-wrap gap-2">
            {POPULAR_AREAS.map((a) => (
              <TouchableOpacity
                key={a.name}
                className={`px-3.5 py-2.5 rounded-xl border ${
                  area === a.name
                    ? 'bg-teal border-teal'
                    : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => handleAreaSelect(a)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    area === a.name ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {a.name}
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
            onChangeText={(text) => {
              setArea(text);
              setSelectedCoords(null); // Clear coords when typing custom
            }}
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
