import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BEAUTY_CATEGORIES } from '../../constants/data';
import { providersAPI } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { LoadingState, EmptyState } from '../../components/common/ScreenStates';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import ProviderCard from '../../components/common/ProviderCard';

const FILTERS = [
  { id: 'all', label: '✨ All' },
  { id: 'nearest', label: '📍 Nearest' },
  { id: 'home', label: '🏠 Home Service' },
  { id: 'salon', label: '💈 Salon Visit' },
  { id: 'express', label: '⚡ Express (2hrs)' },
];

export default function BeautyHomeScreen({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const { coords, refreshLocation, areaName } = useLocation();
  const { user } = useAuth();

  // Use coords from GPS, or from user profile as fallback
  const userLat = coords?.lat || user?.lat;
  const userLng = coords?.lng || user?.lng;

  useEffect(() => {
    loadProviders();
  }, [userLat, userLng]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setProviders(allProviders);
    } else if (activeFilter === 'home') {
      setProviders(allProviders.filter(p => p.offers_home_service));
    } else if (activeFilter === 'salon') {
      setProviders(allProviders.filter(p => p.offers_salon_service));
    } else if (activeFilter === 'nearest') {
      setProviders([...allProviders].sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999)));
    } else if (activeFilter === 'express') {
      setProviders(allProviders.filter(p => p.rating >= 4.5));
    }
  }, [activeFilter, allProviders]);

  const loadProviders = async () => {
    try {
      const params = {};
      if (userLat && userLng) {
        params.lat = userLat;
        params.lng = userLng;
        params.radius_km = 20; // Generous radius for Nigerian cities
        params.sort = 'distance';
      } else {
        // No GPS — fall back to city-based filtering
        if (user?.city) params.city = user.city;
        params.sort = 'rating';
      }
      const res = await providersAPI.list(params);
      const data = res.data || [];
      setAllProviders(data);
      setProviders(data);
    } catch (err) {
      console.log('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Fixed teal header - stays above scroll */}
      <View
        className="bg-teal px-6 pb-5"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Beauty Services</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text className="text-white/60 text-sm text-center">
          Book top professionals near you
        </Text>

        {/* Search Bar */}
        <TouchableOpacity
          className="flex-row items-center bg-white/15 rounded-2xl px-4 py-3.5 mt-4 gap-2.5"
          onPress={() => navigation.navigate('ProvidersList', { title: 'Search Providers', search: true })}
        >
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
          <Text className="text-sm text-white/50">Search services or providers...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 16, paddingBottom: 8 }}
        >
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className={`px-5 py-2.5 rounded-full ${
                activeFilter === item.id ? 'bg-teal' : 'bg-gray-100'
              }`}
              style={activeFilter === item.id ? {
                shadowColor: '#35615D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 6,
              } : undefined}
              onPress={() => setActiveFilter(item.id)}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeFilter === item.id ? 'text-white' : 'text-gray-500'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Location banner */}
        {!userLat && !userLng && (
          <TouchableOpacity
            className="flex-row items-center gap-2.5 mx-6 mt-3 px-4 py-3 rounded-xl bg-orange-light/30 border border-orange/20"
            onPress={async () => {
              await refreshLocation();
            }}
          >
            <Ionicons name="location" size={16} color="#FD8950" />
            <Text className="text-xs text-orange font-semibold flex-1">
              Enable location for nearby results
            </Text>
            <Text className="text-[10px] text-orange/70 font-medium">Turn On</Text>
          </TouchableOpacity>
        )}

        {/* Categories */}
        <View className="mt-4">
          <SectionHeader title="Services" />
        </View>
        <View className="flex-row flex-wrap px-6 gap-4 mb-6 justify-between">
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
          title={`Top Rated${activeFilter !== 'all' ? ` (${providers.length})` : ' Providers'}`}
          onAction={() => navigation.navigate('ProvidersList', { title: 'All Providers' })}
        />
        {loading ? (
          <LoadingState message="Loading providers..." />
        ) : providers.length > 0 ? (
          <View className="px-6 gap-3.5">
            {providers.map((item) => (
              <ProviderCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="search-outline" title="No providers found" subtitle="Try a different filter to see more results." />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
