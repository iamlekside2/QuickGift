import React from 'react';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SerifHeadline } from '../../components/common/Typography';
import Button from '../../components/common/Button';

const celebration = require('../../../assets/images/celebration.png');

export default function BookingConfirmedScreen({ navigation, route }) {
  const { providerName, serviceName, when, location, bookingId } = route.params || {};

  return (
    <View className="flex-1 bg-cream-warm items-center px-6" style={{ paddingTop: Platform.OS === 'ios' ? 90 : 70 }}>
      <StatusBar style="dark" />

      <Image source={celebration} style={{ width: 220, height: 220, resizeMode: 'contain' }} />

      <SerifHeadline text="You're booked!" emphasis="booked!" size={32} style={{ textAlign: 'center', marginTop: 8 }} />

      <Text className="text-[14px] text-ink-soft text-center leading-[21px] mt-3">
        {serviceName || 'Your appointment'}{when ? ` · ${when}` : ''}{location ? ` · ${location}` : ''}
        {providerName ? `\nwith ${providerName}` : ''}
      </Text>

      {/* Booking ID card */}
      {bookingId ? (
        <View className="bg-white rounded-[16px] px-5 py-4 mt-7 w-full border-[1.5px] border-line-border flex-row items-center justify-between">
          <Text className="text-[13px] text-ink-soft font-semibold">Booking ID</Text>
          <Text className="text-[14px] text-ink font-extrabold">#{bookingId}</Text>
        </View>
      ) : null}

      <View className="w-full mt-auto" style={{ paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
        <Button
          title="View My Bookings"
          onPress={() => navigation.getParent()?.navigate('Orders') || navigation.navigate('Orders')}
          style={{ width: '100%' }}
        />
        <TouchableOpacity
          className="items-center py-4 mt-1"
          onPress={() => navigation.getParent()?.navigate('Home') || navigation.navigate('Home')}
        >
          <Text className="text-[14px] text-ink-soft font-bold">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
