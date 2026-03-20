import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function ProviderProducts({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // No provider products API endpoint yet — show empty state
      setLoading(false);
      setProducts([]);
    }, [])
  );

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
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#35615D" />
          </View>
        ) : products.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-gray-800 mt-3">No products yet</Text>
            <Text className="text-sm text-gray-400 mt-1">Add your first product!</Text>
            <TouchableOpacity
              className="bg-teal px-6 py-3 rounded-2xl mt-4"
              onPress={() => navigation.navigate('ProductForm', { mode: 'add' })}
            >
              <Text className="text-sm text-white font-bold">Add First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id || product._id}
                className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
                style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                onPress={() => navigation.navigate('ProductForm', { mode: 'edit', product })}
              >
                <View className="w-14 h-14 rounded-2xl bg-teal-light items-center justify-center mr-3">
                  <Ionicons name="cube-outline" size={24} color="#35615D" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-gray-800">{product.name}</Text>
                    {product.inStock === false && (
                      <View className="bg-red-50 px-2.5 py-0.5 rounded-full">
                        <Text className="text-[10px] text-red-500 font-bold">Out of Stock</Text>
                      </View>
                    )}
                  </View>
                  {product.category ? (
                    <Text className="text-xs text-gray-400 mt-0.5">{product.category}</Text>
                  ) : null}
                  {product.price != null && (
                    <Text className="text-sm font-extrabold text-teal mt-1">{'\u20A6'}{Number(product.price).toLocaleString()}</Text>
                  )}
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
                  {products.filter((p) => p.inStock !== false).length} product{products.filter((p) => p.inStock !== false).length !== 1 ? 's' : ''} in stock
                </Text>
              </View>
              <Text className="text-xs text-gray-400 ml-4">
                {products.filter((p) => p.inStock === false).length} out of stock
              </Text>
            </View>
          </>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
