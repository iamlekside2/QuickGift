import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function ProviderCard({ item, onPress }) {
  const name = item.business_name || item.name || 'Provider';
  const service = item.service_type || item.service || '';
  const reviews = item.review_count ?? item.reviews ?? 0;
  const location = item.location || '';
  const isAvailable = item.is_available ?? item.available ?? false;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {isAvailable && <View style={styles.availableDot} />}
        </View>
        <Text style={styles.service}>{service}</Text>
        <View style={styles.meta}>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating || 0} ({reviews})</Text>
          </View>
          <View style={styles.location}>
            <Ionicons name="location-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </View>
      </View>
      {item.price ? (
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.price}>{'₦' + item.price.toLocaleString()}</Text>
        </View>
      ) : (
        <View style={styles.priceContainer}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  name: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  service: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  price: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
