import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const TABS = ['Upcoming', 'Pending', 'Completed'];

const MOCK_BOOKINGS = {
  Upcoming: [
    { id: '1', client: 'Amina Okafor', service: 'Gel Nails - Full Set', time: '10:00 AM', date: 'Today, Mar 19', price: 8000, status: 'confirmed' },
    { id: '2', client: 'Blessing Eze', service: 'Box Braids', time: '1:30 PM', date: 'Today, Mar 19', price: 15000, status: 'confirmed' },
    { id: '3', client: 'Chioma Adeyemi', service: 'Bridal Makeup', time: '9:00 AM', date: 'Tomorrow, Mar 20', price: 25000, status: 'confirmed' },
  ],
  Pending: [
    { id: '4', client: 'Fatima Yusuf', service: 'Makeup Session', time: '4:00 PM', date: 'Mar 21', price: 12000, status: 'pending' },
    { id: '5', client: 'Grace Okwu', service: 'Nail Art', time: '11:00 AM', date: 'Mar 22', price: 6000, status: 'pending' },
  ],
  Completed: [
    { id: '6', client: 'Hannah Bello', service: 'Hair Treatment', time: '2:00 PM', date: 'Mar 17', price: 10000, status: 'completed' },
    { id: '7', client: 'Ifeoma Nwankwo', service: 'Gel Nails', time: '10:00 AM', date: 'Mar 16', price: 8000, status: 'completed' },
  ],
};

export default function ProviderBookings({ navigation }) {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const bookings = MOCK_BOOKINGS[activeTab] || [];

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
        {bookings.length === 0 ? (
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
                    <Text className="text-teal font-bold">{booking.client.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-gray-800">{booking.client}</Text>
                    <Text className="text-xs text-gray-400">{booking.service}</Text>
                  </View>
                </View>
                <Text className="text-sm font-extrabold text-teal">{'\u20A6'}{booking.price.toLocaleString()}</Text>
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
