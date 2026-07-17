import React from 'react';
import { TouchableOpacity, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Line-icon placeholder per category (real photography replaces these slots).
const ICON_MAP = {
  cake: 'ice-cream-outline', dessert: 'ice-cream-outline',
  flower: 'rose-outline', chocolate: 'fast-food-outline', snack: 'fast-food-outline',
  hamper: 'basket-outline', balloon: 'balloon-outline', card: 'balloon-outline',
  personal: 'color-wand-outline', default: 'gift-outline',
};

function getIcon(category) {
  const cat = (category || '').toLowerCase();
  for (const [key, name] of Object.entries(ICON_MAP)) {
    if (cat.includes(key)) return name;
  }
  return ICON_MAP.default;
}

export default React.memo(function GiftCard({ item, onPress }) {
  const price = '₦' + (item.price || 0).toLocaleString();
  const iconName = getIcon(item.category || item.category_name);

  return (
    <TouchableOpacity
      className="w-[165px] bg-white rounded-[22px] overflow-hidden"
      style={{
        shadowColor: '#211F1C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 4,
      }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="h-[120px] bg-cream items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Ionicons name={iconName} size={40} color="#B5AFA2" />
        )}
        {item.rating >= 4.7 && (
          <View className="absolute top-2.5 left-2.5 bg-white/90 rounded-full px-2 py-0.5 flex-row items-center gap-0.5">
            <Ionicons name="star" size={10} color="#B8862E" />
            <Text className="text-[10px] font-bold text-ink-soft">{item.rating}</Text>
          </View>
        )}
      </View>
      <View className="p-3.5 gap-1">
        <Text className="text-[13px] font-bold text-ink" numberOfLines={1}>
          {item.name || 'Gift'}
        </Text>
        <Text className="text-[11px] text-ink-caption" numberOfLines={1}>
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
})
