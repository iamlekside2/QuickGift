import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SectionHeader({ title, actionText = 'See All', onAction }) {
  return (
    <View className="flex-row justify-between items-center px-5 mb-3.5">
      <Text className="text-[17px] font-bold text-gray-800">{title}</Text>
      {onAction && (
        <TouchableOpacity onPress={onAction} className="flex-row items-center gap-0.5">
          <Text className="text-[13px] text-teal font-semibold">{actionText}</Text>
          <Ionicons name="chevron-forward" size={14} color="#35615D" />
        </TouchableOpacity>
      )}
    </View>
  );
}
