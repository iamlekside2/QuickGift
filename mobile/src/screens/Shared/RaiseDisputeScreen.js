import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/common/AppInput';
import { disputesAPI } from '../../services/api';

const REASONS = [
  { key: 'not_received', label: 'Item not received', icon: 'cube-outline' },
  { key: 'wrong_item', label: 'Wrong item delivered', icon: 'swap-horizontal-outline' },
  { key: 'poor_quality', label: 'Poor quality', icon: 'thumbs-down-outline' },
  { key: 'unresponsive', label: 'Provider unresponsive', icon: 'chatbox-ellipses-outline' },
];

export default function RaiseDisputeScreen({ navigation, route }) {
  const { orderId, bookingId, orderNumber } = route.params || {};

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Select a Reason', 'Please choose a reason for the dispute.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please describe the issue.');
      return;
    }

    try {
      setSubmitting(true);
      await disputesAPI.raise({
        order_id: orderId || undefined,
        booking_id: bookingId || undefined,
        reason,
        description: description.trim(),
      });
      Alert.alert('Dispute Submitted', 'We will review your dispute and get back to you shortly.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not submit dispute. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View
        className="bg-white px-5 pb-4 flex-row items-center gap-3"
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
          <Ionicons name="chevron-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Raise a Dispute</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {/* Order number */}
        <View className="bg-white rounded-2xl p-4 mb-5" style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text className="text-xs text-gray-400 font-medium">Order Number</Text>
          <Text className="text-sm font-bold text-gray-800 mt-0.5">{orderNumber || 'N/A'}</Text>
        </View>

        {/* Reason picker */}
        <Text className="text-sm font-bold text-gray-800 mb-3">What went wrong?</Text>
        <View className="gap-2.5 mb-6">
          {REASONS.map((item) => {
            const selected = reason === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                className={`flex-row items-center gap-3 p-4 rounded-2xl border-[1.5px] ${
                  selected ? 'border-teal bg-teal/5' : 'border-gray-100 bg-white'
                }`}
                style={selected ? {} : { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}
                onPress={() => setReason(item.key)}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${selected ? 'bg-teal' : 'bg-gray-100'}`}>
                  <Ionicons name={item.icon} size={18} color={selected ? '#fff' : '#6B7280'} />
                </View>
                <Text className={`flex-1 text-sm font-semibold ${selected ? 'text-teal' : 'text-gray-700'}`}>
                  {item.label}
                </Text>
                <View className={`w-5 h-5 rounded-full border-[1.5px] items-center justify-center ${
                  selected ? 'border-teal bg-teal' : 'border-gray-300'
                }`}>
                  {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description */}
        <AppInput
          label="Describe the issue"
          value={description}
          onChangeText={setDescription}
          type="multiline"
          placeholder="Please provide details about the issue..."
          maxLength={500}
        />

        {/* Submit */}
        <TouchableOpacity
          className={`mt-2 py-4 rounded-2xl items-center ${submitting || !reason ? 'bg-teal/50' : 'bg-teal'}`}
          style={{ shadowColor: '#35615D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
          onPress={handleSubmit}
          disabled={submitting || !reason}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-sm font-bold">Submit Dispute</Text>
          )}
        </TouchableOpacity>

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
