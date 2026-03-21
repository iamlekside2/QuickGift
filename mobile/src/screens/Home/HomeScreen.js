import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, Platform, Image, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BEAUTY_CATEGORIES } from '../../constants/data';
import { productsAPI, providersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/common/CategoryCard';
import GiftCard from '../../components/common/GiftCard';
import ProviderCard from '../../components/common/ProviderCard';

const logoSmall = require('../../../assets/images/logo-small.png');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [occasions, setOccasions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredGifts, setFeaturedGifts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [occasionsRes, categoriesRes, giftsRes, providersRes] = await Promise.allSettled([
        productsAPI.occasions(),
        productsAPI.categories(),
        productsAPI.list({ featured: true, per_page: 6 }),
        providersAPI.list({ sort: 'rating' }),
      ]);

      if (occasionsRes.status === 'fulfilled') setOccasions(occasionsRes.value.data);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data);
      if (giftsRes.status === 'fulfilled') setFeaturedGifts(giftsRes.value.data.items || []);
      if (providersRes.status === 'fulfilled') setProviders(providersRes.value.data || []);

      const allFailed = [occasionsRes, categoriesRes, giftsRes, providersRes]
        .every(r => r.status === 'rejected');
      if (allFailed) setError(true);
    } catch (err) {
      console.log('Error loading home data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const userName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      {/* Premium header with teal accent band */}
      <View
        className="bg-teal"
        style={{ paddingTop: Platform.OS === 'ios' ? 55 : 35 }}
      >
        <View className="px-6 pb-5">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-3.5">
              <View
                className="w-11 h-11 rounded-2xl bg-white/20 items-center justify-center"
              >
                <Image source={logoSmall} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
              </View>
              <View>
                <Text className="text-lg font-bold text-white">Hi {userName} 👋</Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <Ionicons name="location" size={11} color="rgba(255,255,255,0.7)" />
                  <Text className="text-xs text-white/70">{user?.city || 'Lagos'}, Nigeria</Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center gap-2.5">
              <TouchableOpacity
                className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center"
                onPress={() => navigation.navigate('Cart')}
              >
                <Ionicons name="cart-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center"
                onPress={() => Alert.alert('Notifications', 'No new notifications')}
              >
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Curved transition into content area */}
        <View className="bg-gray-50 h-5" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#35615D" />
        }
      >
        {/* Search Bar - elevated, frosted look */}
        <View className="px-5 -mt-1 mb-5">
          <TouchableOpacity
            className="flex-row items-center bg-white rounded-3xl px-5 py-4 gap-3"
            style={{
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 6,
            }}
            onPress={() => navigation.navigate('GiftsList', { title: 'Search', search: true })}
          >
            <View className="w-9 h-9 rounded-xl bg-teal-light items-center justify-center">
              <Ionicons name="search" size={18} color="#35615D" />
            </View>
            <Text className="flex-1 text-sm text-gray-400">Search gifts, services, vendors...</Text>
            <View className="w-9 h-9 rounded-xl bg-orange-light items-center justify-center">
              <Ionicons name="mic-outline" size={18} color="#FD8950" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions - hero cards with bold visual hierarchy */}
        <View className="flex-row px-5 gap-3.5 mb-8">
          <TouchableOpacity
            className="flex-1 bg-teal rounded-3xl overflow-hidden"
            onPress={() => navigation.navigate('GiftsHome')}
            activeOpacity={0.85}
          >
            <View className="p-5 pb-4">
              <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mb-4">
                <Text style={{ fontSize: 28 }}>🎁</Text>
              </View>
              <Text className="text-white text-xl font-bold tracking-tight">Send a Gift</Text>
              <Text className="text-white/60 text-xs mt-1.5">Cakes, flowers & more</Text>
            </View>
            <View className="flex-row justify-end px-5 pb-3">
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-orange rounded-3xl overflow-hidden"
            onPress={() => navigation.navigate('BeautyHome')}
            activeOpacity={0.85}
          >
            <View className="p-5 pb-4">
              <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mb-4">
                <Text style={{ fontSize: 28 }}>💅</Text>
              </View>
              <Text className="text-white text-xl font-bold tracking-tight">Book Beauty</Text>
              <Text className="text-white/60 text-xs mt-1.5">Nails, hair, makeup</Text>
            </View>
            <View className="flex-row justify-end px-5 pb-3">
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="items-center mt-16 gap-5 px-10">
            <View
              className="w-20 h-20 rounded-3xl bg-teal-light items-center justify-center"
            >
              <ActivityIndicator size="large" color="#35615D" />
            </View>
            <View className="items-center gap-1.5">
              <Text className="text-base font-bold text-gray-700">Loading amazing things...</Text>
              <Text className="text-xs text-gray-400 text-center">Finding the best gifts and services for you</Text>
            </View>
          </View>
        ) : error ? (
          <View className="items-center mt-16 px-8 gap-4">
            <View
              className="w-24 h-24 rounded-3xl bg-orange-light items-center justify-center"
            >
              <Text style={{ fontSize: 40 }}>😕</Text>
            </View>
            <View className="items-center gap-2">
              <Text className="text-xl font-bold text-gray-800">Couldn't load content</Text>
              <Text className="text-sm text-gray-400 text-center leading-5">
                Server might be waking up. Give it a moment and try again.
              </Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center bg-teal px-7 py-3.5 rounded-2xl gap-2.5 mt-2"
              onPress={loadData}
              style={{
                shadowColor: '#35615D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text className="text-sm text-white font-bold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Occasions */}
            {occasions.length > 0 && (
              <View className="mb-2">
                <SectionHeader title="Shop by Occasion" />
                <FlatList
                  horizontal
                  data={occasions}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12, marginBottom: 28 }}
                  renderItem={({ item }) => (
                    <CategoryCard
                      label={item.name}
                      icon={item.icon}
                      color={item.color}
                      size="sm"
                      onPress={() => navigation.navigate('GiftsList', { occasion: item.id, title: item.name })}
                    />
                  )}
                />
              </View>
            )}

            {/* Featured Gifts */}
            {featuredGifts.length > 0 && (
              <View className="mb-2">
                <SectionHeader title="Popular Gifts" onAction={() => navigation.navigate('GiftsHome')} />
                <FlatList
                  horizontal
                  data={featuredGifts}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 14, marginBottom: 28 }}
                  renderItem={({ item }) => (
                    <GiftCard
                      item={item}
                      onPress={() => navigation.navigate('GiftDetail', { gift: item })}
                    />
                  )}
                />
              </View>
            )}

            {/* Beauty Categories */}
            <View className="mb-2">
              <SectionHeader title="Beauty Services" onAction={() => navigation.navigate('BeautyHome')} />
              <FlatList
                horizontal
                data={BEAUTY_CATEGORIES}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12, marginBottom: 28 }}
                renderItem={({ item }) => (
                  <CategoryCard
                    label={item.label}
                    icon={item.icon}
                    onPress={() => navigation.navigate('ProvidersList', { category: item.id })}
                  />
                )}
              />
            </View>

            {/* Top Providers */}
            {providers.length > 0 && (
              <>
                <SectionHeader title="Top Beauty Pros" onAction={() => navigation.navigate('BeautyHome')} />
                <View className="px-5 gap-3.5 mb-4">
                  {providers.slice(0, 3).map((item) => (
                    <ProviderCard
                      key={item.id}
                      item={item}
                      onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
