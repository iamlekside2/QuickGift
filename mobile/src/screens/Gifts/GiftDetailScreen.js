import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import AppInput from '../../components/common/AppInput';

export default function GiftDetailScreen({ navigation, route }) {
  const { gift } = route.params || {};
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!gift?.id) return;
    AsyncStorage.getItem('@favorites').then((raw) => {
      const favs = raw ? JSON.parse(raw) : [];
      setIsFavorite(favs.includes(gift.id));
    });
  }, [gift?.id]);

  const toggleFavorite = async () => {
    const raw = await AsyncStorage.getItem('@favorites');
    let favs = raw ? JSON.parse(raw) : [];
    if (favs.includes(gift.id)) {
      favs = favs.filter((id) => id !== gift.id);
    } else {
      favs.push(gift.id);
    }
    await AsyncStorage.setItem('@favorites', JSON.stringify(favs));
    setIsFavorite(!isFavorite);
  };

  const formatPrice = (price) => '\u20A6' + price.toLocaleString();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Fixed Header Bar - stays above scroll */}
      <View
        className="flex-row items-center justify-between px-5 bg-white"
        style={{ paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 10 }}
      >
        <TouchableOpacity
          className="w-12 h-12 rounded-2xl bg-gray-100 items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-800">Gift Details</Text>

        <TouchableOpacity
          className="w-12 h-12 rounded-2xl bg-gray-100 items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
          onPress={toggleFavorite}
        >
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#EF4444' : '#35615D'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View
          className="h-64 bg-cream items-center justify-center mx-5 rounded-3xl overflow-hidden"
        >
          {gift?.image_url ? (
            <Image source={{ uri: gift.image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-[88px]">
              {gift?.category === 'cakes' ? '\uD83C\uDF82' :
               gift?.category === 'flowers' ? '\uD83D\uDC90' :
               gift?.category === 'chocolates' ? '\uD83C\uDF6B' : '\uD83C\uDF81'}
            </Text>
          )}
        </View>

        <View className="px-6 pt-6 pb-4 gap-2">
          {/* Product Info */}
          <Text className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {gift?.name}
          </Text>
          <Text className="text-[15px] text-gray-400">
            by {gift?.vendor_name || gift?.vendor}
          </Text>

          {/* Meta Row */}
          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-row items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="text-sm text-amber-600 font-semibold">
                {gift?.rating} ({gift?.review_count || 0})
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
              <Ionicons name="bicycle-outline" size={14} color="#10B981" />
              <Text className="text-xs text-emerald-600 font-medium">Same-day</Text>
            </View>
          </View>

          {/* Price */}
          <Text className="text-3xl font-extrabold text-teal mt-3">
            {formatPrice(gift?.price || 0)}
          </Text>

          {/* Quantity Section */}
          <View className="mt-6 gap-3">
            <Text className="text-base font-bold text-gray-800">Quantity</Text>
            <View className="flex-row items-center gap-5">
              <TouchableOpacity
                className="w-12 h-12 rounded-2xl bg-gray-100 items-center justify-center"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <Ionicons name="remove" size={20} color="#1F2937" />
              </TouchableOpacity>
              <Text className="text-2xl font-extrabold text-gray-800 w-8 text-center">
                {quantity}
              </Text>
              <TouchableOpacity
                className="w-12 h-12 rounded-2xl bg-teal items-center justify-center"
                onPress={() => setQuantity(quantity + 1)}
                style={{
                  shadowColor: '#35615D',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Personal Message Section */}
          <View className="mt-6 gap-3">
            <Text className="text-base font-bold text-gray-800">Add a Personal Message</Text>
            <AppInput
              label="Personal Message"
              placeholder="Write a heartfelt message..."
              value={message}
              onChangeText={setMessage}
              type="multiline"
            />
          </View>

          {/* Delivery Options */}
          <View className="mt-6 gap-3">
            <Text className="text-base font-bold text-gray-800">Delivery Options</Text>

            <TouchableOpacity
              className="flex-row items-center gap-4 bg-white rounded-2xl p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' }}
              onPress={() => Alert.alert('Coming Soon', 'Anonymous delivery will be available soon!')}
            >
              <View className="w-10 h-10 rounded-xl bg-teal-light items-center justify-center">
                <Ionicons name="gift-outline" size={20} color="#35615D" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-gray-800">Anonymous Delivery</Text>
                <Text className="text-xs text-gray-400 mt-0.5">Hide your name from the recipient</Text>
              </View>
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-[9px] text-gray-400 font-bold">SOON</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-4 bg-white rounded-2xl p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' }}
              onPress={() => Alert.alert('Coming Soon', 'Scheduled delivery will be available soon!')}
            >
              <View className="w-10 h-10 rounded-xl bg-orange-light items-center justify-center">
                <Ionicons name="calendar-outline" size={20} color="#FD8950" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-gray-800">Schedule Delivery</Text>
                <Text className="text-xs text-gray-400 mt-0.5">Pick a date and time</Text>
              </View>
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-[9px] text-gray-400 font-bold">SOON</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-4 bg-white rounded-2xl p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' }}
              onPress={() => Alert.alert('Coming Soon', 'Proof of Joy will be available soon!')}
            >
              <View className="w-10 h-10 rounded-xl bg-cream items-center justify-center">
                <Ionicons name="camera-outline" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-gray-800">Proof of Joy</Text>
                <Text className="text-xs text-gray-400 mt-0.5">Get a photo when gift is received</Text>
              </View>
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-[9px] text-gray-400 font-bold">SOON</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Bottom Bar */}
      <View
        className="flex-row items-center gap-5 px-6 bg-white"
        style={{
          paddingTop: 16,
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 8,
          borderTopWidth: 1,
          borderTopColor: '#F9FAFB',
        }}
      >
        <View>
          <Text className="text-xs text-gray-400 font-medium">Total</Text>
          <Text className="text-2xl font-extrabold text-gray-800">
            {formatPrice((gift?.price || 0) * quantity)}
          </Text>
        </View>
        <Button
          title="Add to Cart"
          onPress={() => {
            addItem({ ...gift, personal_message: message || undefined }, quantity);
            Alert.alert('Added!', `${gift.name} added to cart`, [
              { text: 'Continue Shopping', style: 'cancel' },
              { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
            ]);
          }}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
