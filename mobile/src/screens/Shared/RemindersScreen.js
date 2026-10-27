import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';


const OCCASION_PRESETS = [
  { id: '1', label: 'Birthday', icon: 'balloon-outline', color: '#E8632F' },
  { id: '2', label: 'Anniversary', icon: 'heart-outline', color: '#7A5FA8' },
  { id: '3', label: 'Graduation', icon: 'school-outline', color: '#4C7CB0' },
  { id: '4', label: 'Wedding', icon: 'diamond-outline', color: '#D24B4B' },
  { id: '5', label: 'Holiday', icon: 'snow-outline', color: '#3E8E63' },
  { id: '6', label: 'Custom', icon: 'sparkles-outline', color: '#B8862E' },
];

export default function RemindersScreen({ navigation }) {
  const [reminders, setReminders] = useState([]);

  const toggleReminder = (id) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, active: !r.active } : r
    ));
  };

  const getUrgencyColor = (days) => {
    if (days <= 7) return { bg: 'bg-red-50', text: 'text-red-600', border: '#D24B4B' };
    if (days <= 30) return { bg: 'bg-orange-light', text: 'text-orange', border: '#E8632F' };
    return { bg: 'bg-teal-light', text: 'text-teal', border: '#1F4A45' };
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="bg-white px-5 pb-4"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#211F1C',
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
              <Ionicons name="arrow-back" size={20} color="#211F1C" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Reminders</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-2xl bg-teal items-center justify-center"
            style={{
              shadowColor: '#1F4A45',
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
                  style={{ backgroundColor: occ.color + '18' }}
                >
                  <Ionicons name={occ.icon} size={24} color={occ.color} />
                </View>
                <Text className="text-[10px] text-gray-500 font-semibold">{occ.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming */}
        <View className="px-5 pt-5">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">Upcoming</Text>
          {reminders.length === 0 ? (
            <View className="items-center mt-10 px-8 mb-6">
              <View className="w-24 h-24 rounded-full bg-orange-light items-center justify-center mb-5">
                <Ionicons name="notifications-outline" size={40} color="#E8632F" />
              </View>
              <Text className="text-lg font-bold text-gray-800 mb-2">No reminders yet</Text>
              <Text className="text-sm text-gray-400 text-center leading-5">
                Set reminders for special occasions
              </Text>
            </View>
          ) : (
          <View className="gap-3">
            {reminders.map((reminder) => {
              const urgency = getUrgencyColor(reminder.daysLeft);
              return (
                <View
                  key={reminder.id}
                  className="bg-white rounded-2xl p-4"
                  style={{
                    shadowColor: '#211F1C',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                    borderLeftWidth: 3,
                    borderLeftColor: reminder.active ? urgency.border : '#EAE3D8',
                    opacity: reminder.active ? 1 : 0.6,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-cream items-center justify-center mr-3.5">
                      <Ionicons name={reminder.icon || 'notifications-outline'} size={22} color="#1F4A45" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-gray-800">{reminder.name}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{reminder.person}</Text>
                      <View className="flex-row items-center gap-2 mt-1.5">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="calendar-outline" size={12} color="#9A948A" />
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
                        trackColor={{ false: '#EAE3D8', true: '#1F4A45' }}
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
          )}
        </View>

        {/* Tips Card */}
        <View className="mx-5 mt-6 mb-4">
          <View
            className="bg-orange-light rounded-2xl p-4 flex-row items-center gap-3.5"
          >
            <View className="w-10 h-10 rounded-xl bg-orange/10 items-center justify-center">
              <Ionicons name="bulb-outline" size={20} color="#E8632F" />
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
