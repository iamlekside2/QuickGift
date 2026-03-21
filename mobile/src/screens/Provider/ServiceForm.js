import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, Switch, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { providersAPI } from '../../services/api';
import AppInput from '../../components/common/AppInput';

const DURATIONS = ['30 min', '1 hr', '1.5 hrs', '2 hrs', '3 hrs'];
const CATEGORIES = [
  'Nails', 'Hair', 'Makeup', 'Barber', 'Waxing', 'Massage',
  'Skincare', 'Lashes', 'Tattoo', 'Piercing', 'Spa', 'Fitness',
  'Photography', 'Catering', 'Cleaning', 'Tailoring', 'Other',
];

export default function ServiceForm({ route, navigation }) {
  const { user } = useAuth();
  const mode = route.params?.mode || 'add';
  const existing = route.params?.service || {};

  const [name, setName] = useState(existing.name || '');
  const [description, setDescription] = useState(existing.description || '');
  const [duration, setDuration] = useState(existing.duration || '1 hr');
  const [price, setPrice] = useState(existing.price?.toString() || '');
  const [category, setCategory] = useState(existing.category || 'Nails');
  const [active, setActive] = useState(existing.active !== false);
  const [saving, setSaving] = useState(false);

  const durationToMinutes = {
    '30 min': 30, '1 hr': 60, '1.5 hrs': 90, '2 hrs': 120, '3 hrs': 180,
  };

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Missing Fields', 'Please fill in service name and price.');
      return;
    }
    try {
      setSaving(true);
      const serviceData = {
        name: name.trim(),
        description: description.trim(),
        duration_minutes: durationToMinutes[duration] || 60,
        price: parseFloat(price),
      };
      if (mode === 'edit' && existing.id) {
        // TODO: Add update service endpoint when available
        await providersAPI.addMyService(serviceData);
      } else {
        await providersAPI.addMyService(serviceData);
      }
      Alert.alert(
        mode === 'add' ? 'Service Added' : 'Service Saved',
        `"${name}" has been ${mode === 'add' ? 'added to' : 'saved in'} your services.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Something went wrong.';
      Alert.alert('Save Failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Service', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // TODO: Call delete API when available
          Alert.alert('Deleted', 'Service removed.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
      },
    ]);
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
          <Text className="text-xl font-bold text-gray-800">
            {mode === 'add' ? 'Add Service' : 'Edit Service'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Service Details Card */}
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
          {/* Service Name */}
          <AppInput
            label="Service Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gel Nails - Full Set"
            type="text"
          />

          {/* Description */}
          <AppInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what this service includes..."
            type="multiline"
          />

          {/* Price */}
          <AppInput
            label="Price (₦)"
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 8000"
            type="number"
          />
        </View>

        {/* Duration & Category Card */}
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
          {/* Duration */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Duration</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                className={`px-4 py-2.5 rounded-xl ${
                  duration === d ? 'bg-teal' : 'bg-white border border-gray-100'
                }`}
                style={duration === d ? {
                  shadowColor: '#35615D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                } : undefined}
                onPress={() => setDuration(d)}
              >
                <Text className={`text-sm font-medium ${
                  duration === d ? 'text-white' : 'text-gray-600'
                }`}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2">
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

        {/* Active Toggle */}
        <View
          className="flex-row items-center justify-between bg-white rounded-2xl p-4 mb-6"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View>
            <Text className="text-sm font-semibold text-gray-800">Active</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Clients can see and book this service</Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: '#E5E7EB', true: '#35615D' }}
            thumbColor="#fff"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center mb-3 ${saving ? 'bg-teal/70' : 'bg-teal'}`}
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">
              {mode === 'add' ? 'Add Service' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete Button (edit mode only) */}
        {mode === 'edit' && (
          <TouchableOpacity
            className="bg-red-50 py-4 rounded-2xl items-center mb-6"
            onPress={handleDelete}
          >
            <Text className="text-base font-bold text-red-500">Delete Service</Text>
          </TouchableOpacity>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
