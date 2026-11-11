import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { useFocusEffect } from '@react-navigation/native';
import { ordersAPI } from '../../services/api';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#B8862E', bg: 'bg-amber-50' },
  confirmed: { label: 'Confirmed', color: '#4C7CB0', bg: 'bg-blue-50' },
  in_transit: { label: 'In Transit', color: '#7A5FA8', bg: 'bg-purple-50' },
  delivered: { label: 'Delivered', color: '#3E8E63', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', color: '#D24B4B', bg: 'bg-red-50' },
};

// A delivery day is a plain calendar day: read it straight from the string so
// the phone's time zone cannot move it.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDeliveryDay = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ProviderOrdersScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = activeFilter !== 'all' ? { status: activeFilter } : {};
      const res = await ordersAPI.vendorOrders(params);
      const items = res.data?.items || res.data || [];
      setOrders(Array.isArray(items) ? items : []);
    } catch (err) {
      console.log('Error loading vendor orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const handleUpdateStatus = async (orderId, newStatus) => {
    const label = newStatus === 'in_transit' ? 'shipped' : 'delivered';
    Alert.alert(
      `Mark as ${label}?`,
      `Are you sure you want to mark this order as ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setActionLoading(orderId);
              await ordersAPI.providerUpdateStatus(orderId, newStatus);
              fetchOrders();
            } catch (err) {
              console.log('Error updating status:', err);
              Alert.alert('Error', 'Could not update order status. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
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
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-gray-800">Gift Orders</Text>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                className={`px-4 py-2 rounded-xl ${activeFilter === tab.key ? 'bg-teal' : 'bg-gray-100'}`}
                onPress={() => setActiveFilter(tab.key)}
              >
                <Text className={`text-sm font-semibold ${activeFilter === tab.key ? 'text-white' : 'text-gray-500'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor="#1F4A45" />}
      >
        {loading ? (
          <View className="items-center mt-20">
            <ActivityIndicator size="large" color="#1F4A45" />
            <Text className="text-sm text-gray-400 mt-3">Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="items-center mt-20">
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Ionicons name="gift-outline" size={36} color="#9A948A" />
            </View>
            <Text className="text-lg font-bold text-gray-800">No orders yet</Text>
            <Text className="text-sm text-gray-500 mt-1.5 text-center px-8">
              Gift orders containing your products will appear here
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const status = order.status || 'pending';
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            const orderNumber = order.order_number || order.id || '--';
            const recipientName = order.recipient_name || 'N/A';
            const total = order.total || order.amount || 0;
            const date = order.created_at || order.date || '';
            const isUpdating = actionLoading === order.id;

            return (
              <View
                key={order.id}
                className="bg-white rounded-3xl p-5 mb-3.5"
                style={{
                  shadowColor: '#211F1C',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* Order number + status */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    className="text-xs font-bold text-gray-500"
                    style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                  >
                    #{orderNumber}
                  </Text>
                  <View className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${config.bg}`}>
                    <Text style={{ color: config.color }} className="text-[11px] font-bold">
                      {config.label}
                    </Text>
                  </View>
                </View>

                {/* Recipient + amount */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="person-outline" size={14} color="#9A948A" />
                    <Text className="text-sm font-semibold text-gray-700">{recipientName}</Text>
                  </View>
                  <Text className="text-[15px] font-extrabold text-teal">
                    {'\u20A6'}{total.toLocaleString()}
                  </Text>
                </View>

                {/* What the seller needs to prepare the gift */}
                {order.address_pending ? (
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="location-outline" size={14} color="#E8632F" />
                    <Text className="flex-1 text-[12.5px] font-bold text-orange">
                      Waiting for the recipient's address. Do not send out yet.
                    </Text>
                  </View>
                ) : null}
                {order.scheduled_date ? (
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="time-outline" size={14} color="#E8632F" />
                    <Text className="text-[12.5px] font-bold text-orange">
                      Deliver on {formatDeliveryDay(order.scheduled_date)}
                    </Text>
                  </View>
                ) : null}
                <View className="flex-row items-center gap-2 mb-1.5">
                  <Ionicons name={order.is_anonymous ? 'eye-off-outline' : 'gift-outline'} size={14} color="#9A948A" />
                  <Text className="flex-1 text-[12.5px] text-gray-600">
                    {order.is_anonymous
                      ? 'Anonymous gift: do not include the sender\'s name'
                      : order.sender_name
                        ? `From ${order.sender_name}`
                        : 'Sender not given'}
                  </Text>
                </View>
                {order.personal_message ? (
                  <View className="flex-row items-start gap-2 mb-1.5">
                    <Ionicons name="chatbubble-outline" size={14} color="#9A948A" />
                    <Text className="flex-1 text-[12.5px] text-gray-600 leading-[18px]">
                      Card message: {order.personal_message}
                    </Text>
                  </View>
                ) : null}

                {/* Date */}
                <Text className="text-[11px] text-gray-400 mb-3">Ordered {formatDate(date)}</Text>

                {/* Action buttons */}
                {status === 'confirmed' && (
                  <TouchableOpacity
                    className={`py-3 rounded-xl items-center ${isUpdating ? 'bg-teal/60' : 'bg-teal'}`}
                    onPress={() => handleUpdateStatus(order.id, 'in_transit')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-sm font-bold text-white">Mark Shipped</Text>
                    )}
                  </TouchableOpacity>
                )}

                {status === 'in_transit' && (
                  <TouchableOpacity
                    className={`py-3 rounded-xl items-center ${isUpdating ? 'bg-teal/60' : 'bg-teal'}`}
                    onPress={() => handleUpdateStatus(order.id, 'delivered')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-sm font-bold text-white">Mark Delivered</Text>
                    )}
                  </TouchableOpacity>
                )}

                {status === 'delivered' && (
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Ionicons name="checkmark-done" size={16} color="#3E8E63" />
                    <Text className="text-xs font-semibold text-green-600">Completed</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
