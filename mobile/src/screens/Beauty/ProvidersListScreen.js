import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { FEATURED_PROVIDERS } from '../../constants/data';
import ProviderCard from '../../components/common/ProviderCard';

export default function ProvidersListScreen({ navigation, route }) {
  const { category, title } = route.params || {};
  const [viewMode, setViewMode] = useState('list');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Providers'}</Text>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['All', 'Available Now', 'Home Service', 'Top Rated'].map((filter, i) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, i === 0 && styles.filterActive]}
          >
            <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={FEATURED_PROVIDERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProviderCard
            item={item}
            onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
          />
        )}
      />
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
  viewBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray, alignItems: 'center', justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.backgroundGray,
  },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: COLORS.textWhite },
  list: { paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingBottom: 100 },
});
