import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, FlatList, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '../../components/common/IconCompat';
import { iconFor } from '../../utils/categoryIcons';
import { listFavourites, removeFavourite } from '../../utils/favourites';

// Lists the gifts saved with the heart on a gift's page (same storage).
export default function FavouritesScreen({ navigation }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listFavourites()
        .then((items) => {
          if (alive) setGifts(items);
        })
        .catch(() => {})
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => { alive = false; };
    }, []),
  );

  const formatPrice = (price) => '₦' + (Number(price) || 0).toLocaleString();

  const openGift = (gift) => {
    const names = navigation.getState?.()?.routeNames || [];
    if (names.includes('GiftDetail')) {
      navigation.navigate('GiftDetail', { gift });
    } else {
      // Opened from the Profile tab, which has no gift pages: show the gift
      // in the Gifts tab.
      navigation.getParent()?.navigate('Gifts', { screen: 'GiftDetail', params: { gift }, initial: false });
    }
  };

  const unsave = async (gift) => {
    setGifts((prev) => prev.filter((g) => g.id !== gift.id));
    try {
      await removeFavourite(gift.id);
    } catch {}
  };

  const renderGiftItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-2xl p-3.5 mb-3"
      style={{
        shadowColor: '#211F1C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
      activeOpacity={0.8}
      onPress={() => openGift(item)}
    >
      <View className="w-14 h-14 rounded-2xl bg-cream items-center justify-center mr-3.5 overflow-hidden">
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Ionicons name={iconFor(item.category)} size={26} color="#B5AFA2" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
        {item.vendor_name ? (
          <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{item.vendor_name}</Text>
        ) : null}
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-sm font-extrabold text-teal">{formatPrice(item.price)}</Text>
          {Number(item.rating) > 0 ? (
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="star" size={11} color="#B8862E" />
              <Text className="text-[11px] text-gray-500 font-semibold">{item.rating}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center"
        onPress={() => unsave(item)}
      >
        <Ionicons name="heart" size={20} color="#D24B4B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="bg-white px-5 pb-4"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#211F1C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            Favourites{gifts.length ? ` (${gifts.length})` : ''}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1F4A45" />
        </View>
      ) : (
        <FlatList
          data={gifts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderGiftItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-20 px-8">
              <View className="w-24 h-24 rounded-full bg-red-50 items-center justify-center mb-5">
                <Ionicons name="heart-outline" size={40} color="#D24B4B" />
              </View>
              <Text className="text-lg font-bold text-gray-800 mb-2">No favourites yet</Text>
              <Text className="text-sm text-gray-400 text-center leading-5">
                Tap the heart on a gift to save it here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
