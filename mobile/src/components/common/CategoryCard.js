import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from './IconCompat';

// Tinted icon tile + label. `icon` is an Ionicons (outline) name.
export default React.memo(function CategoryCard({ label, icon, color, onPress, size = 'md' }) {
  const isSm = size === 'sm';
  const tint = color || '#1F4A45';
  const tileSize = isSm ? 48 : 56;
  const iconSize = isSm ? 20 : 24;

  return (
    <TouchableOpacity
      className={`items-center ${isSm ? 'w-[72px]' : 'w-[85px]'} gap-2`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        className="items-center justify-center rounded-[16px]"
        style={{
          width: tileSize,
          height: tileSize,
          backgroundColor: tint + '18',
        }}
      >
        <Ionicons name={icon} size={iconSize} color={tint} />
      </View>
      <Text
        className={`${isSm ? 'text-[10.5px]' : 'text-[11.5px]'} text-ink-soft font-semibold text-center`}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
})
