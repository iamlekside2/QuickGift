import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { productsAPI } from '../../services/api';

export default function GiftsListScreen({ navigation, route }) {
  const { category, title } = route.params || {};
  const [sortBy, setSortBy] = useState('popular');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGifts();
  }, [sortBy]);

  const loadGifts = async () => {
    setLoading(true);
    try {
      const params = { sort: sortBy, per_page: 50 };
      if (category) params.category_id = category;

      const res = await productsAPI.list(params);
      setGifts(res.data.items || []);
    } catch (err) {
      console.log('Error loading gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => '₦' + price.toLocaleString();

  const renderGift = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('GiftDetail', { gift: item })}
      activeOpacity={0.8}
    >
      <View style={styles.imagePlaceholder}>
        <Text style={styles.emoji}>🎁</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.vendor}>{item.vendor_name}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
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
        {['popular', 'price_asc', 'price_desc', 'rating'].map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortChip, sortBy === sort && styles.sortChipActive]}
            onPress={() => setSortBy(sort)}
          >
            <Text style={[styles.sortText, sortBy === sort && styles.sortTextActive]}>
              {sort === 'popular' ? 'Popular' :
               sort === 'price_asc' ? 'Price ↑' :
               sort === 'price_desc' ? 'Price ↓' : 'Top Rated'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={gifts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderGift}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 48 }}>🎁</Text>
              <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>No gifts found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.backgroundGray,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  filterBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.backgroundGray,
    alignItems: 'center', justifyContent: 'center',
  },
  sortRow: { flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.sm, marginBottom: SPACING.lg },
  sortChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.backgroundGray },
  sortChipActive: { backgroundColor: COLORS.primary },
  sortText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '500' },
  sortTextActive: { color: COLORS.textWhite },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },
  row2: { gap: SPACING.md, marginBottom: SPACING.md },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.sm },
  imagePlaceholder: { height: 120, backgroundColor: COLORS.backgroundLight, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 40 },
  info: { padding: SPACING.md, gap: 4 },
  name: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  vendor: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
});
