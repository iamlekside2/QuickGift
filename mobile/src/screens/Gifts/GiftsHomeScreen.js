import React from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { GIFT_CATEGORIES, OCCASIONS, FEATURED_GIFTS } from '../../constants/data';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import GiftCard from '../../components/common/GiftCard';

export default function GiftsHomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Send a Gift</Text>
        <Text style={styles.subtitle}>Make someone's day special</Text>
      </View>

      {/* Search */}
      <TouchableOpacity style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <Text style={styles.searchPlaceholder}>Search gifts...</Text>
      </TouchableOpacity>

      {/* Categories */}
      <SectionHeader title="Categories" />
      <View style={styles.categoriesGrid}>
        {GIFT_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            onPress={() => navigation.navigate('GiftsList', { category: cat.id, title: cat.label })}
          />
        ))}
      </View>

      {/* Occasions */}
      <SectionHeader title="By Occasion" />
      <FlatList
        horizontal
        data={OCCASIONS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.occasionChip, { backgroundColor: item.color + '15' }]}
            onPress={() => navigation.navigate('GiftsList', { occasion: item.id, title: item.label })}
          >
            <Text style={styles.occasionIcon}>{item.icon}</Text>
            <Text style={[styles.occasionLabel, { color: item.color }]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Featured */}
      <SectionHeader title="Popular Gifts" onAction={() => navigation.navigate('GiftsList', { title: 'All Gifts' })} />
      <FlatList
        horizontal
        data={FEATURED_GIFTS}
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

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginTop: 4,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
    justifyContent: 'space-between',
  },
  horizontalList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  occasionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  occasionIcon: {
    fontSize: 16,
  },
  occasionLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
});
