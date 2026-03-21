import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, TextInput, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productsAPI } from '../../services/api';
import { LoadingState, EmptyState } from '../../components/common/ScreenStates';

const RECENT_SEARCHES_KEY = '@quickgift_recent_searches';

export default function GiftsListScreen({ navigation, route }) {
  const { category, title, search: showSearch } = route.params || {};
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [priceFilter, setPriceFilter] = useState(null); // null, 'under10k', '10k-30k', '30k+'
  const [ratingFilter, setRatingFilter] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((val) => {
      if (val) setRecentSearches(JSON.parse(val).slice(0, 8));
    }).catch(() => {});
  }, []);

  // Debounced search + sort + filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) loadGifts();
    }, 400);
    return () => clearTimeout(timer);
  }, [sortBy, searchQuery, priceFilter, ratingFilter]);

  const saveRecentSearch = async (query) => {
    try {
      const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 8);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => {});
  };

  const loadGifts = async () => {
    setLoading(true);
    try {
      const params = { sort: sortBy, per_page: 50 };
      if (category) params.category_id = category;
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
        saveRecentSearch(searchQuery.trim());
      }
      // Price filter
      if (priceFilter === 'under10k') params.max_price = 10000;
      else if (priceFilter === '10k-30k') { params.min_price = 10000; params.max_price = 30000; }
      else if (priceFilter === '30k+') params.min_price = 30000;
      // Rating filter
      if (ratingFilter) params.min_rating = 4;

      const res = await productsAPI.list(params);
      setGifts(res.data.items || []);
    } catch (err) {
      console.log('Error loading gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => '\u20A6' + price.toLocaleString();

  const sortOptions = [
    { key: 'popular', label: 'Popular' },
    { key: 'price_asc', label: 'Price \u2191' },
    { key: 'price_desc', label: 'Price \u2193' },
    { key: 'rating', label: 'Top Rated' },
  ];

  const renderGift = ({ item }) => (
    <TouchableOpacity
      className="flex-1 bg-white rounded-3xl overflow-hidden mb-4"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
      onPress={() => navigation.navigate('GiftDetail', { gift: item })}
      activeOpacity={0.8}
    >
      <View className="h-32 bg-cream items-center justify-center rounded-t-3xl">
        <Text className="text-[44px]">{'\uD83C\uDF81'}</Text>
      </View>
      <View className="p-3.5 gap-1">
        <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-400">{item.vendor_name}</Text>
        <View className="flex-row justify-between items-center mt-1.5">
          <Text className="text-sm font-extrabold text-teal">{formatPrice(item.price)}</Text>
          <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text className="text-[11px] text-amber-600 font-semibold">{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-4"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <TouchableOpacity
          className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">{title || 'Gifts'}</Text>
        <TouchableOpacity className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center">
          <Ionicons name="options-outline" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-3">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 h-11">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2.5 text-sm text-gray-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search gifts..."
            placeholderTextColor="#9CA3AF"
            autoFocus={!!showSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Recent Searches */}
      {searchFocused && !searchQuery && recentSearches.length > 0 && (
        <View className="px-5 mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-semibold text-gray-400">Recent Searches</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text className="text-xs font-semibold text-orange">Clear</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {recentSearches.map((term, idx) => (
              <TouchableOpacity
                key={idx}
                className="px-3 py-1.5 rounded-full bg-gray-100"
                onPress={() => setSearchQuery(term)}
              >
                <Text className="text-xs text-gray-600">{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }} className="mb-3" style={{ flexGrow: 0 }}>
        {[
          { key: 'under10k', label: 'Under \u20A610k' },
          { key: '10k-30k', label: '\u20A610k-\u20A630k' },
          { key: '30k+', label: '\u20A630k+' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            className={`px-3 py-2 rounded-full ${priceFilter === f.key ? 'bg-orange/10' : 'bg-gray-100'}`}
            onPress={() => setPriceFilter(priceFilter === f.key ? null : f.key)}
          >
            <Text className={`text-xs font-semibold ${priceFilter === f.key ? 'text-orange' : 'text-gray-500'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          className={`px-3 py-2 rounded-full ${ratingFilter ? 'bg-orange/10' : 'bg-gray-100'}`}
          onPress={() => setRatingFilter(!ratingFilter)}
        >
          <Text className={`text-xs font-semibold ${ratingFilter ? 'text-orange' : 'text-gray-500'}`}>
            4+ {'\u2B50'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sort Chips */}
      <View className="flex-row px-5 gap-2.5 mb-5">
        {sortOptions.map((sort) => (
          <TouchableOpacity
            key={sort.key}
            className={`px-4 py-2.5 rounded-full ${
              sortBy === sort.key ? 'bg-teal' : 'bg-gray-100'
            }`}
            style={
              sortBy === sort.key
                ? {
                    shadowColor: '#35615D',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 3,
                  }
                : {}
            }
            onPress={() => setSortBy(sort.key)}
          >
            <Text
              className={`text-[13px] font-semibold ${
                sortBy === sort.key ? 'text-white' : 'text-gray-500'
              }`}
            >
              {sort.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gift Grid */}
      {loading ? (
        <LoadingState message="Loading gifts..." />
      ) : (
        <FlatList
          data={gifts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14, marginBottom: 2 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderGift}
          ListEmptyComponent={
            <EmptyState emoji={'\uD83C\uDF81'} title="No gifts found" subtitle="We couldn't find any gifts matching your criteria. Try a different filter or category." />
          }
        />
      )}
    </View>
  );
}
