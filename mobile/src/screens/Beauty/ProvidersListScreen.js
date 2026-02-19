import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { providersAPI } from '../../services/api';
import ProviderCard from '../../components/common/ProviderCard';

export default function ProvidersListScreen({ navigation, route }) {
  const { category, title } = route.params || {};
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const params = {};
      if (category) params.service_type = category;
      const res = await providersAPI.list(params);
      setProviders(res.data?.items || res.data || []);
    } catch (err) {
      console.log('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'Available Now', 'Home Service', 'Top Rated'];

  const filteredProviders = providers.filter((p) => {
    if (activeFilter === 'Available Now') return p.is_available;
    if (activeFilter === 'Home Service') return p.offers_home_service;
    if (activeFilter === 'Top Rated') return p.rating >= 4.5;
    return true;
  });

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
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredProviders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProviderCard
              item={item}
              onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💈</Text>
              <Text style={styles.emptyText}>No providers found</Text>
            </View>
          }
        />
      )}
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
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary },
});
