import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { providersAPI } from '../../services/api';
import { LoadingState, EmptyState } from '../../components/common/ScreenStates';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import ProviderCard from '../../components/common/ProviderCard';

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

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-6 pb-4"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <TouchableOpacity
          className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">{title || 'Providers'}</Text>
        <TouchableOpacity
          className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-3">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 h-11">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2.5 text-sm text-gray-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search providers..."
            placeholderTextColor="#9CA3AF"
            autoFocus={!!showSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Row */}
      <View className="flex-row px-6 gap-2.5 mb-5">
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            className={`px-4 py-2.5 rounded-full ${
              activeFilter === filter ? 'bg-teal' : 'bg-gray-100'
            }`}
            onPress={() => setActiveFilter(filter)}
            style={activeFilter === filter ? {
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 4,
            } : undefined}
          >
            <Text
              className={`text-xs font-semibold ${
                activeFilter === filter ? 'text-white' : 'text-gray-500'
              }`}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      {!loading && (
        <View className="px-6 mb-3">
          <Text className="text-xs font-medium text-gray-400">
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
          contentContainerStyle={{ paddingHorizontal: 24, gap: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProviderCard
              item={item}
              onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
            />
          )}
          ListEmptyComponent={
            <EmptyState emoji="💈" title="No providers found" subtitle="Try adjusting your filters" />
          }
        />
      )}
    </View>
  );
}
