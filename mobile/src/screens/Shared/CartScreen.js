import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Button from '../../components/common/Button';

const MOCK_CART = [
  { id: '1', name: 'Red Velvet Cake', price: 15000, quantity: 1, type: 'gift', emoji: '🎂' },
  { id: '2', name: 'Gel Nails (Full Set)', price: 8000, quantity: 1, type: 'beauty', emoji: '💅' },
];

export default function CartScreen({ navigation }) {
  const formatPrice = (price) => '₦' + price.toLocaleString();
  const subtotal = MOCK_CART.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 1500;
  const total = subtotal + deliveryFee;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({MOCK_CART.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {MOCK_CART.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemIcon}>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemType}>{item.type === 'gift' ? 'Gift' : 'Beauty Service'}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              <TouchableOpacity>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <TouchableOpacity style={styles.addressCard}>
          <Ionicons name="location-outline" size={22} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressTitle}>Delivery Address</Text>
            <Text style={styles.addressSub}>Tap to add delivery address</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={`Pay ${formatPrice(total)}`}
          onPress={() => {}}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
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
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  content: { paddingHorizontal: SPACING.xl, paddingBottom: 120 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  itemIcon: {
    width: 52, height: 52, borderRadius: RADIUS.lg, backgroundColor: COLORS.backgroundLight,
    alignItems: 'center', justifyContent: 'center',
  },
  itemEmoji: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  itemType: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  itemRight: { alignItems: 'flex-end', gap: SPACING.sm },
  itemPrice: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  summary: {
    backgroundColor: COLORS.backgroundGray, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginTop: SPACING.md, gap: SPACING.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border },
  totalLabel: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  addressCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    marginTop: SPACING.lg, ...SHADOWS.sm,
  },
  addressTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  addressSub: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  bottomBar: {
    padding: SPACING.xl, paddingBottom: 34,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
});
