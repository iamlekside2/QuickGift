import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, Switch, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/common/AppInput';
import { providersAPI } from '../../services/api';

const CATEGORIES = ['Cakes', 'Flowers', 'Chocolates', 'Hampers', 'Balloons', 'Personalized'];
const DELIVERY_OPTIONS = ['Same Day', 'Next Day', 'Both'];

export default function ProductForm({ route, navigation }) {
  const mode = route.params?.mode || 'add';
  const existing = route.params?.product || {};

  const [name, setName] = useState(existing.name || '');
  const [description, setDescription] = useState(existing.description || '');
  const [price, setPrice] = useState(existing.price?.toString() || '');
  const [category, setCategory] = useState(existing.category || 'Cakes');
  const [inStock, setInStock] = useState(existing.inStock !== false);
  const [delivery, setDelivery] = useState(existing.delivery || 'Both');

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Missing Fields', 'Please fill in product name and price.');
      return;
    }
    setSaving(true);
    try {
      await providersAPI.addMyProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        category_id: category, // Will need to be a real category ID
        vendor_name: '', // Backend fills this from provider profile
      });
      Alert.alert('Product Added', `"${name}" has been listed.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Save Failed', err.response?.data?.detail || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="px-5 pb-4 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
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
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            {mode === 'add' ? 'Add Product' : 'Edit Product'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Product Details Card */}
        <View
          className="bg-white rounded-2xl p-5 mb-6"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Product Name */}
          <AppInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Birthday Gift Box"
            type="text"
          />

          {/* Description */}
          <AppInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product..."
            type="multiline"
          />

          {/* Price */}
          <AppInput
            label="Price (₦)"
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 15000"
            type="number"
          />
        </View>

        {/* Category Card */}
        <View
          className="bg-white rounded-2xl p-5 mb-6"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                className={`px-4 py-2 rounded-xl ${
                  category === cat ? 'bg-teal' : 'bg-white border border-gray-100'
                }`}
                style={category === cat ? {
                  shadowColor: '#35615D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                } : undefined}
                onPress={() => setCategory(cat)}
              >
                <Text className={`text-sm font-medium ${
                  category === cat ? 'text-white' : 'text-gray-600'
                }`}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* In Stock Toggle */}
        <View
          className="flex-row items-center justify-between bg-white rounded-2xl p-4 mb-6"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View>
            <Text className="text-sm font-semibold text-gray-800">In Stock</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Product is available for purchase</Text>
          </View>
          <Switch
            value={inStock}
            onValueChange={setInStock}
            trackColor={{ false: '#E5E7EB', true: '#35615D' }}
            thumbColor="#fff"
          />
        </View>

        {/* Delivery Options Card */}
        <View
          className="bg-white rounded-2xl p-5 mb-6"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Delivery</Text>
          <View className="flex-row gap-2">
            {DELIVERY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                className={`flex-1 py-3 rounded-2xl items-center ${
                  delivery === opt ? 'bg-teal' : 'bg-white border border-gray-100'
                }`}
                style={delivery === opt ? {
                  shadowColor: '#35615D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                } : undefined}
                onPress={() => setDelivery(opt)}
              >
                <Text className={`text-xs font-medium ${
                  delivery === opt ? 'text-white' : 'text-gray-600'
                }`}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          className="bg-teal py-4 rounded-2xl items-center mb-3"
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={handleSave}
        >
          <Text className="text-base font-bold text-white">
            {mode === 'add' ? 'Add Product' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {/* Delete (edit mode) */}
        {mode === 'edit' && (
          <TouchableOpacity
            className="bg-red-50 py-4 rounded-2xl items-center mb-6"
            onPress={handleDelete}
          >
            <Text className="text-base font-bold text-red-500">Delete Product</Text>
          </TouchableOpacity>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
