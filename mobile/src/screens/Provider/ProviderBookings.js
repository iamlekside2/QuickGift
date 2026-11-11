import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { useFocusEffect } from '@react-navigation/native';
import { bookingsAPI } from '../../services/api';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/ScreenStates';
import { apiError } from '../../utils/errors';

const TABS = ['Upcoming', 'Pending', 'Completed'];

// Which booking statuses each tab shows.
const TAB_STATUSES = {
  Upcoming: ['accepted', 'confirmed', 'in_progress'],
  Pending: ['pending'],
  Completed: ['completed'],
};

const STATUS_LABEL = {
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
};

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Paid / Awaiting payment (a provider should not start work on an unpaid booking).
const paymentBadge = (paymentStatus) => {
  if (paymentStatus === 'paid') return { label: 'Paid', bg: 'bg-green-50', color: '#3E8E63' };
  if (paymentStatus === 'refunded') return { label: 'Refunded', bg: 'bg-gray-100', color: '#6E6A63' };
  return { label: 'Awaiting payment', bg: 'bg-amber-50', color: '#B8862E' };
};

export default function ProviderBookings({ navigation }) {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const loadedOnce = useRef(false);

  const fetchBookings = useCallback(async () => {
    try {
      if (!loadedOnce.current) setLoading(true);
      const res = await bookingsAPI.list();
      const data = res.data?.items || res.data?.bookings || res.data || [];
      setAllBookings(Array.isArray(data) ? data : []);
      setLoadError('');
    } catch (err) {
      setLoadError(apiError(err, 'We could not load your bookings.'));
    } finally {
      loadedOnce.current = true;
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId);
      await bookingsAPI.updateStatus(bookingId, newStatus);
      await fetchBookings();
    } catch (err) {
      // For example: "This booking has not been paid for yet. It can be
      // confirmed once the customer pays."
      Alert.alert('Booking not updated', apiError(err, 'We could not update this booking. Please try again.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const bookings = allBookings.filter((b) =>
    TAB_STATUSES[activeTab].includes((b.status || '').toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
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
              style={activeTab === tab ? { shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}}
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
          <LoadingState message="Loading bookings..." />
        ) : loadError && allBookings.length === 0 ? (
          <ErrorState message={loadError} onRetry={() => { loadedOnce.current = false; fetchBookings(); }} />
        ) : bookings.length === 0 ? (
          <EmptyState icon="calendar-outline" title={`No ${activeTab.toLowerCase()} bookings`} subtitle="You're all caught up!" />
        ) : (
          bookings.map((booking) => {
            const clientName = booking.client_name || 'Client';
            const pay = paymentBadge(booking.payment_status);
            const status = (booking.status || '').toLowerCase();
            const updating = updatingId === booking.id;
            return (
              <TouchableOpacity
                key={booking.id}
                className="bg-white rounded-2xl p-4 mb-3"
                style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                onPress={() => navigation.navigate('BookingDetail', { booking })}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <View className="w-10 h-10 rounded-full bg-teal-light items-center justify-center">
                      <Text className="text-teal font-bold">{clientName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{clientName}</Text>
                      <Text className="text-xs text-gray-400" numberOfLines={1}>{booking.service_name || 'Service'}</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-extrabold text-teal">{'₦'}{(Number(booking.price) || 0).toLocaleString()}</Text>
                </View>

                {/* Payment + stage */}
                <View className="flex-row items-center gap-2 mb-1">
                  <View className={`px-2.5 py-1 rounded-full ${pay.bg}`}>
                    <Text className="text-[10px] font-bold" style={{ color: pay.color }}>{pay.label}</Text>
                  </View>
                  {STATUS_LABEL[status] ? (
                    <View className="px-2.5 py-1 rounded-full bg-blue-50">
                      <Text className="text-[10px] font-bold" style={{ color: '#4C7CB0' }}>{STATUS_LABEL[status]}</Text>
                    </View>
                  ) : null}
                </View>

                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar-outline" size={14} color="#9A948A" />
                    <Text className="text-xs text-gray-400">{formatDate(booking.booking_date)}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={14} color="#9A948A" />
                    <Text className="text-xs text-gray-400">{booking.booking_time || ''}</Text>
                  </View>
                  {activeTab === 'Pending' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="bg-teal px-3 py-1.5 rounded-2xl"
                        disabled={updating}
                        // A paid booking is confirmed outright; an unpaid one is only
                        // "accepted" (the server will not confirm work nobody paid for).
                        onPress={() =>
                          handleUpdateStatus(
                            booking.id,
                            booking.payment_status === 'paid' ? 'confirmed' : 'accepted',
                          )
                        }
                      >
                        {updating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text className="text-xs text-white font-bold">Accept</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-gray-200 px-3 py-1.5 rounded-2xl"
                        disabled={updating}
                        onPress={() => handleUpdateStatus(booking.id, 'declined')}
                      >
                        {updating ? (
                          <ActivityIndicator size="small" color="#6E6A63" />
                        ) : (
                          <Text className="text-xs text-gray-600 font-bold">Decline</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
