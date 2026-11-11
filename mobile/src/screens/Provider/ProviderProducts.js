import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert, Image, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { useFocusEffect } from '@react-navigation/native';
import { productsAPI } from '../../services/api';
import { apiError } from '../../utils/errors';

const cardShadow = { shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 };

// The seller's own listings (GET /products/my-products), with edit and delete.
export default function ProviderProducts({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categoryNames, setCategoryNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    try {
      const [mineRes, catRes] = await Promise.allSettled([
        productsAPI.mine(),
        productsAPI.categories(),
      ]);
      if (mineRes.status === 'fulfilled') {
        setProducts(Array.isArray(mineRes.value.data) ? mineRes.value.data : []);
        setError('');
      } else {
        setError(apiError(mineRes.reason, 'We could not load your products. Pull down to try again.'));
      }
      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value.data)) {
        const names = {};
        catRes.value.data.forEach((c) => { names[c.id] = c.name; });
        setCategoryNames(names);
      }
    } finally {
      loadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever the screen comes back into view (after adding or editing).
  useFocusEffect(
    useCallback(() => {
      if (!loadedOnce.current) setLoading(true);
      load();
    }, [load]),
  );

  const handleDelete = (product) => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(product.id);
          try {
            const res = await productsAPI.deleteMine(product.id);
            if (res.data?.archived) {
              Alert.alert(
                'Product Hidden',
                'This product has been ordered before, so it was removed from the store but kept in your order history.',
              );
            }
            await load();
          } catch (err) {
            Alert.alert('Delete Failed', apiError(err, 'We could not delete this product. Please try again.'));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const visible = products.filter((p) => p.status !== 'inactive').length;
  const hidden = products.length - visible;

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, ...cardShadow }}
        className="px-5 pb-4 bg-white"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#211F1C" />
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

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1F4A45" />
        }
      >
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#1F4A45" />
          </View>
        ) : error && products.length === 0 ? (
          <View className="items-center mt-16 px-6">
            <Ionicons name="cloud-offline-outline" size={48} color="#9A948A" />
            <Text className="text-base font-bold text-gray-800 mt-3">Could not load your products</Text>
            <Text className="text-sm text-gray-400 mt-1 text-center">{error}</Text>
            <TouchableOpacity className="bg-teal px-6 py-3 rounded-2xl mt-4" onPress={() => { setLoading(true); load(); }}>
              <Text className="text-sm text-white font-bold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="cube-outline" size={48} color="#9A948A" />
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
            {products.map((product) => {
              const isHidden = product.status === 'inactive';
              const deleting = deletingId === product.id;
              return (
                <TouchableOpacity
                  key={product.id}
                  className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
                  style={{ ...cardShadow, opacity: deleting ? 0.5 : 1 }}
                  disabled={deleting}
                  onPress={() => navigation.navigate('ProductForm', { mode: 'edit', product })}
                >
                  <View className="w-14 h-14 rounded-2xl bg-teal-light items-center justify-center mr-3 overflow-hidden">
                    {product.image_url ? (
                      <Image source={{ uri: product.image_url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Ionicons name="cube-outline" size={24} color="#1F4A45" />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-bold text-gray-800 flex-shrink" numberOfLines={1}>{product.name}</Text>
                      {isHidden && (
                        <View className="bg-red-50 px-2.5 py-0.5 rounded-full">
                          <Text className="text-[10px] text-red-500 font-bold">Hidden</Text>
                        </View>
                      )}
                    </View>
                    {categoryNames[product.category_id] ? (
                      <Text className="text-xs text-gray-400 mt-0.5">{categoryNames[product.category_id]}</Text>
                    ) : null}
                    {product.price != null && (
                      <Text className="text-sm font-extrabold text-teal mt-1">{'₦'}{Number(product.price).toLocaleString()}</Text>
                    )}
                  </View>
                  {/* Edit */}
                  <View className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center mr-2">
                    <Ionicons name="create-outline" size={17} color="#6E6A63" />
                  </View>
                  {/* Delete */}
                  <TouchableOpacity
                    className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
                    onPress={() => handleDelete(product)}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color="#D24B4B" />
                    ) : (
                      <Ionicons name="trash-outline" size={17} color="#D24B4B" />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {/* Summary */}
            <View className="bg-white rounded-2xl p-4 mt-3" style={cardShadow}>
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-2 h-2 rounded-full bg-teal" />
                <Text className="text-[17px] font-bold text-teal">
                  {visible} product{visible !== 1 ? 's' : ''} in the store
                </Text>
              </View>
              <Text className="text-xs text-gray-400 ml-4">{hidden} hidden</Text>
            </View>
          </>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
