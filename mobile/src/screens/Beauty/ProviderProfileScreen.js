import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { providersAPI, reviewsAPI } from '../../services/api';
import Button from '../../components/common/Button';

export default function ProviderProfileScreen({ navigation, route }) {
  const { provider } = route.params || {};
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString();

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      const [svcRes, revRes] = await Promise.allSettled([
        providersAPI.services(provider?.id),
        reviewsAPI.list('provider', provider?.id),
      ]);
      if (svcRes.status === 'fulfilled') setServices(svcRes.value.data || []);
      if (revRes.status === 'fulfilled') setReviews(revRes.value.data || []);
    } catch (err) {
      console.log('Error loading provider data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{provider?.business_name?.charAt(0) || provider?.name?.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{provider?.business_name || provider?.name}</Text>
          <Text style={styles.service}>{provider?.service_type || provider?.service}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{provider?.rating || '4.8'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{provider?.review_count || provider?.reviews || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{provider?.experience || '2yr'}</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
          </View>

          <View style={styles.badges}>
            {provider?.is_verified && (
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>{provider?.city || provider?.location || 'Lagos'}</Text>
            </View>
            {(provider?.is_available || provider?.available) && (
              <View style={[styles.badge, { backgroundColor: COLORS.success + '15' }]}>
                <View style={styles.availDot} />
                <Text style={[styles.badgeText, { color: COLORS.success }]}>Available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services & Pricing</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : services.length > 0 ? (
            services.map((svc, i) => (
              <View key={svc.id || i} style={styles.serviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  <Text style={styles.serviceDuration}>{svc.duration_minutes ? `${svc.duration_minutes}min` : svc.duration}</Text>
                </View>
                <Text style={styles.servicePrice}>{formatPrice(svc.price)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No services listed yet</Text>
          )}
        </View>

        {/* Portfolio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <View style={styles.portfolioGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={styles.portfolioItem}>
                <Text style={styles.portfolioEmoji}>💅</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.length > 0 ? (
            reviews.map((review, i) => (
              <View key={review.id || i} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{review.user_name}</Text>
                  <View style={styles.reviewStars}>
                    {Array(Math.round(review.rating)).fill(0).map((_, j) => (
                      <Ionicons key={j} name="star" size={12} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                {review.comment && <Text style={styles.reviewText}>{review.comment}</Text>}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No reviews yet</Text>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatBtn}>
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Button
          title="Book Now"
          onPress={() => navigation.navigate('Booking', { provider, services })}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { alignItems: 'center', paddingTop: 60, paddingBottom: SPACING.xxl, paddingHorizontal: SPACING.xl },
  backBtn: {
    position: 'absolute', top: 55, left: SPACING.xl, width: 40, height: 40,
    borderRadius: RADIUS.full, backgroundColor: COLORS.backgroundGray,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.primary },
  name: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
  service: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl, gap: SPACING.xl,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  badges: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.backgroundGray,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  badgeText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '500' },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xxl },
  sectionTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.lg,
    backgroundColor: COLORS.backgroundGray, borderRadius: RADIUS.lg, marginBottom: SPACING.sm,
  },
  serviceName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  serviceDuration: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  servicePrice: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.primary },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textLight, textAlign: 'center', paddingVertical: SPACING.lg },
  portfolioGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
  },
  portfolioItem: {
    width: '31%', aspectRatio: 1, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundLight, alignItems: 'center', justifyContent: 'center',
  },
  portfolioEmoji: { fontSize: 28 },
  review: {
    backgroundColor: COLORS.backgroundGray, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.sm,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  reviewName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, lineHeight: 20 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.xl, paddingBottom: 34,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  chatBtn: {
    width: 52, height: 52, borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
});
