import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { ordersAPI, paymentsAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const { isAuthenticated, isGuest } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString();
  const deliveryFee = items.length > 0 ? 1500 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (isGuest || !isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to place an order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }

    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const orderData = {
        order_type: 'gift',
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        delivery_city: 'Lagos',
        is_express: false,
      };

      const res = await ordersAPI.create(orderData);
      const order = res.data;

      // Initialize payment
      try {
        const payRes = await paymentsAPI.initialize({
          order_id: order.id,
          amount: order.total,
        });
        // For now, show success since Paystack integration needs a WebView
        Alert.alert(
          'Order Placed! 🎉',
          `Order ${order.order_number} has been created.\nTotal: ${formatPrice(order.total)}`,
          [{ text: 'View Orders', onPress: () => { clearCart(); navigation.navigate('Orders'); } }]
        );
      } catch (payErr) {
        // Payment init failed but order was created
        Alert.alert(
          'Order Created',
          `Order ${order.order_number} created but payment setup failed. You can pay later from your orders.`,
          [{ text: 'View Orders', onPress: () => { clearCart(); navigation.navigate('Orders'); } }]
        );
      }
    } catch (err) {
      Alert.alert('Order Failed', err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 56, marginBottom: SPACING.md }}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtext}>Add some gifts to get started!</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('GiftsTab')}
        >
          <Text style={styles.shopBtnText}>Browse Gifts</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({itemCount})</Text>
        <TouchableOpacity onPress={() => {
          Alert.alert('Clear Cart', 'Remove all items from your cart?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ]);
        }}>
          <Ionicons name="trash-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {items.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemIcon}>
              <Text style={styles.itemEmoji}>{item.emoji || '🎁'}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemType}>{item.vendor_name || 'Gift'}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={16} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Ionicons name="close-circle" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
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
          title={submitting ? 'Placing Order...' : `Pay ${formatPrice(total)}`}
          onPress={handleCheckout}
          disabled={submitting}
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
  itemType: { fontSize: FONTS.sizes.sm, color: COLORS.textLight, marginBottom: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.backgroundGray,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text, minWidth: 20, textAlign: 'center' },
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
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  emptySubtext: { fontSize: FONTS.sizes.md, color: COLORS.textLight, marginTop: 4 },
  shopBtn: {
    marginTop: SPACING.xl, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
  },
  shopBtnText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textWhite },
});
