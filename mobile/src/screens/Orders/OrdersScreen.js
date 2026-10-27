import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, bookingsAPI } from '../../services/api';

const TABS = ['All', 'Gifts', 'Beauty'];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#B8862E', bg: 'bg-amber-50', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: '#4C7CB0', bg: 'bg-blue-50', icon: 'checkmark-circle-outline' },
  in_transit: { label: 'In Transit', color: '#7A5FA8', bg: 'bg-purple-50', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', color: '#3E8E63', bg: 'bg-green-50', icon: 'checkmark-done-outline' },
  completed: { label: 'Completed', color: '#3E8E63', bg: 'bg-green-50', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', color: '#D24B4B', bg: 'bg-red-50', icon: 'close-circle-outline' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TRACKING_STEPS = ['Confirmed', 'In Transit', 'Delivered'];

function getTrackingIndex(status) {
  if (status === 'confirmed') return 0;
  if (status === 'in_transit') return 1;
  if (status === 'delivered' || status === 'completed') return 2;
  return -1;
}

export default function OrdersScreen() {
  const navigation = useNavigation();
  const { isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest) loadOrders();
    else setLoading(false);
  }, []);

  const loadOrders = async () => {
    try {
      const [ordersRes, bookingsRes] = await Promise.allSettled([
        ordersAPI.list(),
        bookingsAPI.list(),
      ]);
      if (ordersRes.status === 'fulfilled') {
        const items = ordersRes.value.data?.items || ordersRes.value.data || [];
        setOrders(items.map(o => ({ ...o, type: 'gift' })));
      }
      if (bookingsRes.status === 'fulfilled') {
        const items = bookingsRes.value.data?.items || bookingsRes.value.data || [];
        setBookings(items.map(b => ({ ...b, type: 'beauty' })));
      }
    } catch (err) {
      console.log('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (item) => {
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            if (ordersAPI.cancel) {
              await ordersAPI.cancel(item.id);
              loadOrders();
            } else {
              Alert.alert('Contact Support', 'Please contact support to cancel this order.');
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to cancel order. Please contact support.');
          }
        },
      },
    ]);
  };

  const allItems = useMemo(() => [...orders, ...bookings].sort((a, b) =>
    new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0)
  ), [orders, bookings]);

  const filtered = useMemo(() => activeTab === 'All' ? allItems
    : activeTab === 'Gifts' ? allItems.filter(i => i.type === 'gift')
    : allItems.filter(i => i.type === 'beauty'), [allItems, activeTab]);

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="light" />
      {/* Teal header */}
      <ScreenHeader variant="root" title="My Orders" pb={4}>
        {/* Underline tabs — active = white text + terracotta underline */}
        <View className="flex-row gap-6 mt-4">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity key={tab} className="pb-3" onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
                <Text className={`text-[14px] font-bold ${active ? 'text-white' : 'text-white/55'}`}>{tab}</Text>
                {active && (
                  <View style={{ height: 2, borderRadius: 2, backgroundColor: '#E8632F', marginTop: 6 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScreenHeader>

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} tintColor="#1F4A45" />}
      >
        {loading ? (
          <View className="items-center mt-20">
            <ActivityIndicator size="large" color="#1F4A45" />
            <Text className="text-sm text-gray-400 mt-3">Loading orders...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center mt-20">
            <View className="w-20 h-20 rounded-full bg-sand items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={34} color="#9A948A" />
            </View>
            <Text className="text-lg font-bold text-ink">No orders yet</Text>
            <Text className="text-sm text-ink-soft mt-1.5 text-center px-8">
              Start shopping to see your orders here
            </Text>
          </View>
        ) : (
          filtered.map((item) => {
            const status = item.status || 'pending';
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            const trackIdx = getTrackingIndex(status);
            const isGift = item.type === 'gift';
            const name = item.product_name || item.service_name || item.name || (isGift ? 'Gift Order' : 'Beauty Booking');
            const recipient = item.recipient_name || item.provider_name || '';
            const price = item.total || item.price || 0;
            const date = item.date || item.created_at || '';

            return (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-3xl p-4.5 mb-3.5"
                style={{
                  padding: 18,
                  shadowColor: '#211F1C',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
                activeOpacity={0.85}
                onPress={isGift ? () => navigation.navigate('OrderTracking', { order: item }) : undefined}
              >
                {/* Top row */}
                <View className="flex-row items-start gap-3 mb-3">
                  <View
                    className="w-12 h-12 rounded-[14px] items-center justify-center"
                    style={{ backgroundColor: isGift ? '#E7EFEC' : '#FBE4D7' }}
                  >
                    <Ionicons name={isGift ? 'gift-outline' : 'sparkles-outline'} size={22} color={isGift ? '#1F4A45' : '#E8632F'} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-ink">{name}</Text>
                    {recipient ? (
                      <Text className="text-xs text-ink-caption mt-0.5">
                        {isGift ? 'To' : 'With'} {recipient}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-[15px] font-extrabold text-teal">₦{price.toLocaleString()}</Text>
                </View>

                {/* Tracking progress */}
                {isGift && trackIdx >= 0 && (
                  <View className="flex-row items-center mb-3.5 px-1">
                    {TRACKING_STEPS.map((step, i) => (
                      <React.Fragment key={step}>
                        <View className="items-center">
                          <View className={`w-7 h-7 rounded-full items-center justify-center ${
                            i <= trackIdx ? 'bg-teal' : 'bg-gray-100'
                          }`}>
                            {i <= trackIdx ? (
                              <Ionicons name="checkmark" size={14} color="#fff" />
                            ) : (
                              <View className="w-2 h-2 rounded-full bg-gray-300" />
                            )}
                          </View>
                          <Text className={`text-[9px] mt-1 font-medium ${
                            i <= trackIdx ? 'text-teal' : 'text-gray-400'
                          }`}>{step}</Text>
                        </View>
                        {i < TRACKING_STEPS.length - 1 && (
                          <View className={`flex-1 h-[2px] mx-1.5 rounded-full ${
                            i < trackIdx ? 'bg-teal' : 'bg-gray-100'
                          }`} />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                )}

                {/* Bottom row */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-50">
                  <Text className="text-[11px] text-gray-400">{formatDate(date)}</Text>
                  <View
                    className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${config.bg}`}
                  >
                    <Ionicons name={config.icon} size={12} color={config.color} />
                    <Text style={{ color: config.color }} className="text-[11px] font-bold">
                      {config.label}
                    </Text>
                  </View>
                </View>

                {/* Cancel button for pending/confirmed orders */}
                {(status === 'pending' || status === 'confirmed') && (
                  <TouchableOpacity
                    className="mt-3 py-2.5 rounded-xl border border-red-200 bg-red-50 items-center"
                    onPress={() => handleCancelOrder(item)}
                  >
                    <Text className="text-xs font-bold text-red-500">Cancel Order</Text>
                  </TouchableOpacity>
                )}

                {/* Leave Review for delivered/completed orders */}
                {(status === 'delivered' || status === 'completed') && (
                  <TouchableOpacity
                    className="mt-2 bg-teal/10 py-2 px-3 rounded-xl self-start flex-row items-center gap-1"
                    onPress={() => navigation.navigate('WriteReview', {
                      targetType: isGift ? 'product' : 'provider',
                      targetId: isGift ? (item.product_id || item.id) : (item.provider_id || item.id),
                      targetName: name,
                      orderId: isGift ? item.id : undefined,
                      bookingId: !isGift ? item.id : undefined,
                    })}
                  >
                    <Ionicons name="star-outline" size={14} color="#1F4A45" />
                    <Text className="text-xs font-bold text-teal">Leave Review</Text>
                  </TouchableOpacity>
                )}

                {/* Report Issue for delivered/completed orders */}
                {(status === 'delivered' || status === 'completed') && (
                  <TouchableOpacity
                    className="mt-1 py-2 px-3 rounded-xl self-start flex-row items-center gap-1"
                    onPress={() => navigation.navigate('RaiseDispute', {
                      orderId: isGift ? item.id : undefined, bookingId: !isGift ? item.id : undefined, orderNumber: item.order_number || item.booking_number,
                    })}
                  >
                    <Ionicons name="flag-outline" size={14} color="#D24B4B" />
                    <Text className="text-xs font-bold text-red-500">Report Issue</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
