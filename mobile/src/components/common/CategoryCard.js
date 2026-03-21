import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

export default React.memo(function CategoryCard({ label, icon, color, onPress, size = 'md' }) {
  const isSm = size === 'sm';

  return (
    <TouchableOpacity
      className={`items-center ${isSm ? 'w-[72px]' : 'w-[85px]'} gap-2`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        className={`${isSm ? 'w-[56px] h-[56px]' : 'w-[64px] h-[64px]'} rounded-2xl items-center justify-center`}
        style={{
          backgroundColor: (color || '#35615D') + '12',
          shadowColor: color || '#35615D',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Text style={{ fontSize: isSm ? 24 : 28 }}>{icon}</Text>
      </View>
      <Text
        className={`${isSm ? 'text-[10px]' : 'text-[11px]'} text-gray-700 font-semibold text-center`}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
})
