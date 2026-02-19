import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { FEATURED_GIFTS } from '../../constants/data';

export default function GiftsListScreen({ navigation, route }) {
  const { category, occasion, title } = route.params || {};
  const [sortBy, setSortBy] = useState('popular');

  const gifts = FEATURED_GIFTS;

  const formatPrice = (price) => '₦' + price.toLocaleString();

  const renderGift = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('GiftDetail', { gift: item })}
      activeOpacity={0.8}
    >
      <View style={styles.imagePlaceholder}>
        <Text style={styles.emoji}>
          {item.category === 'cakes' ? '🎂' :
           item.category === 'flowers' ? '💐' :
           item.category === 'chocolates' ? '🍫' :
           item.category === 'hampers' ? '🧺' : '🎁'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.vendor}>{item.vendor}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating} ({item.reviews})</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Gifts'}</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.sortRow}>
        {['popular', 'price_low', 'price_high', 'rating'].map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortChip, sortBy === sort && styles.sortChipActive]}
            onPress={() => setSortBy(sort)}
          >
            <Text style={[styles.sortText, sortBy === sort && styles.sortTextActive]}>
              {sort === 'popular' ? 'Popular' :
               sort === 'price_low' ? 'Price ↑' :
               sort === 'price_high' ? 'Price ↓' : 'Top Rated'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={gifts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderGift}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sortChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
  },
  sortText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sortTextActive: {
    color: COLORS.textWhite,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  row2: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  info: {
    padding: SPACING.md,
    gap: 4,
  },
  name: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  vendor: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.primary,
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
});
