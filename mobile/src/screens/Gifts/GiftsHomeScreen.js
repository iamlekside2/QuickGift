import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { productsAPI } from '../../services/api';
import { LoadingState } from '../../components/common/ScreenStates';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import GiftCard from '../../components/common/GiftCard';
import ScreenHeader from '../../components/common/ScreenHeader';
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

  // Show Back only when this screen was PUSHED onto its own stack (e.g. reached
  // from the Home flow) — not merely because the tab navigator has tab history.
  const canGoBack = (navigation.getState()?.index ?? 0) > 0;

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="light" />

      {/* Teal header */}
      <ScreenHeader
        variant="root"
        title="Send a Gift"
        showBack={canGoBack}
        onBack={() => navigation.goBack()}
        pb={30}
      />

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

            {/* Popular Gifts — 2-column grid so the tab fills and stays browsable */}
            {popularGifts.length > 0 && (
              <>
                <SectionHeader title="Popular Gifts" onAction={() => navigation.navigate('GiftsList', { title: 'All Gifts' })} />
                <View
                  className="flex-row flex-wrap px-5 mb-4"
                  style={{ justifyContent: 'space-between', rowGap: 16 }}
                >
                  {popularGifts.map((item) => (
                    <GiftCard
                      key={item.id}
                      item={item}
                      onPress={() => navigation.navigate('GiftDetail', { gift: item })}
                    />
                  ))}
                </View>
              </>
            )}
          </View>

          <View className="h-28" />
        </ScrollView>
      )}
    </View>
  );
}
