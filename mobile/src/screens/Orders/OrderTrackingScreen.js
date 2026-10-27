import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';

const STEPS = [
  { key: 'confirmed', label: 'Order confirmed', sub: 'We received your order' },
  { key: 'preparing', label: 'Being prepared', sub: 'The vendor is getting it ready' },
  { key: 'in_transit', label: 'Out for delivery', sub: 'Your rider is on the way' },
  { key: 'delivered', label: 'Delivered', sub: 'Enjoy your gift!' },
];

function statusIndex(status) {
  if (status === 'confirmed') return 1;
  if (status === 'preparing') return 1;
  if (status === 'in_transit') return 2;
  if (status === 'delivered' || status === 'completed') return 3;
  return 0;
}

export default function OrderTrackingScreen({ navigation, route }) {
  const { order } = route.params || {};
  const status = order?.status || 'confirmed';
  const activeIdx = statusIndex(status);
  const orderNumber = order?.order_number || order?.id || '—';
  const rider = order?.rider || null;

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="light" />

      {/* Teal header with check circle */}
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
          <Ionicons name="checkmark-circle" size={40} color="#fff" />
        </View>
        <Text className="text-[22px] font-extrabold text-white">Order placed!</Text>
        <Text className="text-[13px] text-white/70 mt-1">Order #{orderNumber}</Text>
        <View className="flex-row items-center gap-1.5 mt-3 bg-white/15 px-3 py-1.5 rounded-full">
          <Ionicons name="time-outline" size={14} color="#fff" />
          <Text className="text-[12px] text-white font-bold">Estimated 2–4 PM today</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Rating prompt — shown once the order is delivered */}
        {(status === 'delivered' || status === 'completed') && (
          <TouchableOpacity
            onPress={() => navigation.navigate('WriteReview', {
              targetType: 'product',
              targetId: order?.product_id || order?.id,
              targetName: order?.product_name || order?.name || 'your order',
              orderId: order?.id,
            })}
            activeOpacity={0.9}
            className="bg-white rounded-[20px] p-4 mb-4 flex-row items-center"
            style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(232,99,47,0.12)' }}>
              <Ionicons name="star" size={22} color="#E8632F" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-[14px] font-bold text-ink">How was your order?</Text>
              <Text className="text-[12px] text-ink-caption mt-0.5">Tap to rate — it helps others shop with confidence</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B5AFA2" />
          </TouchableOpacity>
        )}

        {/* Vertical status timeline */}
        <View
          className="bg-white rounded-[20px] p-5"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
        >
          {STEPS.map((step, i) => {
            const done = i < activeIdx;
            const active = i === activeIdx;
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
                    <View style={{ width: 2, flex: 1, minHeight: 34, backgroundColor: done ? '#1F4A45' : '#EAE3D8', marginVertical: 2 }} />
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

        {/* Rider card */}
        <View
          className="bg-white rounded-[20px] p-4 mt-4 flex-row items-center"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
        >
          <View className="w-12 h-12 rounded-full bg-teal-light items-center justify-center">
            <Ionicons name="person" size={22} color="#1F4A45" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-[14px] font-bold text-ink">{rider?.name || 'Your rider'}</Text>
            <Text className="text-[12px] text-ink-caption mt-0.5">
              {rider?.vehicle || 'Dispatch rider'} · {rider?.plate || 'LAG-234-QG'}
            </Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-full bg-teal items-center justify-center"
            onPress={() => rider?.phone && Linking.openURL(`tel:${rider.phone}`)}
          >
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* View in My Orders */}
      <View className="px-5 pb-8 pt-3">
        <TouchableOpacity
          className="h-[52px] rounded-[16px] border-[1.5px] border-teal items-center justify-center"
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.85}
        >
          <Text className="text-[15px] font-bold text-teal">View in My Orders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
