import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { ordersAPI, bookingsAPI } from '../../services/api';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: '#6366F1', icon: 'checkmark-circle-outline' },
  in_transit: { label: 'In Transit', color: '#3B82F6', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', color: '#10B981', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
  completed: { label: 'Completed', color: '#10B981', icon: 'checkmark-done-outline' },
};

export default function OrdersScreen({ navigation }) {
  const [tab, setTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, bookingsRes] = await Promise.allSettled([
        ordersAPI.list(),
        bookingsAPI.list(),
      ]);

      if (ordersRes.status === 'fulfilled') {
        const ordersList = ordersRes.value.data?.items || ordersRes.value.data || [];
        setOrders(ordersList.map((o) => ({ ...o, _type: 'gift' })));
      }
      if (bookingsRes.status === 'fulfilled') {
        const bookingsList = bookingsRes.value.data?.items || bookingsRes.value.data || [];
        setBookings(bookingsList.map((b) => ({ ...b, _type: 'beauty' })));
      }
    } catch (err) {
      console.log('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const allItems = [...orders, ...bookings].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const filtered = tab === 'all' ? allItems :
    tab === 'gifts' ? orders :
    bookings;

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString();
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
  };

  const renderOrder = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isGift = item._type === 'gift';
    const title = isGift
      ? (item.order_number || `Order #${item.id?.slice(0, 8)}`)
      : (item.service_name || 'Beauty Booking');
    const subtitle = isGift
      ? `${item.items?.length || 0} item(s)`
      : (item.provider_name || 'Provider');

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardEmoji}>{isGift ? '🎁' : '💅'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.cardSub}>{subtitle}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
              <Ionicons name={status.icon} size={12} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardPrice}>{formatPrice(item.total || item.price)}</Text>
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

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
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
              <Text style={styles.emptySubtext}>Your gift orders and beauty bookings will appear here</Text>
            </View>
          }
        />
      )}
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
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: FONTS.sizes.md, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
});
