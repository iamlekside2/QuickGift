import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { bookingsAPI } from '../../services/api';

const TABS = ['Upcoming', 'Pending', 'Completed'];

export default function ProviderBookings({ navigation }) {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const fetchBookings = async () => {
        try {
          setLoading(true);
          const res = await bookingsAPI.list();
          if (!cancelled) {
            const data = res.data || res;
            setAllBookings(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.log('Failed to fetch bookings:', err);
          if (!cancelled) setAllBookings([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchBookings();
      return () => { cancelled = true; };
    }, [])
  );

  const bookings = allBookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    if (activeTab === 'Upcoming') return status === 'confirmed' || status === 'upcoming';
    if (activeTab === 'Pending') return status === 'pending';
    if (activeTab === 'Completed') return status === 'completed';
    return false;
  });

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        className="px-5 pb-4 bg-white"
      >
        <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Bookings</Text>
      </View>

      {/* Tabs - Segmented Control */}
      <View className="px-5 mt-4 mb-4">
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                activeTab === tab ? 'bg-teal' : ''
              }`}
              style={activeTab === tab ? { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={`text-sm font-bold ${
                activeTab === tab ? 'text-white' : 'text-gray-400'
              }`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bookings List */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center mt-16">
            <ActivityIndicator size="large" color="#35615D" />
            <Text className="text-sm text-gray-400 mt-3">Loading bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-gray-800 mt-3">No {activeTab.toLowerCase()} bookings</Text>
            <Text className="text-sm text-gray-400 mt-1">You're all caught up!</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              className="bg-white rounded-2xl p-4 mb-3"
              style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              onPress={() => navigation.navigate('BookingDetail', { booking })}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-teal-light items-center justify-center">
                    <Text className="text-teal font-bold">{(booking.client || '?').charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-gray-800">{booking.client}</Text>
                    <Text className="text-xs text-gray-400">{booking.service}</Text>
                  </View>
                </View>
                <Text className="text-sm font-extrabold text-teal">{'\u20A6'}{(booking.price || 0).toLocaleString()}</Text>
              </View>

              <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                  <Text className="text-xs text-gray-400">{booking.date}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                  <Text className="text-xs text-gray-400">{booking.time}</Text>
                </View>
                {activeTab === 'Pending' && (
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="bg-teal px-3 py-1.5 rounded-2xl">
                      <Text className="text-xs text-white font-bold">Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-gray-200 px-3 py-1.5 rounded-2xl">
                      <Text className="text-xs text-gray-600 font-bold">Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
