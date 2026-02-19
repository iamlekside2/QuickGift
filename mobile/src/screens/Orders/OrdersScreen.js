import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const MOCK_ORDERS = [
  { id: '1', type: 'gift', item: 'Red Velvet Cake', status: 'delivered', date: '15 Feb', price: 15000, vendor: 'Sweet Treats Lagos' },
  { id: '2', type: 'beauty', item: 'Gel Nails (Full Set)', status: 'confirmed', date: '20 Feb', price: 8000, provider: 'Amara Nails' },
  { id: '3', type: 'gift', item: 'Rose Bouquet', status: 'in_transit', date: '19 Feb', price: 25000, vendor: 'Bloom Nigeria' },
  { id: '4', type: 'beauty', item: 'Makeup Session', status: 'pending', date: '22 Feb', price: 15000, provider: 'Tolu MUA' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: '#6366F1', icon: 'checkmark-circle-outline' },
  in_transit: { label: 'In Transit', color: '#3B82F6', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', color: '#10B981', icon: 'checkmark-done-outline' },
};

export default function OrdersScreen({ navigation }) {
  const [tab, setTab] = useState('all');

  const filtered = tab === 'all' ? MOCK_ORDERS :
    tab === 'gifts' ? MOCK_ORDERS.filter(o => o.type === 'gift') :
    MOCK_ORDERS.filter(o => o.type === 'beauty');

  const formatPrice = (price) => '₦' + price.toLocaleString();

  const renderOrder = ({ item }) => {
    const status = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardEmoji}>{item.type === 'gift' ? '🎁' : '💅'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.item}</Text>
          <Text style={styles.cardSub}>{item.vendor || item.provider}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardDate}>{item.date}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
              <Ionicons name={status.icon} size={12} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <View style={styles.tabs}>
        {[
          { key: 'all', label: 'All' },
          { key: 'gifts', label: 'Gifts' },
          { key: 'beauty', label: 'Beauty' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderOrder}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.md },
  title: { fontSize: FONTS.sizes.title, fontWeight: '800', color: COLORS.text },
  tabs: {
    flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tab: {
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full, backgroundColor: COLORS.backgroundGray,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.textWhite },
  list: { paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, ...SHADOWS.sm,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.backgroundLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 22 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 2 },
  cardDate: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full,
  },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  cardPrice: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary },
});
