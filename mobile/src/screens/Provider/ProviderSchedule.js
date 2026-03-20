import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { bookingsAPI } from '../../services/api';

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days = [];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      label: labels[i],
      date: d.getDate(),
      fullDate: d.toISOString().split('T')[0],
      isToday: d.toDateString() === today.toDateString(),
    });
  }
  return days;
}

export default function ProviderSchedule({ navigation }) {
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayEntry = weekDates.find((d) => d.isToday) || weekDates[0];
  const [selectedDate, setSelectedDate] = useState(todayEntry.fullDate);
  const [daySchedule, setDaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingsAPI.list({ date: selectedDate });
      const data = res.data?.bookings || res.data || [];
      setDaySchedule(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Error fetching schedule:', e);
      setDaySchedule([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchSchedule();
    }, [fetchSchedule])
  );

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
        {weekDates.map((day) => (
          <TouchableOpacity
            key={day.fullDate}
            className={`flex-1 items-center py-3 rounded-2xl ${
              selectedDate === day.fullDate ? 'bg-teal' : 'bg-white'
            }`}
            style={selectedDate === day.fullDate
              ? { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }
              : { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }
            }
            onPress={() => setSelectedDate(day.fullDate)}
          >
            <Text className={`text-[10px] font-bold ${
              selectedDate === day.fullDate ? 'text-white/70' : 'text-gray-400'
            }`}>{day.label}</Text>
            <Text className={`text-base font-extrabold mt-0.5 ${
              selectedDate === day.fullDate ? 'text-white' : 'text-gray-800'
            }`}>{day.date}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Schedule */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#35615D" />
          </View>
        ) : daySchedule.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="sunny-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-gray-800 mt-3">Free day!</Text>
            <Text className="text-sm text-gray-400 mt-1">No appointments scheduled</Text>
          </View>
        ) : (
          daySchedule.map((item) => {
            const clientName = item.client_name || item.client || 'Client';
            const serviceName = item.service_name || item.service || 'Service';
            const timeStr = item.time || item.booking_time || '';
            return (
              <View key={item.id || item._id} className="flex-row mb-4">
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
                  <Text className="text-xs text-gray-400 mb-1">{timeStr}</Text>
                  <Text className="text-sm font-bold text-gray-800">{serviceName}</Text>
                  <Text className="text-xs text-gray-400 mt-1">{clientName}</Text>
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
            );
          })
        )}
        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
