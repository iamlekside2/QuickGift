import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsAPI } from '../../services/api';

const ICON_MAP = {
  booking: { name: 'calendar', bg: 'bg-teal-light', color: '#35615D' },
  payment: { name: 'wallet', bg: 'bg-green-50', color: '#10B981' },
  confirmed: { name: 'checkmark-circle', bg: 'bg-blue-50', color: '#3B82F6' },
  review: { name: 'star', bg: 'bg-orange-light', color: '#FD8950' },
  system: { name: 'information-circle', bg: 'bg-purple-50', color: '#8B5CF6' },
};

export default function ProviderNotifications({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list();
      const items = (res.data || []).map((n) => ({
        ...n,
        unread: !n.is_read,
      }));
      setNotifications(items);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false, is_read: true })));
    } catch (err) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

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
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
            >
              <Text className="text-sm text-teal font-bold">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#35615D" />
          </View>
        ) : notifications.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-gray-800 mt-3">No notifications yet</Text>
            <Text className="text-sm text-gray-400 mt-1">You'll be notified about bookings and updates</Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const icon = ICON_MAP[notif.type] || ICON_MAP.system;
            return (
              <TouchableOpacity
                key={notif.id || notif._id}
                className="flex-row p-4 rounded-2xl mb-3 bg-white"
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
                    <Text className="text-sm font-bold text-gray-800">
                      {notif.title}
                    </Text>
                    {notif.unread && <View className="w-2 h-2 rounded-full bg-orange" />}
                  </View>
                  <Text className="text-xs text-gray-400 mt-1 leading-4">{notif.desc || notif.description || ''}</Text>
                  <Text className="text-[10px] text-gray-400 mt-1.5">{notif.time || notif.created_at || ''}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
