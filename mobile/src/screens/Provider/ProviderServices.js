import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const SERVICES = [
  { id: '1', name: 'Gel Nails - Full Set', duration: '1.5 hrs', price: 8000, active: true },
  { id: '2', name: 'Gel Nails - Refill', duration: '1 hr', price: 5000, active: true },
  { id: '3', name: 'Nail Art (per nail)', duration: '30 min', price: 1500, active: true },
  { id: '4', name: 'Acrylic Nails', duration: '2 hrs', price: 12000, active: true },
  { id: '5', name: 'Manicure & Pedicure', duration: '1.5 hrs', price: 6000, active: false },
  { id: '6', name: 'Press-On Nails', duration: '45 min', price: 4000, active: true },
];

export default function ProviderServices({ navigation }) {
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
            <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>My Services</Text>
          </View>
          <TouchableOpacity
            className="bg-teal px-4 py-2.5 rounded-2xl flex-row items-center gap-1"
            onPress={() => navigation.navigate('ServiceForm', { mode: 'add' })}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-sm text-white font-bold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Services List */}
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
            style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            onPress={() => navigation.navigate('ServiceForm', { mode: 'edit', service })}
          >
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-bold text-gray-800">{service.name}</Text>
                {!service.active && (
                  <View className="bg-gray-200 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] text-gray-400 font-bold">Inactive</Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center gap-3 mt-1.5">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                  <Text className="text-xs text-gray-400">{service.duration}</Text>
                </View>
                <Text className="text-sm font-extrabold text-teal">{'\u20A6'}{service.price.toLocaleString()}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* Summary */}
        <View
          className="bg-white rounded-2xl p-4 mt-3 mb-6"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-2 h-2 rounded-full bg-teal" />
            <Text className="text-[17px] font-bold text-teal">
              {SERVICES.filter(s => s.active).length} active services
            </Text>
          </View>
          <Text className="text-xs text-gray-400 ml-4">
            Price range: {'\u20A6'}{Math.min(...SERVICES.map(s => s.price)).toLocaleString()} - {'\u20A6'}{Math.max(...SERVICES.map(s => s.price)).toLocaleString()}
          </Text>
        </View>

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
