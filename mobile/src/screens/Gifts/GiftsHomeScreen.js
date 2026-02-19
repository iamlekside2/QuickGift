import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { productsAPI } from '../../services/api';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import GiftCard from '../../components/common/GiftCard';

export default function GiftsHomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [popularGifts, setPopularGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, occRes, giftsRes] = await Promise.allSettled([
        productsAPI.categories(),
        productsAPI.occasions(),
        productsAPI.list({ sort: 'popular', per_page: 8 }),
      ]);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      if (occRes.status === 'fulfilled') setOccasions(occRes.value.data);
      if (giftsRes.status === 'fulfilled') setPopularGifts(giftsRes.value.data.items || []);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Send a Gift</Text>
        <Text style={styles.subtitle}>Make someone's day special</Text>
      </View>

      <TouchableOpacity style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <Text style={styles.searchPlaceholder}>Search gifts...</Text>
      </TouchableOpacity>

      {categories.length > 0 && (
        <>
          <SectionHeader title="Categories" />
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                label={cat.name}
                icon={cat.icon}
                onPress={() => navigation.navigate('GiftsList', { category: cat.id, title: cat.name })}
              />
            ))}
          </View>
        </>
      )}

      {occasions.length > 0 && (
        <>
          <SectionHeader title="By Occasion" />
          <FlatList
            horizontal
            data={occasions}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.occasionChip, { backgroundColor: (item.color || '#FF6B6B') + '15' }]}
                onPress={() => navigation.navigate('GiftsList', { title: item.name })}
              >
                <Text style={styles.occasionIcon}>{item.icon}</Text>
                <Text style={[styles.occasionLabel, { color: item.color || '#FF6B6B' }]}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {popularGifts.length > 0 && (
        <>
          <SectionHeader title="Popular Gifts" onAction={() => navigation.navigate('GiftsList', { title: 'All Gifts' })} />
          <FlatList
            horizontal
            data={popularGifts}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <GiftCard
                item={item}
                onPress={() => navigation.navigate('GiftDetail', { gift: item })}
              />
            )}
          />
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
  title: { fontSize: FONTS.sizes.title, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, marginTop: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundGray,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.xxl, gap: SPACING.sm,
  },
  searchPlaceholder: { fontSize: FONTS.sizes.md, color: COLORS.textLight },
  categoriesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.xl,
    gap: SPACING.lg, marginBottom: SPACING.xxl, justifyContent: 'space-between',
  },
  horizontalList: { paddingHorizontal: SPACING.xl, gap: SPACING.md, marginBottom: SPACING.xxl },
  occasionChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.full, gap: SPACING.xs,
  },
  occasionIcon: { fontSize: 16 },
  occasionLabel: { fontSize: FONTS.sizes.md, fontWeight: '600' },
});
