import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
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
import { iconFor } from '../../utils/categoryIcons';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'nearest', label: 'Nearest' },
  { id: 'home', label: 'Home Service' },
  { id: 'salon', label: 'Studio Visit' },
  { id: 'express', label: 'Express (2h)' },
];

export default function BeautyHomeScreen({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const { coords, refreshLocation } = useLocation();
  const { user } = useAuth();

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
        params.radius_km = 5;
        params.sort = 'distance';

        let res = await providersAPI.list(params);
        let data = res.data || [];
        if (data.length < 3) { params.radius_km = 10; res = await providersAPI.list(params); data = res.data || []; }
        if (data.length < 3) { params.radius_km = 20; res = await providersAPI.list(params); data = res.data || []; }

        setAllProviders(data);
        setProviders(data);
      } else {
        params.sort = 'rating';
        const res = await providersAPI.list(params);
        const data = res.data || [];
        setAllProviders(data);
        setProviders(data);
      }
    } catch (err) {
      console.log('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const canGoBack = navigation.canGoBack();

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="light" />

      {/* Teal header */}
      <View
        className="bg-teal px-5"
        style={{ paddingTop: Platform.OS === 'ios' ? 56 : 38, paddingBottom: 30, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <View className="flex-row items-center justify-between">
          {canGoBack ? (
            <TouchableOpacity
              className="w-10 h-10 rounded-[14px] bg-white/15 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
          <Text className="text-[19px] font-bold text-white">Book a Pro</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Floating search */}
      <View className="px-5" style={{ marginTop: -16 }}>
        <TouchableOpacity
          className="flex-row items-center bg-white gap-3"
          style={{
            height: 52, borderRadius: 16, paddingHorizontal: 16,
            shadowColor: '#1F4A45', shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.1, shadowRadius: 30, elevation: 6,
          }}
          onPress={() => navigation.navigate('ProvidersList', { title: 'Search Providers', search: true })}
          activeOpacity={0.85}
        >
          <Ionicons name="search" size={19} color="#9A948A" />
          <Text className="flex-1 text-[14px] text-ink-placeholder">Search services or providers…</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 18, paddingBottom: 8 }}
        >
          {FILTERS.map((item) => {
            const active = activeFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                className={`px-5 rounded-full items-center justify-center border-[1.5px] ${
                  active ? 'bg-teal border-teal' : 'bg-white border-line-border'
                }`}
                style={{ height: 40 }}
                onPress={() => setActiveFilter(item.id)}
                activeOpacity={0.85}
              >
                <Text className={`text-[13px] font-bold ${active ? 'text-white' : 'text-ink-soft'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Location banner */}
        {!userLat && !userLng && (
          <TouchableOpacity
            className="flex-row items-center gap-2.5 mx-5 mt-3 px-4 py-3 rounded-[14px] bg-orange-light"
            onPress={async () => { await refreshLocation(); }}
          >
            <Ionicons name="location" size={16} color="#E8632F" />
            <Text className="text-xs text-orange-dark font-bold flex-1">
              Enable location for nearby results
            </Text>
            <Text className="text-[10px] text-orange-dark/70 font-bold">Turn On</Text>
          </TouchableOpacity>
        )}

        {/* Categories */}
        <View className="mt-5">
          <SectionHeader title="Categories" />
        </View>
        <View className="flex-row flex-wrap px-5 gap-y-5 mb-6" style={{ justifyContent: 'space-between' }}>
          {BEAUTY_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              label={cat.label}
              icon={iconFor(cat)}
              color={cat.color}
              onPress={() => navigation.navigate('ProvidersList', { category: cat.id, title: cat.label })}
            />
          ))}
        </View>

        {/* Top Providers */}
        <SectionHeader
          title={`Top Rated${activeFilter !== 'all' ? ` (${providers.length})` : ' Pros'}`}
          onAction={() => navigation.navigate('ProvidersList', { title: 'All Providers' })}
        />
        {loading ? (
          <LoadingState message="Loading providers…" />
        ) : providers.length > 0 ? (
          <View className="px-5 gap-3.5">
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
