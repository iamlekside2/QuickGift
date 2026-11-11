import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useWallet } from '../../context/WalletContext';
import { ordersAPI, bookingsAPI, paymentsAPI } from '../../services/api';
import { apiError } from '../../utils/errors';
import { useRequireAuth } from '../../utils/requireAuth';

const TABS = ['All', 'Gifts', 'Beauty'];

// Order statuses: pending, confirmed, in_transit, delivered, cancelled.
// Booking statuses: pending, accepted, confirmed, in_progress, completed,
// declined, cancelled.
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#B8862E', bg: 'bg-amber-50', icon: 'time-outline' },
  accepted: { label: 'Accepted', color: '#4C7CB0', bg: 'bg-blue-50', icon: 'checkmark-circle-outline' },
  confirmed: { label: 'Confirmed', color: '#4C7CB0', bg: 'bg-blue-50', icon: 'checkmark-circle-outline' },
  in_progress: { label: 'In Progress', color: '#7A5FA8', bg: 'bg-purple-50', icon: 'hourglass-outline' },
  in_transit: { label: 'In Transit', color: '#7A5FA8', bg: 'bg-purple-50', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', color: '#3E8E63', bg: 'bg-green-50', icon: 'checkmark-done-outline' },
  completed: { label: 'Completed', color: '#3E8E63', bg: 'bg-green-50', icon: 'checkmark-done-outline' },
  declined: { label: 'Declined', color: '#D24B4B', bg: 'bg-red-50', icon: 'close-circle-outline' },
  cancelled: { label: 'Cancelled', color: '#D24B4B', bg: 'bg-red-50', icon: 'close-circle-outline' },
};

// A status we do not know is shown as written, never passed off as "Pending".
const statusConfig = (status) =>
  STATUS_CONFIG[status] || {
    label: String(status || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    color: '#6E6A63',
    bg: 'bg-gray-100',
    icon: 'time-outline',
  };

// What the buyer is allowed to cancel (the server enforces the same rules).
const ORDER_CANCELLABLE = ['pending', 'confirmed'];
const BOOKING_CANCELLABLE = ['pending', 'accepted', 'confirmed'];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const naira = (n) => '₦' + (Number(n) || 0).toLocaleString();

const TRACKING_STEPS = ['Confirmed', 'In Transit', 'Delivered'];

function getTrackingIndex(status) {
  if (status === 'confirmed') return 0;
  if (status === 'in_transit') return 1;
  if (status === 'delivered' || status === 'completed') return 2;
  return -1;
}

export default function OrdersScreen() {
  const navigation = useNavigation();
  const { signedIn, requireAuth } = useRequireAuth();
  const { refreshBalance } = useWallet();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);        // item being cancelled / opened for review
  const [reviewChoices, setReviewChoices] = useState(null); // { order, items } when an order has several products
  const loadedOnce = useRef(false);

  const loadOrders = useCallback(async () => {
    try {
      const [ordersRes, bookingsRes] = await Promise.allSettled([
        ordersAPI.list(),
        bookingsAPI.list(),
      ]);
      if (ordersRes.status === 'fulfilled') {
        const items = ordersRes.value.data?.items || ordersRes.value.data || [];
        setOrders(items.map((o) => ({ ...o, type: 'gift' })));
      }
      if (bookingsRes.status === 'fulfilled') {
        const items = bookingsRes.value.data?.items || bookingsRes.value.data || [];
        setBookings(items.map((b) => ({ ...b, type: 'beauty' })));
      }
      if (ordersRes.status === 'rejected' && bookingsRes.status === 'rejected') {
        setLoadError(apiError(ordersRes.reason, 'We could not load your orders. Pull down to try again.'));
      } else {
        setLoadError('');
      }
    } finally {
      loadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload every time the tab is opened, so a new order or a status change
  // shows without restarting the app.
  useFocusEffect(
    useCallback(() => {
      if (!signedIn) {
        setLoading(false);
        return;
      }
      if (!loadedOnce.current) setLoading(true);
      loadOrders();
    }, [signedIn, loadOrders]),
  );

  const onRefresh = () => {
    if (!signedIn) return;
    setRefreshing(true);
    loadOrders();
  };

  // Pay for an order or booking that was created but never paid (for example
  // the customer left checkout). The server charges the real amount for it.
  const handlePayNow = async (item) => {
    const isGift = item.type === 'gift';
    setBusyId(item.id);
    try {
      const res = await paymentsAPI.initialize(
        isGift ? { order_id: item.id, method: 'card' } : { booking_id: item.id, method: 'card' },
      );
      const data = res.data || {};
      if (data.authorization_url) {
        // This screen reloads on focus, so the paid state shows when we return.
        navigation.navigate('PaystackWebView', {
          authorization_url: data.authorization_url,
          reference: data.reference,
        });
      } else if (__DEV__ && data.reference) {
        // Local development server only: no gateway, verify auto-approves.
        await paymentsAPI.verify(data.reference);
        await loadOrders();
      } else {
        Alert.alert('Payment not started', 'We could not start your payment. Please try again.');
      }
    } catch (err) {
      Alert.alert('Payment not started', apiError(err, 'We could not start your payment. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (item) => {
    const isGift = item.type === 'gift';
    const noun = isGift ? 'order' : 'booking';
    const paid = item.payment_status === 'paid';
    Alert.alert(
      isGift ? 'Cancel Order' : 'Cancel Booking',
      paid
        ? `Cancel this ${noun}? The amount you paid will be refunded to your wallet.`
        : `Cancel this ${noun}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setBusyId(item.id);
            try {
              // Orders and bookings have their own cancel endpoints.
              const res = isGift ? await ordersAPI.cancel(item.id) : await bookingsAPI.cancel(item.id);
              const data = res.data || {};
              if (data.refunded) {
                refreshBalance();
                Alert.alert(
                  isGift ? 'Order cancelled' : 'Booking cancelled',
                  `${naira(data.refund_amount)} has been refunded to your wallet.`,
                );
              }
              await loadOrders();
            } catch (err) {
              Alert.alert(
                isGift ? 'Order not cancelled' : 'Booking not cancelled',
                apiError(err, `We could not cancel this ${noun}. Please try again.`),
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const openProductReview = (order, line) => {
    navigation.navigate('WriteReview', {
      targetType: 'product',
      targetId: line.product_id,
      targetName: line.product_name || 'your gift',
      orderId: order.id,
    });
  };

  // A review is about a product (for an order) or a provider (for a booking),
  // never about the order or booking id itself.
  const handleReview = async (item) => {
    if (item.type !== 'gift') {
      if (!item.provider_id) {
        Alert.alert('Cannot review yet', 'We could not find the provider for this booking.');
        return;
      }
      navigation.navigate('WriteReview', {
        targetType: 'provider',
        targetId: item.provider_id,
        targetName: item.provider_name || item.service_name || 'your provider',
        bookingId: item.id,
      });
      return;
    }
    setBusyId(item.id);
    try {
      const res = await ordersAPI.get(item.id);
      const lines = (res.data?.items || []).filter((l) => l.product_id);
      if (lines.length === 0) {
        Alert.alert('Nothing to review', 'We could not find the items in this order.');
      } else if (lines.length === 1) {
        openProductReview(item, lines[0]);
      } else {
        setReviewChoices({ order: item, items: lines });
      }
    } catch (err) {
      Alert.alert('Could not open review', apiError(err, 'Please try again in a moment.'));
    } finally {
      setBusyId(null);
    }
  };

  const allItems = useMemo(() => [...orders, ...bookings].sort((a, b) =>
    new Date(b.created_at || 0) - new Date(a.created_at || 0)
  ), [orders, bookings]);

  const filtered = useMemo(() => activeTab === 'All' ? allItems
    : activeTab === 'Gifts' ? allItems.filter((i) => i.type === 'gift')
    : allItems.filter((i) => i.type === 'beauty'), [allItems, activeTab]);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F4A45" />}
      >
        {!signedIn ? (
          <View className="items-center mt-20">
            <View className="w-20 h-20 rounded-full bg-sand items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={34} color="#9A948A" />
            </View>
            <Text className="text-lg font-bold text-ink">Please sign in to continue</Text>
            <Text className="text-sm text-ink-soft mt-1.5 text-center px-8">
              Your orders and bookings appear here once you have an account.
            </Text>
            <TouchableOpacity
              className="mt-5 bg-teal h-[48px] px-8 rounded-[16px] items-center justify-center"
              onPress={() => requireAuth('Create an account or sign in to see your orders and bookings.')}
            >
              <Text className="text-[14px] font-bold text-white">Sign in</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View className="items-center mt-20">
            <ActivityIndicator size="large" color="#1F4A45" />
            <Text className="text-sm text-gray-400 mt-3">Loading orders...</Text>
          </View>
        ) : loadError && filtered.length === 0 ? (
          <View className="items-center mt-20">
            <View className="w-20 h-20 rounded-full bg-sand items-center justify-center mb-4">
              <Ionicons name="cloud-offline-outline" size={34} color="#9A948A" />
            </View>
            <Text className="text-lg font-bold text-ink">Could not load your orders</Text>
            <Text className="text-sm text-ink-soft mt-1.5 text-center px-8">{loadError}</Text>
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
            const config = statusConfig(status);
            const trackIdx = getTrackingIndex(status);
            const isGift = item.type === 'gift';
            const name = isGift
              ? (item.order_number ? `Order ${item.order_number}` : 'Gift order')
              : (item.service_name || 'Booking');
            const recipient = isGift ? (item.recipient_name || '') : (item.provider_name || '');
            const price = Number(isGift ? item.total : item.price) || 0;
            // A booking is dated by its appointment; an order by when it was placed.
            const when = isGift
              ? formatDate(item.created_at)
              : [formatDate(item.booking_date), item.booking_time].filter(Boolean).join(', ');
            const cancellable = (isGift ? ORDER_CANCELLABLE : BOOKING_CANCELLABLE).includes(status);
            const finished = status === 'delivered' || status === 'completed';
            const unpaid = item.payment_status && item.payment_status !== 'paid' && item.payment_status !== 'refunded'
              && (status === 'pending' || status === 'accepted');
            const busy = busyId === item.id;

            return (
              <TouchableOpacity
                key={`${item.type}-${item.id}`}
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
                    {unpaid ? (
                      <Text className="text-[11px] font-bold mt-1" style={{ color: '#B8862E' }}>Awaiting payment</Text>
                    ) : null}
                  </View>
                  <Text className="text-[15px] font-extrabold text-teal">{naira(price)}</Text>
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
                  <Text className="text-[11px] text-gray-400">{when}</Text>
                  <View
                    className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${config.bg}`}
                  >
                    <Ionicons name={config.icon} size={12} color={config.color} />
                    <Text style={{ color: config.color }} className="text-[11px] font-bold">
                      {config.label}
                    </Text>
                  </View>
                </View>

                {/* Finish paying for something left unpaid */}
                {unpaid && (
                  <TouchableOpacity
                    className="mt-3 py-2.5 rounded-xl bg-teal items-center"
                    onPress={() => handlePayNow(item)}
                    disabled={busy}
                    style={{ opacity: busy ? 0.6 : 1 }}
                  >
                    <Text className="text-xs font-bold text-white">
                      {busy ? 'Please wait...' : `Pay now ${naira(price)}`}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Cancel while the server still allows it */}
                {cancellable && (
                  <TouchableOpacity
                    className="mt-3 py-2.5 rounded-xl border border-red-200 bg-red-50 items-center"
                    onPress={() => handleCancel(item)}
                    disabled={busy}
                    style={{ opacity: busy ? 0.6 : 1 }}
                  >
                    <Text className="text-xs font-bold text-red-500">
                      {busy ? 'Cancelling...' : isGift ? 'Cancel Order' : 'Cancel Booking'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Leave Review for delivered/completed */}
                {finished && (
                  <TouchableOpacity
                    className="mt-2 bg-teal/10 py-2 px-3 rounded-xl self-start flex-row items-center gap-1"
                    onPress={() => handleReview(item)}
                    disabled={busy}
                  >
                    <Ionicons name="star-outline" size={14} color="#1F4A45" />
                    <Text className="text-xs font-bold text-teal">{busy ? 'Opening...' : 'Leave Review'}</Text>
                  </TouchableOpacity>
                )}

                {/* Report Issue for delivered/completed */}
                {finished && (
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

      {/* An order with several products: choose which one to review */}
      <Modal visible={!!reviewChoices} transparent animationType="fade" onRequestClose={() => setReviewChoices(null)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-5 w-full max-w-[360px]">
            <Text className="text-lg font-bold text-gray-800 mb-1">Which item?</Text>
            <Text className="text-sm text-gray-400 mb-4">Choose the gift you want to review.</Text>
            {(reviewChoices?.items || []).map((line) => (
              <TouchableOpacity
                key={line.id || line.product_id}
                className="flex-row items-center gap-3 py-3 border-b border-gray-50"
                onPress={() => {
                  const order = reviewChoices.order;
                  setReviewChoices(null);
                  openProductReview(order, line);
                }}
              >
                <Ionicons name="gift-outline" size={18} color="#1F4A45" />
                <Text className="flex-1 text-[14px] font-semibold text-gray-800" numberOfLines={2}>
                  {line.product_name || 'Gift'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#B5AFA2" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="mt-4 h-12 rounded-2xl items-center justify-center bg-gray-100" onPress={() => setReviewChoices(null)}>
              <Text className="text-sm font-bold text-gray-600">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
