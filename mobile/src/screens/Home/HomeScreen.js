import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { BEAUTY_CATEGORIES } from '../../constants/data';
import { productsAPI, providersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import GiftCard from '../../components/common/GiftCard';
import ProviderCard from '../../components/common/ProviderCard';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [occasions, setOccasions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredGifts, setFeaturedGifts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [occasionsRes, categoriesRes, giftsRes, providersRes] = await Promise.allSettled([
        productsAPI.occasions(),
        productsAPI.categories(),
        productsAPI.list({ featured: true, per_page: 6 }),
        providersAPI.list({ sort: 'rating' }),
      ]);

      if (occasionsRes.status === 'fulfilled') setOccasions(occasionsRes.value.data);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data);
      if (giftsRes.status === 'fulfilled') setFeaturedGifts(giftsRes.value.data.items || []);
      if (providersRes.status === 'fulfilled') setProviders(providersRes.value.data || []);
    } catch (err) {
      console.log('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const userName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello {userName}! 👋</Text>
          <Text style={styles.location}>
            <Ionicons name="location" size={14} color={COLORS.primary} /> {user?.city || 'Lagos'}, Nigeria
          </Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <Text style={styles.searchPlaceholder}>Search gifts, services, vendors...</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: COLORS.primary + '15' }]}
          onPress={() => navigation.navigate('Gifts')}
        >
          <Text style={styles.quickActionIcon}>🎁</Text>
          <Text style={styles.quickActionTitle}>Send a Gift</Text>
          <Text style={styles.quickActionSub}>Cakes, flowers & more</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: '#7C3AED' + '15' }]}
          onPress={() => navigation.navigate('Beauty')}
        >
          <Text style={styles.quickActionIcon}>💅</Text>
          <Text style={styles.quickActionTitle}>Book Beauty</Text>
          <Text style={styles.quickActionSub}>Nails, hair, makeup</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Occasions */}
          {occasions.length > 0 && (
            <>
              <SectionHeader title="Shop by Occasion" />
              <FlatList
                horizontal
                data={occasions}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <CategoryCard
                    label={item.name}
                    icon={item.icon}
                    color={item.color}
                    size="sm"
                    onPress={() => navigation.navigate('Gifts', { screen: 'GiftsList', params: { occasion: item.id, title: item.name } })}
                  />
                )}
              />
            </>
          )}

          {/* Featured Gifts */}
          {featuredGifts.length > 0 && (
            <>
              <SectionHeader title="Popular Gifts" onAction={() => navigation.navigate('Gifts')} />
              <FlatList
                horizontal
                data={featuredGifts}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <GiftCard
                    item={item}
                    onPress={() => navigation.navigate('Gifts', { screen: 'GiftDetail', params: { gift: item } })}
                  />
                )}
              />
            </>
          )}

          {/* Beauty Categories */}
          <SectionHeader title="Beauty Services" onAction={() => navigation.navigate('Beauty')} />
          <FlatList
            horizontal
            data={BEAUTY_CATEGORIES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <CategoryCard
                label={item.label}
                icon={item.icon}
                onPress={() => navigation.navigate('Beauty', { screen: 'ProvidersList', params: { category: item.id } })}
              />
            )}
          />

          {/* Top Providers */}
          {providers.length > 0 && (
            <>
              <SectionHeader title="Top Beauty Pros" onAction={() => navigation.navigate('Beauty')} />
              <View style={styles.providersList}>
                {providers.slice(0, 3).map((item) => (
                  <ProviderCard
                    key={item.id}
                    item={item}
                    onPress={() => navigation.navigate('Beauty', { screen: 'ProviderProfile', params: { provider: item } })}
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  greeting: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  location: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundGray,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  searchPlaceholder: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  quickAction: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  quickActionIcon: {
    fontSize: 32,
  },
  quickActionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickActionSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  horizontalList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  providersList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  bottomSpacer: {
    height: 100,
  },
});
