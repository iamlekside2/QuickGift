import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import AppInput from '../../components/common/AppInput';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function RecipientDetailsScreen({ route, navigation }) {
  const gift = route.params?.gift || {};

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [coords, setCoords] = useState(null);     // { lat, lng } chosen on the map
  const [area, setArea] = useState(null);         // address/area label from the picker

  const openPicker = () => {
    navigation.navigate('LocationPicker', {
      title: 'Delivery location',
      initial: coords,
      onPick: ({ lat, lng, address: addr }) => {
        setCoords({ lat, lng });
        if (addr) {
          setArea(addr);
          setAddress(addr);
        }
      },
    });
  };

  const handleNext = () => {
    navigation.navigate('PaymentScreen', {
      gift,
      recipient: {
        name, phone, address, note,
        lat: coords?.lat,
        lng: coords?.lng,
        city: area || undefined,
      },
    });
  };

  const isValid = name.trim() && phone.trim() && address.trim();

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <ScreenHeader variant="stack" title="Recipient Details" onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Gift summary */}
        <View
          className="bg-white rounded-2xl p-4 flex-row items-center gap-3 mb-6"
          style={{
            shadowColor: '#211F1C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="w-14 h-14 rounded-xl bg-teal-light items-center justify-center">
            <Ionicons name="gift-outline" size={26} color="#1F4A45" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-800">{gift.name || 'Gift'}</Text>
            <Text className="text-xs text-gray-500">{gift.vendor_name || gift.vendor || ''}</Text>
          </View>
          <Text className="text-base font-extrabold text-teal">₦{(gift.price || 0).toLocaleString()}</Text>
        </View>

        <Text className="text-base font-bold text-gray-800 mb-4">Who's receiving this gift?</Text>

        {/* Form Card */}
        <View
          className="bg-white rounded-2xl p-5 mb-6"
          style={{
            shadowColor: '#211F1C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Recipient Name */}
          <AppInput
            label="Recipient Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Samuel Odion"
            type="text"
            icon="person-outline"
          />

          {/* Phone */}
          <AppInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="806 789 1234"
            type="phone"
          />

          {/* Set delivery location on map */}
          <TouchableOpacity
            onPress={openPicker}
            activeOpacity={0.8}
            className="flex-row items-center gap-2 self-start mb-2 px-3 py-2 rounded-xl bg-teal/10"
          >
            <Ionicons name="map" size={15} color="#1F4A45" />
            <Text className="text-[12.5px] font-bold text-teal">
              {coords ? 'Change location on map' : 'Set delivery location on map'}
            </Text>
          </TouchableOpacity>
          {area && (
            <Text className="text-[11.5px] text-green-600 mb-2">
              <Ionicons name="checkmark-circle" size={12} color="#3E8E63" /> {area}
            </Text>
          )}

          {/* Address */}
          <AppInput
            label="Delivery Address"
            value={address}
            onChangeText={setAddress}
            placeholder="15 Freedom Avenue, Lagos"
            type="text"
            icon="location-outline"
          />

          {/* Optional Note */}
          <AppInput
            label="Personal Note (Optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Happy Birthday! Wishing you the best..."
            type="multiline"
          />
        </View>

        <View className="h-[100px]" />
      </ScrollView>

      {/* Bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4"
        style={{
          shadowColor: '#211F1C',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${isValid ? 'bg-teal' : 'bg-gray-300'}`}
          style={isValid ? {
            shadowColor: '#1F4A45',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          } : undefined}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text className={`text-base font-bold ${isValid ? 'text-white' : 'text-gray-500'}`}>
            Continue to Payment
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
