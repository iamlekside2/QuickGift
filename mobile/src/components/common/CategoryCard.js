import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function CategoryCard({ label, icon, color, onPress, size = 'md' }) {
  return (
    <TouchableOpacity
      style={[styles.container, size === 'sm' && styles.containerSm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: (color || COLORS.primary) + '15' }]}>
        <Text style={[styles.icon, size === 'sm' && styles.iconSm]}>{icon}</Text>
      </View>
      <Text style={[styles.label, size === 'sm' && styles.labelSm]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 85,
    gap: SPACING.sm,
  },
  containerSm: {
    width: 70,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
    backgroundColor: COLORS.backgroundGray,
  },
  icon: {
    fontSize: 28,
  },
  iconSm: {
    fontSize: 22,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelSm: {
    fontSize: FONTS.sizes.xs,
  },
});
