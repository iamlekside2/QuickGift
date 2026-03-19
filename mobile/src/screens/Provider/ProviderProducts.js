import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const PRODUCTS = [
  { id: '1', name: 'Birthday Gift Box', price: 15000, category: 'Hampers', inStock: true, emoji: '🎁' },
  { id: '2', name: 'Red Velvet Cake', price: 12000, category: 'Cakes', inStock: true, emoji: '🎂' },
  { id: '3', name: 'Rose Bouquet (12 stems)', price: 8000, category: 'Flowers', inStock: true, emoji: '💐' },
  { id: '4', name: 'Luxury Chocolate Box', price: 6500, category: 'Chocolates', inStock: false, emoji: '🍫' },
];

export default function ProviderProducts({ navigation }) {
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        className="px-5 pb-4 bg-white"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>My Products</Text>
          </View>
          <TouchableOpacity
            className="bg-teal px-4 py-2.5 rounded-2xl flex-row items-center gap-1"
            onPress={() => navigation.navigate('ProductForm', { mode: 'add' })}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-sm text-white font-bold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {PRODUCTS.length === 0 ? (
          <View className="items-center mt-16">
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text className="text-base font-bold text-gray-800 mt-3">No products yet</Text>
            <Text className="text-sm text-gray-400 mt-1">Start listing your products for sale</Text>
            <TouchableOpacity
              className="bg-teal px-6 py-3 rounded-2xl mt-4"
              onPress={() => navigation.navigate('ProductForm', { mode: 'add' })}
            >
              <Text className="text-sm text-white font-bold">Add First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {PRODUCTS.map((product) => (
              <TouchableOpacity
                key={product.id}
                className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
                style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                onPress={() => navigation.navigate('ProductForm', { mode: 'edit', product })}
              >
                <View className="w-14 h-14 rounded-2xl bg-gray-100 items-center justify-center mr-3">
                  <Text style={{ fontSize: 28 }}>{product.emoji}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-gray-800">{product.name}</Text>
                    {!product.inStock && (
                      <View className="bg-red-50 px-2.5 py-0.5 rounded-full">
                        <Text className="text-[10px] text-red-500 font-bold">Out of Stock</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400 mt-0.5">{product.category}</Text>
                  <Text className="text-sm font-extrabold text-teal mt-1">{'\u20A6'}{product.price.toLocaleString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}

            {/* Summary */}
            <View
              className="bg-white rounded-2xl p-4 mt-3"
              style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-2 h-2 rounded-full bg-teal" />
                <Text className="text-[17px] font-bold text-teal">
                  {PRODUCTS.filter(p => p.inStock).length} products in stock
                </Text>
              </View>
              <Text className="text-xs text-gray-400 ml-4">
                {PRODUCTS.filter(p => !p.inStock).length} out of stock
              </Text>
            </View>
          </>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
