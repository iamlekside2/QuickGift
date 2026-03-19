import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EMOJI_MAP = {
  cake: '🎂', flower: '💐', chocolate: '🍫',
  hamper: '🧺', balloon: '🎈', default: '🎁',
};

function getEmoji(category) {
  const cat = (category || '').toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (cat.includes(key)) return emoji;
  }
  return EMOJI_MAP.default;
}

export default function GiftCard({ item, onPress }) {
  const price = '₦' + (item.price || 0).toLocaleString();
  const emoji = getEmoji(item.category || item.category_name);

  return (
    <TouchableOpacity
      className="w-[165px] bg-white rounded-3xl overflow-hidden"
      style={{
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="h-[130px] bg-cream items-center justify-center relative">
        <Text style={{ fontSize: 52 }}>{emoji}</Text>
        {item.rating >= 4.7 && (
          <View className="absolute top-2.5 left-2.5 bg-white/90 rounded-full px-2 py-0.5 flex-row items-center gap-0.5">
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text className="text-[10px] font-bold text-gray-700">{item.rating}</Text>
          </View>
        )}
      </View>
      <View className="p-3.5 gap-1">
        <Text className="text-[13px] font-bold text-gray-800" numberOfLines={1}>
          {item.name || 'Gift'}
        </Text>
        <Text className="text-[11px] text-gray-400" numberOfLines={1}>
          {item.vendor_name || item.vendor || ''}
        </Text>
        <View className="flex-row justify-between items-center mt-1.5">
          <Text className="text-[15px] font-extrabold text-teal">{price}</Text>
          <View className="w-7 h-7 rounded-full bg-teal items-center justify-center">
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
