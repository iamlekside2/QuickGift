import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { providersAPI } from '../../services/api';

export default function ProviderServices({ navigation }) {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const providerId = user?.id || user?._id;
      if (providerId) {
        const res = await providersAPI.services(providerId);
        const data = res.data?.services || res.data || [];
        setServices(Array.isArray(data) ? data : []);
      } else {
        setServices([]);
      }
    } catch (e) {
      console.log('Error fetching services:', e);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [fetchServices])
  );

  const activeServices = services.filter((s) => s.active !== false);

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
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#35615D" />
          </View>
        ) : services.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-gray-800 mt-3">No services yet</Text>
            <Text className="text-sm text-gray-400 mt-1">Add your first service!</Text>
            <TouchableOpacity
              className="bg-teal px-6 py-3 rounded-2xl mt-4"
              onPress={() => navigation.navigate('ServiceForm', { mode: 'add' })}
            >
              <Text className="text-sm text-white font-bold">Add First Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id || service._id}
                className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
                style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                onPress={() => navigation.navigate('ServiceForm', { mode: 'edit', service })}
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-gray-800">{service.name}</Text>
                    {service.active === false && (
                      <View className="bg-gray-200 px-2.5 py-0.5 rounded-full">
                        <Text className="text-[10px] text-gray-400 font-bold">Inactive</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center gap-3 mt-1.5">
                    {service.duration ? (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                        <Text className="text-xs text-gray-400">{service.duration}</Text>
                      </View>
                    ) : null}
                    {service.price != null && (
                      <Text className="text-sm font-extrabold text-teal">{'\u20A6'}{Number(service.price).toLocaleString()}</Text>
                    )}
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
                  {activeServices.length} active service{activeServices.length !== 1 ? 's' : ''}
                </Text>
              </View>
              {services.length > 0 && services.some((s) => s.price != null) && (
                <Text className="text-xs text-gray-400 ml-4">
                  Price range: {'\u20A6'}{Math.min(...services.filter((s) => s.price != null).map((s) => Number(s.price))).toLocaleString()} - {'\u20A6'}{Math.max(...services.filter((s) => s.price != null).map((s) => Number(s.price))).toLocaleString()}
                </Text>
              )}
            </View>
          </>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
