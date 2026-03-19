import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const BUFFER_OPTIONS = ['15 min', '30 min', '1 hr'];

export default function AvailabilityScreen({ navigation }) {
  const [schedule, setSchedule] = useState({
    mon: { active: true, start: '9:00 AM', end: '7:00 PM' },
    tue: { active: true, start: '9:00 AM', end: '7:00 PM' },
    wed: { active: true, start: '9:00 AM', end: '7:00 PM' },
    thu: { active: true, start: '9:00 AM', end: '7:00 PM' },
    fri: { active: true, start: '9:00 AM', end: '7:00 PM' },
    sat: { active: true, start: '10:00 AM', end: '5:00 PM' },
    sun: { active: false, start: '', end: '' },
  });
  const [buffer, setBuffer] = useState('30 min');

  const toggleDay = (key) => {
    setSchedule(prev => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active },
    }));
  };

  const handleSave = () => {
    Alert.alert('Availability Saved', 'Your working hours have been updated.');
    navigation.goBack();
  };

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
          <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Availability</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Working Hours */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Working Hours</Text>
        <View className="gap-2 mb-6">
          {DAYS.map((day) => {
            const daySchedule = schedule[day.key];
            return (
              <View
                key={day.key}
                className="flex-row items-center rounded-2xl p-3.5 bg-white"
                style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, opacity: daySchedule.active ? 1 : 0.7 }}
              >
                <Switch
                  value={daySchedule.active}
                  onValueChange={() => toggleDay(day.key)}
                  trackColor={{ false: '#E5E7EB', true: '#35615D' }}
                  thumbColor="#fff"
                  style={{ transform: [{ scale: 0.8 }] }}
                />
                <Text className={`text-sm font-bold w-24 ml-2 ${
                  daySchedule.active ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {day.label}
                </Text>
                {daySchedule.active ? (
                  <View className="flex-1 flex-row items-center justify-end gap-2">
                    <View className="bg-gray-50 rounded-2xl px-3 py-1.5 border border-gray-100">
                      <Text className="text-xs text-gray-700">{daySchedule.start}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">to</Text>
                    <View className="bg-gray-50 rounded-2xl px-3 py-1.5 border border-gray-100">
                      <Text className="text-xs text-gray-700">{daySchedule.end}</Text>
                    </View>
                  </View>
                ) : (
                  <Text className="flex-1 text-xs text-gray-400 text-right">Closed</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Buffer Time */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Buffer Between Appointments</Text>
        <View className="bg-gray-100 rounded-2xl p-1 flex-row gap-1 mb-6">
          {BUFFER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              className={`flex-1 py-3 rounded-xl items-center ${
                buffer === opt ? 'bg-teal' : ''
              }`}
              style={buffer === opt ? { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}}
              onPress={() => setBuffer(opt)}
            >
              <Text className={`text-sm font-bold ${
                buffer === opt ? 'text-white' : 'text-gray-400'
              }`}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Blocked Dates */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Blocked Dates</Text>
        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl p-4 mb-2 gap-3"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#35615D" />
          <Text className="text-sm text-teal font-bold">Add holiday or time off</Text>
        </TouchableOpacity>
        <View
          className="flex-row items-center bg-white rounded-2xl p-4 mb-6 gap-3"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderLeftWidth: 3, borderLeftColor: '#FD8950' }}
        >
          <Ionicons name="calendar-outline" size={18} color="#FD8950" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-800">Easter Holiday</Text>
            <Text className="text-xs text-gray-400">Apr 18 - Apr 21, 2026</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity
          className="bg-teal py-4 rounded-2xl items-center mb-10"
          onPress={handleSave}
        >
          <Text className="text-base font-bold text-white">Save Availability</Text>
        </TouchableOpacity>

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
