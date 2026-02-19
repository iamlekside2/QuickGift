import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Button from '../../components/common/Button';

export default function GiftDetailScreen({ navigation, route }) {
  const { gift } = route.params || {};
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  const formatPrice = (price) => '₦' + price.toLocaleString();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartBtn}>
            <Ionicons name="heart-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.imageEmoji}>
            {gift?.category === 'cakes' ? '🎂' :
             gift?.category === 'flowers' ? '💐' :
             gift?.category === 'chocolates' ? '🍫' : '🎁'}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Info */}
          <Text style={styles.name}>{gift?.name}</Text>
          <Text style={styles.vendor}>by {gift?.vendor}</Text>

          <View style={styles.metaRow}>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{gift?.rating} ({gift?.reviews} reviews)</Text>
            </View>
            <View style={styles.deliveryBadge}>
              <Ionicons name="bicycle-outline" size={14} color={COLORS.success} />
              <Text style={styles.deliveryText}>Same-day delivery</Text>
            </View>
          </View>

          <Text style={styles.price}>{formatPrice(gift?.price || 0)}</Text>

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add a Personal Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Write a heartfelt message..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          {/* Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Options</Text>
            <TouchableOpacity style={styles.option}>
              <Ionicons name="gift-outline" size={20} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Anonymous Delivery</Text>
                <Text style={styles.optionSub}>Hide your name from the recipient</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.option}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Schedule Delivery</Text>
                <Text style={styles.optionSub}>Pick a date and time</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.option}>
              <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Proof of Joy</Text>
                <Text style={styles.optionSub}>Get a photo when gift is received</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatPrice((gift?.price || 0) * quantity)}</Text>
        </View>
        <Button
          title="Add to Cart"
          onPress={() => navigation.navigate('Cart')}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  imageSection: {
    height: 280,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute', top: 55, left: SPACING.xl, width: 40, height: 40,
    borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  heartBtn: {
    position: 'absolute', top: 55, right: SPACING.xl, width: 40, height: 40,
    borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  imageEmoji: { fontSize: 80 },
  content: { padding: SPACING.xl, gap: SPACING.sm },
  name: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
  vendor: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginTop: SPACING.xs },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deliveryText: { fontSize: FONTS.sizes.sm, color: COLORS.success, fontWeight: '500' },
  price: { fontSize: FONTS.sizes.title, fontWeight: '800', color: COLORS.primary, marginTop: SPACING.sm },
  section: { marginTop: SPACING.lg, gap: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  qtyBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray, alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.text },
  messageInput: {
    backgroundColor: COLORS.backgroundGray, borderRadius: RADIUS.lg,
    padding: SPACING.lg, fontSize: FONTS.sizes.md, color: COLORS.text, minHeight: 80,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.backgroundGray, borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  optionTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  optionSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
    padding: SPACING.xl, paddingBottom: 34,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  totalLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  totalPrice: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
});
