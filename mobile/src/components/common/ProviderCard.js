import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProviderCard({ item, onPress }) {
  const name = item.business_name || item.name || 'Provider';
  const service = item.service_type || item.service || '';
  const reviews = item.review_count ?? item.reviews ?? 0;
  const location = item.location || '';
  const isAvailable = item.is_available ?? item.available ?? false;

  return (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-2xl p-3.5 gap-3"
      style={{
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
      }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="w-13 h-13 rounded-2xl bg-teal-light items-center justify-center" style={{ width: 52, height: 52 }}>
        <Text className="text-xl font-bold text-teal">{name.charAt(0)}</Text>
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[15px] font-bold text-gray-800" numberOfLines={1}>{name}</Text>
          {isAvailable && (
            <View className="flex-row items-center bg-green-50 px-1.5 py-0.5 rounded-full gap-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <Text className="text-[9px] text-green-600 font-semibold">Online</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-500">{service}</Text>
        <View className="flex-row items-center gap-3 mt-0.5">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text className="text-[11px] text-gray-600 font-semibold">{item.rating || 0}</Text>
            <Text className="text-[10px] text-gray-400">({reviews})</Text>
          </View>
          {item.distance_km != null ? (
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="navigate-outline" size={11} color="#35615D" />
              <Text className="text-[10px] text-teal font-semibold">
                {item.distance_km < 1
                  ? `${Math.round(item.distance_km * 1000)}m`
                  : `${item.distance_km.toFixed(1)}km`}
              </Text>
            </View>
          ) : location ? (
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="location-outline" size={11} color="#9CA3AF" />
              <Text className="text-[10px] text-gray-400">{location}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {item.price ? (
        <View className="items-end">
          <Text className="text-[10px] text-gray-400">From</Text>
          <Text className="text-[15px] font-extrabold text-teal">₦{item.price.toLocaleString()}</Text>
        </View>
      ) : (
        <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      )}
    </TouchableOpacity>
  );
}
