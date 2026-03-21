import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, bookingsAPI } from '../../services/api';

const TABS = ['All', 'Gifts', 'Beauty'];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: 'bg-amber-50', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', bg: 'bg-blue-50', icon: 'checkmark-circle-outline' },
  in_transit: { label: 'In Transit', color: '#8B5CF6', bg: 'bg-purple-50', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', color: '#10B981', bg: 'bg-green-50', icon: 'checkmark-done-outline' },
  completed: { label: 'Completed', color: '#10B981', bg: 'bg-green-50', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'bg-red-50', icon: 'close-circle-outline' },
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
        <Text className="text-2xl font-extrabold text-gray-800 mb-4">My Orders</Text>
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                activeTab === tab ? 'bg-teal' : ''
              }`}
              style={activeTab === tab ? {
                shadowColor: '#35615D',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              } : {}}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={`text-sm font-semibold ${
                activeTab === tab ? 'text-white' : 'text-gray-500'
              }`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} tintColor="#35615D" />}
      >
        {loading ? (
          <View className="items-center mt-20">
            <ActivityIndicator size="large" color="#35615D" />
            <Text className="text-sm text-gray-400 mt-3">Loading orders...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center mt-20">
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Text style={{ fontSize: 36 }}>📦</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800">No orders yet</Text>
            <Text className="text-sm text-gray-500 mt-1.5 text-center px-8">
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
                  shadowColor: '#1F2937',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* Top row */}
                <View className="flex-row items-start gap-3 mb-3">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: isGift ? '#E8F0EF' : '#FEF0E8' }}
                  >
                    <Text style={{ fontSize: 24 }}>{isGift ? '🎁' : '💅'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-gray-800">{name}</Text>
                    {recipient ? (
                      <Text className="text-xs text-gray-400 mt-0.5">
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

                {/* Leave Review for delivered gift orders */}
                {status === 'delivered' && isGift && (
                  <TouchableOpacity
                    className="mt-2 bg-teal/10 py-2 px-3 rounded-xl self-start"
                    onPress={() => navigation.navigate('Home', {
                      screen: 'WriteReview',
                      params: {
                        targetType: 'product',
                        targetId: item.product_id || item.id,
                        targetName: name,
                      },
                    })}
                  >
                    <Text className="text-xs font-bold text-teal">Leave Review</Text>
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
