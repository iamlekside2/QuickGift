import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { providersAPI } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import ProviderCard from '../../components/common/ProviderCard';

export default function ProvidersListScreen({ navigation, route }) {
  const { category, title } = route.params || {};
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [activeFilter, setActiveFilter] = useState('All');
  const { coords } = useLocation();
  const { user } = useAuth();

  const userLat = coords?.lat || user?.lat;
  const userLng = coords?.lng || user?.lng;

  useEffect(() => {
    loadProviders();
  }, [userLat, userLng]);

  const loadProviders = async () => {
    try {
      const params = {};
      if (category) params.service_type = category;
      if (userLat && userLng) {
        params.lat = userLat;
        params.lng = userLng;
        params.radius_km = 15;
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
        <ActivityIndicator size="large" color="#35615D" style={{ marginTop: 40 }} />
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
            <View className="items-center pt-20">
              <Text className="text-5xl mb-4">💈</Text>
              <Text className="text-lg font-semibold text-gray-400">No providers found</Text>
              <Text className="text-sm text-gray-300 mt-1">Try adjusting your filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
