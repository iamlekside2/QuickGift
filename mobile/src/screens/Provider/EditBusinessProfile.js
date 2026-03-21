import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { providersAPI } from '../../services/api';
import AppInput from '../../components/common/AppInput';

const CATEGORIES = [
  'Nails', 'Hair Styling', 'Makeup', 'Barber', 'Waxing', 'Massage',
  'Skincare', 'Lashes', 'Photography', 'Catering', 'Cleaning', 'Tailoring',
  'Seller', 'Other',
];
const SERVICE_TYPES = ['Home Service', 'Salon Visit', 'Both'];

export default function EditBusinessProfile({ navigation }) {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch business profile on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await providersAPI.me();
        const p = res.data;
        if (p) {
          setName(p.business_name || '');
          setBio(p.bio || '');
          setCategory(p.service_type || '');
          setAddress(p.location || p.city || '');
          setServiceType(
            p.offers_home_service && p.offers_salon_service ? 'Both'
            : p.offers_home_service ? 'Home Service'
            : 'Salon Visit'
          );
        }
      } catch (e) {
        console.log('Error loading business profile:', e);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your business name');
      return;
    }
    try {
      setSaving(true);
      const updateData = {
        business_name: name.trim(),
        bio: bio.trim(),
        location: address.trim(),
        is_available: true,
        offers_home_service: serviceType === 'Home Service' || serviceType === 'Both',
        offers_salon_service: serviceType === 'Salon Visit' || serviceType === 'Both',
      };

      await providersAPI.updateMe(updateData);

      Alert.alert('Saved', 'Your business profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#35615D" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
        className="px-5 pb-4 bg-white"
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Edit Business Profile</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Business Details */}
        <View className="bg-white rounded-2xl p-5 mb-5" style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text className="text-base font-bold text-gray-800 mb-4">Business Details</Text>

          <AppInput
            label="Business Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. GlowUp Studio"
            icon="storefront-outline"
          />
          <AppInput
            label="Bio / Description"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell customers about your business..."
            type="multiline"
            icon="document-text-outline"
          />
        </View>

        {/* Category */}
        <View className="bg-white rounded-2xl p-5 mb-5" style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text className="text-base font-bold text-gray-800 mb-3">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                className={`px-4 py-2.5 rounded-xl border ${category === cat ? 'bg-teal border-teal' : 'bg-gray-50 border-gray-200'}`}
                onPress={() => setCategory(cat)}
              >
                <Text className={`text-sm font-semibold ${category === cat ? 'text-white' : 'text-gray-600'}`}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact & Location */}
        <View className="bg-white rounded-2xl p-5 mb-5" style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text className="text-base font-bold text-gray-800 mb-4">Contact & Location</Text>
          <AppInput label="Phone" value={phone} onChangeText={setPhone} type="phone" />
          <AppInput label="Email" value={email} onChangeText={setEmail} type="email" icon="mail-outline" />
          <AppInput label="Address / Location" value={address} onChangeText={setAddress} icon="location-outline" placeholder="e.g. Lekki Phase 1, Lagos" />
        </View>

        {/* Service Type */}
        <View className="bg-white rounded-2xl p-5 mb-5" style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text className="text-base font-bold text-gray-800 mb-3">Service Type</Text>
          <View className="flex-row gap-2">
            {SERVICE_TYPES.map((st) => (
              <TouchableOpacity
                key={st}
                className={`flex-1 py-3 rounded-xl items-center border ${serviceType === st ? 'bg-teal border-teal' : 'bg-gray-50 border-gray-200'}`}
                onPress={() => setServiceType(st)}
              >
                <Text className={`text-xs font-bold ${serviceType === st ? 'text-white' : 'text-gray-600'}`}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center mb-8 ${saving ? 'bg-teal/70' : 'bg-teal'}`}
          style={{ shadowColor: '#35615D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Save Changes</Text>
          )}
        </TouchableOpacity>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
