import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const giftFavourites = [];
const providerFavourites = [];

export default function FavouritesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('gifts');

  const formatPrice = (price) => '₦' + price.toLocaleString();

  const renderGiftItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-2xl p-3.5 mb-3"
      style={{
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('GiftDetail', { gift: item })}
    >
      <View className="w-14 h-14 rounded-2xl bg-cream items-center justify-center mr-3.5">
        <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">{item.vendor}</Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-sm font-extrabold text-teal">{formatPrice(item.price)}</Text>
          <View className="flex-row items-center gap-0.5">
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text className="text-[11px] text-gray-500 font-semibold">{item.rating}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
        <Ionicons name="heart" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderProviderItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-2xl p-3.5 mb-3"
      style={{
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
    >
      <View className="w-14 h-14 rounded-2xl bg-teal-light items-center justify-center mr-3.5">
        <Text className="text-xl font-bold text-teal">{item.name.charAt(0)}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[15px] font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
          {item.available && (
            <View className="flex-row items-center bg-green-50 px-1.5 py-0.5 rounded-full gap-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <Text className="text-[9px] text-green-600 font-semibold">Online</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-400 mt-0.5">{item.service}</Text>
        <View className="flex-row items-center gap-1 mt-1">
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text className="text-[11px] text-gray-600 font-semibold">{item.rating}</Text>
          <Text className="text-[10px] text-gray-400">({item.reviews} reviews)</Text>
        </View>
      </View>
      <TouchableOpacity className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
        <Ionicons name="heart" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const data = activeTab === 'gifts' ? giftFavourites : providerFavourites;

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="bg-white px-5 pb-4"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Favourites</Text>
        </View>

        {/* Tab Control */}
        <View className="bg-gray-100 rounded-2xl p-1 flex-row">
          <TouchableOpacity
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'gifts' ? 'bg-teal' : ''}`}
            style={activeTab === 'gifts' ? {
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            } : undefined}
            onPress={() => setActiveTab('gifts')}
          >
            <Text className={`text-sm font-bold ${activeTab === 'gifts' ? 'text-white' : 'text-gray-400'}`}>
              Gifts ({giftFavourites.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'providers' ? 'bg-teal' : ''}`}
            style={activeTab === 'providers' ? {
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            } : undefined}
            onPress={() => setActiveTab('providers')}
          >
            <Text className={`text-sm font-bold ${activeTab === 'providers' ? 'text-white' : 'text-gray-400'}`}>
              Providers ({providerFavourites.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'gifts' ? renderGiftItem : renderProviderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center mt-20 px-8">
            <View className="w-24 h-24 rounded-full bg-red-50 items-center justify-center mb-5">
              <Ionicons name="heart-outline" size={40} color="#EF4444" />
            </View>
            <Text className="text-lg font-bold text-gray-800 mb-2">No favourites yet</Text>
            <Text className="text-sm text-gray-400 text-center leading-5">
              Items you love will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}
