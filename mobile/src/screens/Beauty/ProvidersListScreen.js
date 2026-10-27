import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, TextInput, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { providersAPI } from '../../services/api';
import { LoadingState, EmptyState } from '../../components/common/ScreenStates';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import ProviderCard from '../../components/common/ProviderCard';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function ProvidersListScreen({ navigation, route }) {
  const { category, title, search: showSearch } = route.params || {};
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { coords } = useLocation();
  const { user } = useAuth();

  const userLat = coords?.lat || user?.lat;
  const userLng = coords?.lng || user?.lng;

  // Debounced search + location change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) loadProviders();
    }, 400);
    return () => clearTimeout(timer);
  }, [userLat, userLng, searchQuery]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.service_type = category;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (userLat && userLng) {
        params.lat = userLat;
        params.lng = userLng;
        params.radius_km = 5; // Tight radius — same area first
        params.sort = 'distance';
      }
      const res = await providersAPI.list(params);
      setProviders(res.data?.items || res.data || []);
    } catch (err) {
      console.log('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'Nearest', 'Available Now', 'Home Service', 'Top Rated'];

  const filteredProviders = (() => {
    let filtered = providers;
    if (activeFilter === 'Available Now') filtered = providers.filter(p => p.is_available);
    else if (activeFilter === 'Home Service') filtered = providers.filter(p => p.offers_home_service);
    else if (activeFilter === 'Top Rated') filtered = providers.filter(p => p.rating >= 4.5);
    else if (activeFilter === 'Nearest') filtered = [...providers].sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
    return filtered;
  })();

  const canGoBack = navigation.canGoBack();

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="dark" />
      {/* Header */}
      <ScreenHeader
        variant="stack"
        title={title || 'Providers'}
        showBack={canGoBack}
        onBack={() => navigation.goBack()}
        right={(
          <TouchableOpacity
            className="w-10 h-10 rounded-[14px] items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={20} color="#211F1C" />
          </TouchableOpacity>
        )}
      />

      {/* Search Bar */}
      <View className="px-5 mt-4 mb-3">
        <View className="flex-row items-center bg-white border-[1.5px] border-line-border rounded-[16px] px-4 h-[52px]">
          <Ionicons name="search" size={18} color="#9A948A" />
          <TextInput
            className="flex-1 ml-2.5 text-sm text-gray-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search providers..."
            placeholderTextColor="#9A948A"
            autoFocus={!!showSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9A948A" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 4 }}
        className="mb-4"
        style={{ flexGrow: 0 }}
      >
        {filters.map((filter) => {
          const active = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              className={`px-5 rounded-full items-center justify-center border-[1.5px] ${
                active ? 'bg-teal border-teal' : 'bg-white border-line-border'
              }`}
              style={{ height: 40 }}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.85}
            >
              <Text className={`text-[13px] font-bold ${active ? 'text-white' : 'text-ink-soft'}`}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results Count */}
      {!loading && (
        <View className="px-5 mb-3">
          <Text className="text-xs font-semibold text-ink-caption">
            {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Provider List */}
      {loading ? (
        <LoadingState message="Finding providers..." />
      ) : (
        <FlatList
          data={filteredProviders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProviderCard
              item={item}
              onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="cut-outline" title="No providers found" subtitle="Try adjusting your filters" />
          }
        />
      )}
    </View>
  );
}
