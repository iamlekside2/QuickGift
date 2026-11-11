import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { providersAPI } from '../../services/api';
import AppInput from '../../components/common/AppInput';
import { apiError } from '../../utils/errors';
import { notifySuccess, notifyError } from '../../utils/haptics';

const DURATIONS = ['30 min', '1 hr', '1.5 hrs', '2 hrs', '3 hrs'];
const DURATION_MINUTES = {
  '30 min': 30, '1 hr': 60, '1.5 hrs': 90, '2 hrs': 120, '3 hrs': 180,
};

// The label for a stored duration (the nearest option when it is not exact).
const labelForMinutes = (minutes) => {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return '1 hr';
  return DURATIONS.reduce((best, label) =>
    Math.abs(DURATION_MINUTES[label] - m) < Math.abs(DURATION_MINUTES[best] - m) ? label : best,
  '1 hr');
};

// Add or edit one of the provider's own services (/providers/me/services).
export default function ServiceForm({ route, navigation }) {
  const existing = route.params?.service || {};
  const mode = route.params?.mode === 'edit' && existing.id ? 'edit' : 'add';

  const [name, setName] = useState(existing.name || '');
  const [description, setDescription] = useState(existing.description || '');
  const [duration, setDuration] = useState(labelForMinutes(existing.duration_minutes));
  const [price, setPrice] = useState(existing.price != null ? String(existing.price) : '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (saving || deleting) return;
    const cleanName = name.trim();
    const amount = Number(String(price).replace(/,/g, ''));
    if (!cleanName) {
      Alert.alert('Missing Fields', 'Please enter the service name.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Missing Fields', 'Please enter a price greater than zero.');
      return;
    }
    try {
      setSaving(true);
      const serviceData = {
        name: cleanName,
        description: description.trim(),
        duration_minutes: DURATION_MINUTES[duration] || 60,
        price: amount,
      };
      if (mode === 'edit') {
        // Update the existing service (never create a second copy).
        await providersAPI.updateMyService(existing.id, serviceData);
      } else {
        await providersAPI.addMyService(serviceData);
      }
      notifySuccess();
      Alert.alert(
        mode === 'add' ? 'Service Added' : 'Service Saved',
        `"${cleanName}" has been ${mode === 'add' ? 'added to' : 'saved in'} your services.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      notifyError();
      Alert.alert('Save Failed', apiError(err, 'We could not save this service. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (saving || deleting) return;
    Alert.alert('Delete Service', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const res = await providersAPI.deleteMyService(existing.id);
            Alert.alert(
              res.data?.archived ? 'Service Removed' : 'Service Deleted',
              res.data?.archived
                ? 'This service has bookings, so it was taken off your profile but kept in your booking history.'
                : `"${name}" has been deleted.`,
              [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
          } catch (err) {
            notifyError();
            Alert.alert('Delete Failed', apiError(err, 'We could not delete this service. Please try again.'));
          } finally {
            setDeleting(false);
          }
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
          shadowColor: '#211F1C',
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
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
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
            shadowColor: '#211F1C',
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

        {/* Duration Card */}
        <View
          className="bg-white rounded-2xl p-5 mb-6"
          style={{
            shadowColor: '#211F1C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Duration */}
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Duration</Text>
          <View className="flex-row flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                className={`px-4 py-2.5 rounded-xl ${
                  duration === d ? 'bg-teal' : 'bg-white border border-gray-100'
                }`}
                style={duration === d ? {
                  shadowColor: '#1F4A45',
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

        </View>

        {/* Save Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center mb-3 ${saving ? 'bg-teal/70' : 'bg-teal'}`}
          style={{
            shadowColor: '#1F4A45',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={handleSave}
          disabled={saving || deleting}
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
            disabled={saving || deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#D24B4B" />
            ) : (
              <Text className="text-base font-bold text-red-500">Delete Service</Text>
            )}
          </TouchableOpacity>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
