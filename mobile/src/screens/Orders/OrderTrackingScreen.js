import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { ordersAPI } from '../../services/api';
import { formatDay } from '../../utils/dates';
import AddressPendingCard from '../../components/orders/AddressPendingCard';

// The order statuses the server uses: pending → confirmed → in_transit →
// delivered (or cancelled). Only real order data is shown on this screen.
const STEPS = [
  { key: 'pending', label: 'Order placed', sub: 'We have received your order' },
  { key: 'confirmed', label: 'Order confirmed', sub: 'The vendor is getting it ready' },
  { key: 'in_transit', label: 'Out for delivery', sub: 'Your order is on its way' },
  { key: 'delivered', label: 'Delivered', sub: 'Enjoy your gift!' },
];

const HEADLINE = {
  pending: 'Order placed',
  confirmed: 'Order confirmed',
  in_transit: 'Out for delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Order cancelled',
};

function statusIndex(status) {
  if (status === 'confirmed') return 1;
  if (status === 'in_transit') return 2;
  if (status === 'delivered' || status === 'completed') return 3;
  return 0;
}

const naira = (n) => '₦' + (Number(n) || 0).toLocaleString();

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const cardShadow = { shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 };

export default function OrderTrackingScreen({ navigation, route }) {
  const initial = route.params?.order || null;
  const [order, setOrder] = useState(initial);
  const [loadingItems, setLoadingItems] = useState(!!initial?.id);

  // The list only carries the order header; fetch the full order for its
  // items and its latest status.
  useEffect(() => {
    let alive = true;
    if (!initial?.id) return undefined;
    ordersAPI.get(initial.id)
      .then((res) => {
        if (alive && res.data?.id) setOrder((prev) => ({ ...(prev || {}), ...res.data }));
      })
      .catch(() => {
        // Keep what the list gave us.
      })
      .finally(() => {
        if (alive) setLoadingItems(false);
      });
    return () => { alive = false; };
  }, [initial?.id]);

  const status = order?.status || 'pending';
  const cancelled = status === 'cancelled';
  const delivered = status === 'delivered' || status === 'completed';
  const activeIdx = statusIndex(status);
  const orderNumber = order?.order_number || '';
  const items = Array.isArray(order?.items) ? order.items : [];
  const paymentLabel =
    order?.payment_status === 'paid' ? 'Paid'
      : order?.payment_status === 'refunded' ? 'Refunded to your wallet'
        : order?.payment_status ? 'Awaiting payment' : '';

  const backToOrders = () => {
    const names = navigation.getState?.()?.routeNames || [];
    if (names.includes('OrdersMain')) {
      // Already inside the Orders tab: go back to the list.
      navigation.popTo('OrdersMain');
    } else {
      // Opened from another tab: leave this screen and switch to Orders.
      if (navigation.canGoBack()) navigation.goBack();
      navigation.getParent()?.navigate('Orders');
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="light" />

      {/* Teal header with the order's real status */}
      <View
        className="bg-teal px-5 items-center"
        style={{ paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 34, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <View className="w-full flex-row justify-start">
          <TouchableOpacity
            className="w-10 h-10 rounded-[14px] bg-white/15 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View className="w-16 h-16 rounded-full bg-white/15 items-center justify-center mt-2 mb-3">
          <Ionicons
            name={cancelled ? 'close-circle-outline' : delivered ? 'checkmark-circle' : status === 'in_transit' ? 'bicycle-outline' : 'receipt-outline'}
            size={38}
            color="#fff"
          />
        </View>
        <Text className="text-[22px] font-extrabold text-white">{HEADLINE[status] || 'Your order'}</Text>
        {orderNumber ? <Text className="text-[13px] text-white/70 mt-1">Order {orderNumber}</Text> : null}
        {paymentLabel ? (
          <View className="flex-row items-center gap-1.5 mt-3 bg-white/15 px-3 py-1.5 rounded-full">
            <Ionicons name="card-outline" size={14} color="#fff" />
            <Text className="text-[12px] text-white font-bold">{paymentLabel}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {cancelled ? (
          <View className="bg-white rounded-[20px] p-5" style={cardShadow}>
            <Text className="text-[14px] font-bold text-ink">This order was cancelled</Text>
            <Text className="text-[12px] text-ink-caption mt-1 leading-[18px]">
              {order?.payment_status === 'refunded'
                ? 'The amount you paid has been refunded to your wallet.'
                : 'Nothing further will happen with this order.'}
            </Text>
          </View>
        ) : (
          /* Vertical status timeline */
          <View className="bg-white rounded-[20px] p-5" style={cardShadow}>
            {STEPS.map((step, i) => {
              const done = i < activeIdx || delivered;
              const active = i === activeIdx && !delivered;
              const pending = i > activeIdx;
              const dotColor = done ? '#1F4A45' : active ? '#E8632F' : '#EAE3D8';
              return (
                <View key={step.key} className="flex-row">
                  {/* Rail */}
                  <View className="items-center mr-3.5" style={{ width: 28 }}>
                    <View
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: pending ? '#F0ECE3' : dotColor }}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={15} color="#fff" />
                      ) : active ? (
                        <View className="w-2.5 h-2.5 rounded-full bg-white" />
                      ) : (
                        <View className="w-2 h-2 rounded-full bg-ink-placeholder" />
                      )}
                    </View>
                    {i < STEPS.length - 1 && (
                      <View style={{ width: 2, flex: 1, minHeight: 34, backgroundColor: i < activeIdx ? '#1F4A45' : '#EAE3D8', marginVertical: 2 }} />
                    )}
                  </View>
                  {/* Label */}
                  <View className="flex-1 pb-6">
                    <Text className={`text-[14px] font-bold ${pending ? 'text-ink-caption' : 'text-ink'}`}>
                      {step.label}
                    </Text>
                    <Text className="text-[12px] text-ink-caption mt-0.5">{step.sub}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Items */}
        <View className="bg-white rounded-[20px] p-5 mt-4" style={cardShadow}>
          <Text className="text-[14px] font-bold text-ink mb-3">Items</Text>
          {loadingItems && items.length === 0 ? (
            <ActivityIndicator color="#1F4A45" />
          ) : items.length === 0 ? (
            <Text className="text-[12px] text-ink-caption">The items in this order could not be loaded.</Text>
          ) : (
            items.map((line) => (
              <View key={line.id || line.product_id} className="py-2.5 border-b border-gray-50">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[13.5px] font-semibold text-ink">{line.product_name || 'Gift'}</Text>
                    <Text className="text-[12px] text-ink-caption mt-0.5">
                      Qty {line.quantity}{line.vendor_name ? ` · ${line.vendor_name}` : ''}
                    </Text>
                  </View>
                  <Text className="text-[13.5px] font-bold text-ink">{naira(line.total_price)}</Text>
                </View>
                {/* Rate the product itself once the order has arrived */}
                {delivered && line.product_id ? (
                  <TouchableOpacity
                    className="mt-2 bg-teal/10 py-1.5 px-3 rounded-xl self-start flex-row items-center gap-1"
                    onPress={() => navigation.navigate('WriteReview', {
                      targetType: 'product',
                      targetId: line.product_id,
                      targetName: line.product_name || 'your gift',
                      orderId: order?.id,
                    })}
                  >
                    <Ionicons name="star-outline" size={13} color="#1F4A45" />
                    <Text className="text-[11.5px] font-bold text-teal">Rate this item</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
          <View className="flex-row justify-between mt-3">
            <Text className="text-[13px] text-ink-soft">Delivery</Text>
            <Text className="text-[13px] font-bold text-ink">
              {Number(order?.delivery_fee) > 0 ? naira(order.delivery_fee) : 'Free'}
            </Text>
          </View>
          {Number(order?.discount) > 0 ? (
            <View className="flex-row justify-between mt-2">
              <Text className="text-[13px] text-ink-soft">
                Discount{order?.promo_code ? ` (${order.promo_code})` : ''}
              </Text>
              <Text className="text-[13px] font-bold text-success">-{naira(order.discount)}</Text>
            </View>
          ) : null}
          <View className="flex-row justify-between mt-2">
            <Text className="text-[15px] font-bold text-ink">Total</Text>
            <Text className="text-[16px] font-extrabold text-teal">{naira(order?.total)}</Text>
          </View>
        </View>

        {/* Ordered without an address: nothing ships until one is given */}
        {order?.address_pending && !cancelled ? (
          <AddressPendingCard
            order={order}
            onDone={(patch) => setOrder((prev) => ({ ...(prev || {}), ...patch }))}
          />
        ) : null}

        {/* Delivery details */}
        <View className="bg-white rounded-[20px] p-5 mt-4" style={cardShadow}>
          <Text className="text-[14px] font-bold text-ink mb-3">Delivery</Text>
          {order?.recipient_name ? (
            <View className="flex-row items-start gap-2.5 mb-2.5">
              <Ionicons name="person-outline" size={16} color="#6E6A63" />
              <Text className="flex-1 text-[13px] text-ink">{order.recipient_name}</Text>
            </View>
          ) : null}
          <View className="flex-row items-start gap-2.5 mb-2.5">
            <Ionicons name="location-outline" size={16} color="#6E6A63" />
            <Text className="flex-1 text-[13px] text-ink leading-[19px]">
              {[order?.delivery_address, order?.delivery_city].filter(Boolean).join(', ') || (order?.address_pending ? 'Waiting for the recipient to confirm the address' : 'No address on this order')}
            </Text>
          </View>
          {order?.scheduled_date ? (
            <View className="flex-row items-start gap-2.5 mb-2.5">
              <Ionicons name="time-outline" size={16} color="#6E6A63" />
              <Text className="flex-1 text-[13px] text-ink">
                Scheduled for {formatDay(order.scheduled_date)}
              </Text>
            </View>
          ) : null}
          {order?.is_anonymous ? (
            <View className="flex-row items-start gap-2.5 mb-2.5">
              <Ionicons name="eye-off-outline" size={16} color="#6E6A63" />
              <Text className="flex-1 text-[13px] text-ink">Sent anonymously: your name is not shared</Text>
            </View>
          ) : null}
          {order?.personal_message ? (
            <View className="flex-row items-start gap-2.5 mb-2.5">
              <Ionicons name="chatbubble-outline" size={16} color="#6E6A63" />
              <Text className="flex-1 text-[13px] text-ink-soft leading-[19px]">{order.personal_message}</Text>
            </View>
          ) : null}
          {formatDate(order?.created_at) ? (
            <View className="flex-row items-start gap-2.5">
              <Ionicons name="calendar-outline" size={16} color="#6E6A63" />
              <Text className="flex-1 text-[13px] text-ink-soft">Placed on {formatDate(order.created_at)}</Text>
            </View>
          ) : null}
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* View in My Orders */}
      <View className="px-5 pb-8 pt-3">
        <TouchableOpacity
          className="h-[52px] rounded-[16px] border-[1.5px] border-teal items-center justify-center"
          onPress={backToOrders}
          activeOpacity={0.85}
        >
          <Text className="text-[15px] font-bold text-teal">View in My Orders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
