import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI } from '../../services/api';
import { LoadingState } from '../../components/common/ScreenStates';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import GiftCard from '../../components/common/GiftCard';
import { iconFor, colorFor } from '../../utils/categoryIcons';

export default function GiftsHomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [popularGifts, setPopularGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, occRes, giftsRes] = await Promise.allSettled([
        productsAPI.categories(),
        productsAPI.occasions(),
        productsAPI.list({ sort: 'popular', per_page: 8 }),
      ]);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      if (occRes.status === 'fulfilled') setOccasions(occRes.value.data);
      if (giftsRes.status === 'fulfilled') setPopularGifts(giftsRes.value.data.items || []);
    } catch (err) {
      console.log('Error:', err);
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
          <Text className="text-[19px] font-bold text-white">Send a Gift</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Floating search bar overlapping the header */}
      <View className="px-5" style={{ marginTop: -16 }}>
        <TouchableOpacity
          className="flex-row items-center bg-white gap-3"
          style={{
            height: 52, borderRadius: 16, paddingHorizontal: 16,
            shadowColor: '#1F4A45', shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.1, shadowRadius: 30, elevation: 6,
          }}
          onPress={() => navigation.navigate('GiftsList', { title: 'Search', search: true })}
          activeOpacity={0.85}
        >
          <Ionicons name="search" size={19} color="#9A948A" />
          <Text className="flex-1 text-[14px] text-ink-placeholder">Search gifts…</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState message="Loading gifts…" />
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="mt-6">
            {/* Categories — 3-per-row grid */}
            {categories.length > 0 && (
              <>
                <SectionHeader title="Shop by Category" />
                <View className="flex-row flex-wrap px-5 gap-y-5 mb-7" style={{ justifyContent: 'space-between' }}>
                  {categories.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      label={cat.name}
                      icon={iconFor(cat)}
                      color={cat.color && !/^#(35|2a|fd|e5)/i.test(cat.color) ? cat.color : '#1F4A45'}
                      onPress={() => navigation.navigate('GiftsList', { category: cat.id, title: cat.name })}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Occasions — pill chips */}
            {occasions.length > 0 && (
              <>
                <SectionHeader title="Shop by Occasion" />
                <FlatList
                  horizontal
                  data={occasions}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}
                  renderItem={({ item, index }) => {
                    const tint = colorFor(index);
                    return (
                      <TouchableOpacity
                        className="flex-row items-center px-4 py-2.5 rounded-full gap-2"
                        style={{ backgroundColor: tint + '18' }}
                        onPress={() => navigation.navigate('GiftsList', { occasion: item.id, title: item.name })}
                        activeOpacity={0.85}
                      >
                        <Ionicons name={iconFor(item)} size={16} color={tint} />
                        <Text className="text-[13px] font-bold" style={{ color: tint }}>{item.name}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            )}

            {/* Popular Gifts */}
            {popularGifts.length > 0 && (
              <>
                <SectionHeader title="Popular Gifts" onAction={() => navigation.navigate('GiftsList', { title: 'All Gifts' })} />
                <FlatList
                  horizontal
                  data={popularGifts}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 14, marginBottom: 24 }}
                  renderItem={({ item }) => (
                    <GiftCard
                      item={item}
                      onPress={() => navigation.navigate('GiftDetail', { gift: item })}
                    />
                  )}
                />
              </>
            )}
          </View>

          <View className="h-28" />
        </ScrollView>
      )}
    </View>
  );
}
