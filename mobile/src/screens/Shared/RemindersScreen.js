import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const MOCK_REMINDERS = [
  {
    id: '1',
    name: 'Mom\'s Birthday',
    person: 'Funke Adeyemi',
    date: 'April 12, 2026',
    daysLeft: 24,
    type: 'birthday',
    icon: '🎂',
    active: true,
  },
  {
    id: '2',
    name: 'Wedding Anniversary',
    person: 'You & Partner',
    date: 'May 8, 2026',
    daysLeft: 50,
    type: 'anniversary',
    icon: '💍',
    active: true,
  },
  {
    id: '3',
    name: 'Tunde\'s Graduation',
    person: 'Tunde Okafor',
    date: 'June 20, 2026',
    daysLeft: 93,
    type: 'celebration',
    icon: '🎓',
    active: true,
  },
  {
    id: '4',
    name: 'Sister\'s Birthday',
    person: 'Chioma Adeyemi',
    date: 'August 3, 2026',
    daysLeft: 137,
    type: 'birthday',
    icon: '🎁',
    active: false,
  },
];

const OCCASION_PRESETS = [
  { id: '1', label: 'Birthday', icon: '🎂', color: '#FD8950' },
  { id: '2', label: 'Anniversary', icon: '💍', color: '#8B5CF6' },
  { id: '3', label: 'Graduation', icon: '🎓', color: '#3B82F6' },
  { id: '4', label: 'Wedding', icon: '💒', color: '#EF4444' },
  { id: '5', label: 'Holiday', icon: '🎄', color: '#10B981' },
  { id: '6', label: 'Custom', icon: '✨', color: '#F59E0B' },
];

export default function RemindersScreen({ navigation }) {
  const [reminders, setReminders] = useState(MOCK_REMINDERS);

  const toggleReminder = (id) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, active: !r.active } : r
    ));
  };

  const getUrgencyColor = (days) => {
    if (days <= 7) return { bg: 'bg-red-50', text: 'text-red-600', border: '#EF4444' };
    if (days <= 30) return { bg: 'bg-orange-light', text: 'text-orange', border: '#FD8950' };
    return { bg: 'bg-teal-light', text: 'text-teal', border: '#35615D' };
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="bg-white px-5 pb-4"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Reminders</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-2xl bg-teal items-center justify-center"
            style={{
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Add Occasions */}
        <View className="px-5 pt-5 pb-2">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Add</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {OCCASION_PRESETS.map((occ) => (
              <TouchableOpacity
                key={occ.id}
                className="items-center gap-1.5"
                activeOpacity={0.7}
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: occ.color + '15' }}
                >
                  <Text style={{ fontSize: 24 }}>{occ.icon}</Text>
                </View>
                <Text className="text-[10px] text-gray-500 font-semibold">{occ.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming */}
        <View className="px-5 pt-5">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">Upcoming</Text>
          <View className="gap-3">
            {reminders.map((reminder) => {
              const urgency = getUrgencyColor(reminder.daysLeft);
              return (
                <View
                  key={reminder.id}
                  className="bg-white rounded-2xl p-4"
                  style={{
                    shadowColor: '#1F2937',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                    borderLeftWidth: 3,
                    borderLeftColor: reminder.active ? urgency.border : '#E5E7EB',
                    opacity: reminder.active ? 1 : 0.6,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-cream items-center justify-center mr-3.5">
                      <Text style={{ fontSize: 24 }}>{reminder.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-gray-800">{reminder.name}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{reminder.person}</Text>
                      <View className="flex-row items-center gap-2 mt-1.5">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                          <Text className="text-[11px] text-gray-400">{reminder.date}</Text>
                        </View>
                        <View className={`px-2 py-0.5 rounded-full ${urgency.bg}`}>
                          <Text className={`text-[10px] font-bold ${urgency.text}`}>
                            {reminder.daysLeft <= 7 ? `${reminder.daysLeft}d left!` : `${reminder.daysLeft} days`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end gap-2">
                      <Switch
                        value={reminder.active}
                        onValueChange={() => toggleReminder(reminder.id)}
                        trackColor={{ false: '#E5E7EB', true: '#35615D' }}
                        thumbColor="#fff"
                        style={{ transform: [{ scale: 0.75 }] }}
                      />
                      <TouchableOpacity className="px-3 py-1.5 bg-teal-light rounded-lg">
                        <Text className="text-[10px] text-teal font-bold">Send Gift</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tips Card */}
        <View className="mx-5 mt-6 mb-4">
          <View
            className="bg-orange-light rounded-2xl p-4 flex-row items-center gap-3.5"
          >
            <View className="w-10 h-10 rounded-xl bg-orange/10 items-center justify-center">
              <Ionicons name="bulb-outline" size={20} color="#FD8950" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-800">Pro tip</Text>
              <Text className="text-xs text-gray-500 mt-0.5 leading-4">
                Set reminders 3-5 days before the event so your gift arrives on time!
              </Text>
            </View>
          </View>
        </View>

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
