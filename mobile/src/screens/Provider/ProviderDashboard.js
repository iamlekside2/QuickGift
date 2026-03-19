import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ProviderDashboard({ navigation }) {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] || 'Provider';

  const stats = {
    todayBookings: 3,
    pendingRequests: 5,
    totalEarnings: 87500,
    rating: 4.8,
    completedJobs: 42,
    thisMonthEarnings: 32000,
  };

  const upcomingBookings = [
    { id: '1', client: 'Amina Okafor', service: 'Gel Nails', time: '10:00 AM', date: 'Today', status: 'confirmed' },
    { id: '2', client: 'Blessing Eze', service: 'Hair Braiding', time: '1:30 PM', date: 'Today', status: 'confirmed' },
    { id: '3', client: 'Fatima Yusuf', service: 'Makeup', time: '4:00 PM', date: 'Today', status: 'pending' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="px-5 pb-5 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-extrabold text-gray-800">Hi {firstName}</Text>
            <Text className="text-sm text-gray-400 mt-0.5">Here's your business overview</Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.navigate('ProviderNotifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#1F2937" />
            <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Earnings Card */}
        <View
          className="mx-5 mt-4 bg-teal rounded-3xl p-6 overflow-hidden"
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.6)" />
            <Text className="text-white/60 text-sm font-medium">This Month's Earnings</Text>
          </View>
          <Text className="text-white text-[34px] font-extrabold tracking-tight">
            ₦{stats.thisMonthEarnings.toLocaleString()}
          </Text>
          <View className="flex-row mt-5 gap-6">
            <View>
              <Text className="text-white/50 text-[10px] font-medium">Total Earnings</Text>
              <Text className="text-white text-base font-bold">₦{stats.totalEarnings.toLocaleString()}</Text>
            </View>
            <View>
              <Text className="text-white/50 text-[10px] font-medium">Completed</Text>
              <Text className="text-white text-base font-bold">{stats.completedJobs} jobs</Text>
            </View>
            <View>
              <Text className="text-white/50 text-[10px] font-medium">Rating</Text>
              <Text className="text-white text-base font-bold">{stats.rating}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row px-5 mt-5 gap-3">
          {[
            { value: stats.pendingRequests, label: 'Pending', color: '#FD8950', bg: 'bg-orange-light' },
            { value: stats.todayBookings, label: 'Today', color: '#35615D', bg: 'bg-teal-light' },
            { value: stats.completedJobs, label: 'Done', color: '#10B981', bg: 'bg-green-50' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              className={`flex-1 ${item.bg} rounded-2xl py-4 items-center`}
              style={{
                shadowColor: item.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text className="text-[26px] font-extrabold" style={{ color: item.color }}>{item.value}</Text>
              <Text className="text-[11px] text-gray-500 mt-0.5 font-medium">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="px-5 mt-6">
          <Text className="text-[17px] font-bold text-gray-800 mb-3">Quick Actions</Text>
          <View className="flex-row gap-3 mb-3">
            {[
              { icon: 'calendar-outline', label: 'Schedule', screen: 'ProviderSchedule' },
              { icon: 'pricetag-outline', label: 'Services', screen: 'ProviderServices' },
              { icon: 'cube-outline', label: 'Products', screen: 'ProviderProducts' },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                className="flex-1 bg-white rounded-2xl py-4 items-center gap-2"
                style={{
                  shadowColor: '#1F2937',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View className="w-10 h-10 rounded-xl bg-teal-light items-center justify-center">
                  <Ionicons name={action.icon} size={20} color="#35615D" />
                </View>
                <Text className="text-[11px] font-semibold text-gray-600">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            {[
              { icon: 'star-outline', label: 'Reviews', screen: 'ProviderReviews' },
              { icon: 'time-outline', label: 'Availability', screen: 'AvailabilityScreen' },
              { icon: 'briefcase-outline', label: 'Business', screen: 'BusinessProfile' },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                className="flex-1 bg-white rounded-2xl py-4 items-center gap-2"
                style={{
                  shadowColor: '#1F2937',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View className="w-10 h-10 rounded-xl bg-teal-light items-center justify-center">
                  <Ionicons name={action.icon} size={20} color="#35615D" />
                </View>
                <Text className="text-[11px] font-semibold text-gray-600">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Bookings */}
        <View className="px-5 mt-6 mb-3">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[17px] font-bold text-gray-800">Upcoming Bookings</Text>
            <TouchableOpacity
              className="flex-row items-center gap-0.5"
              onPress={() => navigation.getParent()?.navigate('Bookings')}
            >
              <Text className="text-[13px] text-teal font-semibold">See All</Text>
              <Ionicons name="chevron-forward" size={14} color="#35615D" />
            </TouchableOpacity>
          </View>

          {upcomingBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              className="flex-row items-center bg-white rounded-2xl p-4 mb-3 gap-3"
              style={{
                shadowColor: '#1F2937',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
              onPress={() => navigation.navigate('BookingDetail', { booking })}
            >
              <View className="w-12 h-12 rounded-2xl bg-teal-light items-center justify-center">
                <Text className="text-teal font-extrabold text-lg">
                  {booking.client.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-gray-800">{booking.client}</Text>
                <Text className="text-xs text-gray-400">{booking.service}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-bold text-gray-800">{booking.time}</Text>
                <View className={`mt-1 px-2 py-0.5 rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-50' : 'bg-orange-light'
                }`}>
                  <Text className={`text-[10px] font-bold ${
                    booking.status === 'confirmed' ? 'text-green-600' : 'text-orange'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
