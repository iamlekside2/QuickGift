import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI } from '../../services/api';
import { LoadingState } from '../../components/common/ScreenStates';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import GiftCard from '../../components/common/GiftCard';

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

  if (loading) return <View className="flex-1 bg-white"><LoadingState message="Loading gifts..." /></View>;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Fixed teal header - stays above scroll */}
      <View
        className="bg-teal px-6 pb-6"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Send a Gift</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text className="text-white/60 text-sm text-center">
          Make someone's day special
        </Text>

        {/* Search Bar */}
        <TouchableOpacity
          className="flex-row items-center bg-white/15 rounded-2xl px-5 py-3.5 mt-4 gap-3"
          onPress={() => navigation.navigate('GiftsList', { title: 'Search', search: true })}
        >
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
          <Text className="text-white/50 text-sm">Search gifts...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mt-6">
          {/* Categories */}
          {categories.length > 0 && (
            <>
              <SectionHeader title="Categories" />
              <View className="flex-row flex-wrap px-5 gap-4 mb-6 justify-between">
                {categories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    label={cat.name}
                    icon={cat.icon}
                    onPress={() => navigation.navigate('GiftsList', { category: cat.id, title: cat.name })}
                  />
                ))}
              </View>
            </>
          )}

          {/* Occasions */}
          {occasions.length > 0 && (
            <>
              <SectionHeader title="By Occasion" />
              <FlatList
                horizontal
                data={occasions}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="flex-row items-center px-5 py-3 rounded-full gap-2"
                    style={{
                      backgroundColor: (item.color || '#35615D') + '12',
                      shadowColor: item.color || '#35615D',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                    onPress={() => navigation.navigate('GiftsList', { title: item.name })}
                  >
                    <Text className="text-base">{item.icon}</Text>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: item.color || '#35615D' }}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
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
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12, marginBottom: 24 }}
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
    </View>
  );
}
