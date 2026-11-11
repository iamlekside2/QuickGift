import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, Switch, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { pickImageFromLibrary } from '../../utils/pickImage';
import { Ionicons } from '../../components/common/IconCompat';
import AppInput from '../../components/common/AppInput';
import { productsAPI, uploadAPI } from '../../services/api';
import { apiError } from '../../utils/errors';
import { notifySuccess, notifyError } from '../../utils/haptics';

const cardShadow = {
  shadowColor: '#211F1C',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
};

// Add or edit one of the seller's own listings (/products/my-products).
export default function ProductForm({ route, navigation }) {
  const existing = route.params?.product || {};
  const mode = route.params?.mode === 'edit' && existing.id ? 'edit' : 'add';

  const [name, setName] = useState(existing.name || '');
  const [description, setDescription] = useState(existing.description || '');
  const [price, setPrice] = useState(existing.price != null ? String(existing.price) : '');
  const [categoryId, setCategoryId] = useState(existing.category_id || null);
  // "In stock" is the listing's visibility: active = buyers can see and buy it.
  const [inStock, setInStock] = useState(mode === 'add' ? true : existing.status !== 'inactive');
  const [imageUrl, setImageUrl] = useState(existing.image_url || null);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError('');
    try {
      const res = await productsAPI.categories();
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setCategoriesError(apiError(err, 'We could not load the categories.'));
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handlePickImage = async () => {
    if (uploading) return;
    try {
      const picked = await pickImageFromLibrary();
      if (!picked) return;
      if (picked.denied) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add a product photo.');
        return;
      }

      setUploading(true);
      const response = await uploadAPI.image(picked.uri);
      if (!response.data?.url) throw new Error('NO_URL');
      setImageUrl(response.data.url);
    } catch (err) {
      Alert.alert('Upload Failed', apiError(err, 'We could not upload that photo. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (saving || deleting) return;
    const cleanName = name.trim();
    const amount = Number(String(price).replace(/,/g, ''));
    if (!cleanName) {
      Alert.alert('Missing Fields', 'Please enter the product name.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Missing Fields', 'Please enter a price greater than zero.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Missing Fields', 'Please choose a category.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: cleanName,
        description: description.trim(),
        price: amount,
        category_id: categoryId,
        image_url: imageUrl || '',
      };
      if (mode === 'edit') {
        await productsAPI.updateMine(existing.id, { ...payload, status: inStock ? 'active' : 'inactive' });
      } else {
        const res = await productsAPI.createMine(payload);
        // New listings start visible; hide it straight away if asked to.
        if (!inStock && res.data?.id) {
          await productsAPI.updateMine(res.data.id, { status: 'inactive' });
        }
      }
      notifySuccess();
      Alert.alert(
        mode === 'edit' ? 'Product Updated' : 'Product Added',
        mode === 'edit' ? `"${cleanName}" has been saved.` : `"${cleanName}" has been listed.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      notifyError();
      Alert.alert('Save Failed', apiError(err, 'We could not save this product. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (saving || deleting) return;
    Alert.alert('Delete Product', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const res = await productsAPI.deleteMine(existing.id);
            Alert.alert(
              res.data?.archived ? 'Product Hidden' : 'Product Deleted',
              res.data?.archived
                ? 'This product has been ordered before, so it was removed from the store but kept in your order history.'
                : `"${name}" has been deleted.`,
              [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
          } catch (err) {
            notifyError();
            Alert.alert('Delete Failed', apiError(err, 'We could not delete this product. Please try again.'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="px-5 pb-4 bg-white"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, ...cardShadow }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            {mode === 'add' ? 'Add Product' : 'Edit Product'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <TouchableOpacity
          className="bg-white rounded-2xl p-4 mb-6 flex-row items-center gap-4"
          style={cardShadow}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          <View className="w-16 h-16 rounded-2xl bg-teal-light items-center justify-center overflow-hidden">
            {uploading ? (
              <ActivityIndicator color="#1F4A45" />
            ) : imageUrl ? (
              <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="image-outline" size={26} color="#1F4A45" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-800">{imageUrl ? 'Change photo' : 'Add a photo'}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Products with a photo sell better</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#B5AFA2" />
        </TouchableOpacity>

        {/* Product Details Card */}
        <View className="bg-white rounded-2xl p-5 mb-6" style={cardShadow}>
          <AppInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Birthday Gift Box"
            type="text"
          />
          <AppInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product..."
            type="multiline"
          />
          <AppInput
            label="Price (₦)"
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 15000"
            type="number"
          />
        </View>

        {/* Category Card (real categories from the store) */}
        <View className="bg-white rounded-2xl p-5 mb-6" style={cardShadow}>
          <Text className="text-[13px] font-bold text-gray-700 mb-2">Category</Text>
          {loadingCategories ? (
            <ActivityIndicator color="#1F4A45" />
          ) : categories.length === 0 ? (
            <View>
              <Text className="text-xs text-gray-500 leading-[18px]">
                {categoriesError || 'No categories are available yet.'}
              </Text>
              <TouchableOpacity className="mt-2 self-start" onPress={loadCategories}>
                <Text className="text-sm font-bold text-teal">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => {
                const active = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    className={`px-4 py-2 rounded-xl ${active ? 'bg-teal' : 'bg-white border border-gray-100'}`}
                    style={active ? {
                      shadowColor: '#1F4A45',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    } : undefined}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-600'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* In Stock Toggle */}
        <View className="flex-row items-center justify-between bg-white rounded-2xl p-4 mb-6" style={cardShadow}>
          <View className="flex-1 pr-3">
            <Text className="text-sm font-semibold text-gray-800">In Stock</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {inStock ? 'Buyers can see and order this product' : 'Hidden from the store until you turn this on'}
            </Text>
          </View>
          <Switch
            value={inStock}
            onValueChange={setInStock}
            trackColor={{ false: '#EAE3D8', true: '#1F4A45' }}
            thumbColor="#fff"
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          className="bg-teal py-4 rounded-2xl items-center mb-3"
          style={{
            shadowColor: '#1F4A45',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
            opacity: saving || uploading ? 0.7 : 1,
          }}
          onPress={handleSave}
          disabled={saving || uploading || deleting}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">
              {mode === 'add' ? 'Add Product' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete (edit mode) */}
        {mode === 'edit' && (
          <TouchableOpacity
            className="bg-red-50 py-4 rounded-2xl items-center mb-6"
            onPress={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#D24B4B" />
            ) : (
              <Text className="text-base font-bold text-red-500">Delete Product</Text>
            )}
          </TouchableOpacity>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
