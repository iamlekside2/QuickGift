import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function BookingDetail({ route, navigation }) {
  const booking = route.params?.booking || {};
  const [status, setStatus] = useState(booking.status || 'pending');

  const handleAccept = () => {
    setStatus('confirmed');
    Alert.alert('Booking Accepted', 'The client has been notified.');
  };

  const handleDecline = () => {
    Alert.alert('Decline Booking', 'Are you sure you want to decline?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => { setStatus('cancelled'); navigation.goBack(); } },
    ]);
  };

  const handleStart = () => setStatus('in_progress');

  const handleComplete = () => {
    setStatus('completed');
    Alert.alert('Service Completed', 'Great work! The client can now leave a review.');
  };

  const statusColors = {
    pending: { bg: 'bg-orange-light', text: 'text-orange', label: 'Pending' },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Confirmed' },
    in_progress: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'In Progress' },
    completed: { bg: 'bg-green-50', text: 'text-green-600', label: 'Completed' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-500', label: 'Cancelled' },
  };

  const s = statusColors[status] || statusColors.pending;

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        className="px-5 pb-4 bg-white"
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Booking Details</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View className={`self-start px-4 py-1.5 rounded-full mb-5 ${s.bg}`}>
          <Text className={`text-sm font-bold ${s.text}`}>{s.label}</Text>
        </View>

        {/* Client Info */}
        <View
          className="flex-row items-center bg-white rounded-2xl p-4 mb-4"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="w-14 h-14 rounded-full bg-teal-light items-center justify-center">
            <Text className="text-teal font-bold text-xl">
              {(booking.client || 'A').charAt(0)}
            </Text>
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-base font-bold text-gray-800">{booking.client || 'Client Name'}</Text>
            <Text className="text-sm text-gray-400 mt-0.5">+234 806 789 1234</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-teal-light items-center justify-center">
            <Ionicons name="call-outline" size={18} color="#35615D" />
          </TouchableOpacity>
        </View>

        {/* Service Details */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Service Details</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-4 gap-3"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Service</Text>
            <Text className="text-sm font-bold text-gray-800">{booking.service || 'Gel Nails'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Date</Text>
            <Text className="text-sm font-bold text-gray-800">{booking.date || 'Mar 19, 2026'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Time</Text>
            <Text className="text-sm font-bold text-gray-800">{booking.time || '10:00 AM'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Duration</Text>
            <Text className="text-sm font-bold text-gray-800">1.5 hours</Text>
          </View>
          <View className="flex-row justify-between border-t border-gray-100 pt-3">
            <Text className="text-sm font-bold text-gray-800">Total</Text>
            <Text className="text-lg font-extrabold text-teal">{'\u20A6'}{(booking.price || 8000).toLocaleString()}</Text>
          </View>
        </View>

        {/* Location */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Location</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-4 flex-row items-center gap-3"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="w-10 h-10 rounded-full bg-teal-light items-center justify-center">
            <Ionicons name="location-outline" size={18} color="#35615D" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-800">Home Service</Text>
            <Text className="text-xs text-gray-400 mt-0.5">15 Freedom Avenue, Lekki, Lagos</Text>
          </View>
        </View>

        {/* Client Notes */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Client Notes</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-6"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <Text className="text-sm text-gray-600 leading-5">
            I'd like a French tip design with some glitter accents. Please bring nude and white gel colors.
          </Text>
        </View>

        {/* Completed - Rating */}
        {status === 'completed' && (
          <View
            className="bg-white rounded-2xl p-4 mb-6 items-center"
            style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
          >
            <View className="flex-row mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" size={20} color="#FD8950" />
              ))}
            </View>
            <Text className="text-sm font-bold text-green-700 mt-1">Client rated 5.0</Text>
            <Text className="text-xs text-gray-400 mt-1">"Amazing work! Will book again."</Text>
          </View>
        )}

        <View className="h-[120px]" />
      </ScrollView>

      {/* Action Buttons */}
      {status !== 'completed' && status !== 'cancelled' && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pb-8 pt-4"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 4 }}
        >
          {status === 'pending' && (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
                onPress={handleDecline}
              >
                <Text className="text-base font-bold text-gray-600">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-teal py-4 rounded-2xl items-center"
                onPress={handleAccept}
              >
                <Text className="text-base font-bold text-white">Accept</Text>
              </TouchableOpacity>
            </View>
          )}
          {status === 'confirmed' && (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
                onPress={handleDecline}
              >
                <Text className="text-base font-bold text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-teal py-4 rounded-2xl items-center"
                onPress={handleStart}
              >
                <Text className="text-base font-bold text-white">Start Service</Text>
              </TouchableOpacity>
            </View>
          )}
          {status === 'in_progress' && (
            <TouchableOpacity
              className="bg-teal py-4 rounded-2xl items-center"
              onPress={handleComplete}
            >
              <Text className="text-base font-bold text-white">Complete Service</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
