import React from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { BEAUTY_CATEGORIES, FEATURED_PROVIDERS } from '../../constants/data';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import ProviderCard from '../../components/common/ProviderCard';

export default function BeautyHomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Beauty Services</Text>
        <Text style={styles.subtitle}>Book top professionals near you</Text>
      </View>

      {/* Search */}
      <TouchableOpacity style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <Text style={styles.searchPlaceholder}>Search services or providers...</Text>
      </TouchableOpacity>

      {/* Quick Filters */}
      <FlatList
        horizontal
        data={[
          { id: 'home', label: '🏠 Home Service', active: true },
          { id: 'salon', label: '💈 Salon Visit', active: false },
          { id: 'express', label: '⚡ Express (2hrs)', active: false },
        ]}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, item.active && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, item.active && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Categories */}
      <SectionHeader title="Services" />
      <View style={styles.categoriesGrid}>
        {BEAUTY_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            onPress={() => navigation.navigate('ProvidersList', { category: cat.id, title: cat.label })}
          />
        ))}
      </View>

      {/* Top Providers */}
      <SectionHeader
        title="Top Rated Providers"
        onAction={() => navigation.navigate('ProvidersList', { title: 'All Providers' })}
      />
      <View style={styles.providersList}>
        {FEATURED_PROVIDERS.map((item) => (
          <ProviderCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
          />
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg,
  },
  title: { fontSize: FONTS.sizes.title, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, marginTop: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundGray,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.lg, gap: SPACING.sm,
  },
  searchPlaceholder: { fontSize: FONTS.sizes.md, color: COLORS.textLight },
  filterList: { paddingHorizontal: SPACING.xl, gap: SPACING.sm, marginBottom: SPACING.xxl },
  filterChip: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full, backgroundColor: COLORS.backgroundGray,
  },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: COLORS.textWhite },
  categoriesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.xl,
    gap: SPACING.lg, marginBottom: SPACING.xxl, justifyContent: 'space-between',
  },
  providersList: { paddingHorizontal: SPACING.xl, gap: SPACING.md },
});
