import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const NOTIFICATIONS = [
  { id: '1', type: 'booking', title: 'New Booking Request', desc: 'Fatima Yusuf wants to book Makeup Session on Mar 21', time: '2 min ago', unread: true },
  { id: '2', type: 'payment', title: 'Payment Received', desc: '₦8,000 for Gel Nails from Amina Okafor', time: '1 hr ago', unread: true },
  { id: '3', type: 'confirmed', title: 'Booking Confirmed', desc: 'Chioma Adeyemi confirmed Bridal Makeup for Mar 20', time: '3 hrs ago', unread: false },
  { id: '4', type: 'review', title: 'New Review', desc: 'Blessing Eze left a 5-star review for Box Braids', time: '5 hrs ago', unread: false },
  { id: '5', type: 'system', title: 'Profile Verified', desc: 'Congratulations! Your business profile has been verified.', time: 'Yesterday', unread: false },
  { id: '6', type: 'booking', title: 'New Booking Request', desc: 'Grace Okwu wants to book Nail Art on Mar 22', time: 'Yesterday', unread: false },
  { id: '7', type: 'payment', title: 'Withdrawal Successful', desc: '₦20,000 sent to your GTBank account', time: '2 days ago', unread: false },
];

const ICON_MAP = {
  booking: { name: 'calendar', bg: 'bg-teal-light', color: '#35615D' },
  payment: { name: 'wallet', bg: 'bg-green-50', color: '#10B981' },
  confirmed: { name: 'checkmark-circle', bg: 'bg-blue-50', color: '#3B82F6' },
  review: { name: 'star', bg: 'bg-orange-light', color: '#FD8950' },
  system: { name: 'information-circle', bg: 'bg-purple-50', color: '#8B5CF6' },
};

export default function ProviderNotifications({ navigation }) {
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        className="px-5 pb-4 bg-white"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Notifications</Text>
          </View>
          <TouchableOpacity>
            <Text className="text-sm text-teal font-bold">Mark all read</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {NOTIFICATIONS.map((notif) => {
          const icon = ICON_MAP[notif.type] || ICON_MAP.system;
          return (
            <TouchableOpacity
              key={notif.id}
              className={`flex-row p-4 rounded-2xl mb-3 ${notif.unread ? 'bg-white' : 'bg-white'}`}
              style={{
                shadowColor: '#1F2937',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: notif.unread ? 0.06 : 0.04,
                shadowRadius: 8,
                elevation: notif.unread ? 3 : 2,
                borderLeftWidth: notif.unread ? 3 : 0,
                borderLeftColor: notif.unread ? '#35615D' : 'transparent',
              }}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center ${icon.bg}`}>
                <Ionicons name={icon.name} size={18} color={icon.color} />
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center justify-between">
                  <Text className={`text-sm ${notif.unread ? 'font-bold' : 'font-bold'} text-gray-800`}>
                    {notif.title}
                  </Text>
                  {notif.unread && <View className="w-2 h-2 rounded-full bg-orange" />}
                </View>
                <Text className="text-xs text-gray-400 mt-1 leading-4">{notif.desc}</Text>
                <Text className="text-[10px] text-gray-400 mt-1.5">{notif.time}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
