import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATES = [17, 18, 19, 20, 21, 22, 23];

const SCHEDULE = {
  19: [
    { id: '1', client: 'Amina Okafor', service: 'Gel Nails', time: '10:00 - 11:30 AM', status: 'confirmed' },
    { id: '2', client: 'Blessing Eze', service: 'Box Braids', time: '1:30 - 4:00 PM', status: 'confirmed' },
    { id: '3', client: 'Fatima Yusuf', service: 'Makeup', time: '4:30 - 6:00 PM', status: 'pending' },
  ],
  20: [
    { id: '4', client: 'Chioma Adeyemi', service: 'Bridal Makeup', time: '9:00 - 12:00 PM', status: 'confirmed' },
  ],
  21: [
    { id: '5', client: 'Grace Okwu', service: 'Nail Art', time: '11:00 AM - 1:00 PM', status: 'pending' },
  ],
};

export default function ProviderSchedule({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(19);
  const daySchedule = SCHEDULE[selectedDate] || [];

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
          <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>My Schedule</Text>
        </View>
      </View>

      {/* Date Selector */}
      <View className="flex-row px-5 mt-4 mb-6 gap-2">
        {DAYS.map((day, i) => (
          <TouchableOpacity
            key={day}
            className={`flex-1 items-center py-3 rounded-2xl ${
              selectedDate === DATES[i] ? 'bg-teal' : 'bg-white'
            }`}
            style={selectedDate === DATES[i]
              ? { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }
              : { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }
            }
            onPress={() => setSelectedDate(DATES[i])}
          >
            <Text className={`text-[10px] font-bold ${
              selectedDate === DATES[i] ? 'text-white/70' : 'text-gray-400'
            }`}>{day}</Text>
            <Text className={`text-base font-extrabold mt-0.5 ${
              selectedDate === DATES[i] ? 'text-white' : 'text-gray-800'
            }`}>{DATES[i]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Schedule */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {daySchedule.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="sunny-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-gray-800 mt-3">Free day!</Text>
            <Text className="text-sm text-gray-400 mt-1">No appointments scheduled</Text>
          </View>
        ) : (
          daySchedule.map((item) => (
            <View key={item.id} className="flex-row mb-4">
              {/* Time indicator */}
              <View className="items-center mr-4 pt-1">
                <View className={`w-3 h-3 rounded-full ${
                  item.status === 'confirmed' ? 'bg-teal' : 'bg-orange'
                }`} />
                <View className="w-0.5 flex-1 bg-gray-200 mt-1" />
              </View>

              {/* Card */}
              <View
                className="flex-1 bg-white rounded-2xl p-4 mb-1"
                style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              >
                <Text className="text-xs text-gray-400 mb-1">{item.time}</Text>
                <Text className="text-sm font-bold text-gray-800">{item.service}</Text>
                <Text className="text-xs text-gray-400 mt-1">{item.client}</Text>
                <View className="flex-row items-center mt-2">
                  <View className={`px-2.5 py-0.5 rounded-full ${
                    item.status === 'confirmed' ? 'bg-green-50' : 'bg-orange-light'
                  }`}>
                    <Text className={`text-[10px] font-bold ${
                      item.status === 'confirmed' ? 'text-green-600' : 'text-orange'
                    }`}>
                      {item.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
