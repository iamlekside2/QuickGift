import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Image, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import { iconFor } from '../../utils/categoryIcons';

// NOTE: backend charges subtotal only (DELIVERY_BASE_FEE=0, no card-fee field),
// so the gift message card is a free feature for now. Monetizing it (and the
// ₦1,500 delivery in the handoff) needs backend support — tracked separately.
const CARD_FEE = 0;

export default function GiftDetailScreen({ navigation, route }) {
  const { gift } = route.params || {};
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [addCard, setAddCard] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [variantIdx, setVariantIdx] = useState(0);
  const { addItem } = useCart();

  // Size variants — use gift.variants/sizes if the product defines them.
  const variants = useMemo(() => {
    const raw = gift?.variants || gift?.sizes;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((v) => ({
        label: v.label || v.name || v.size,
        price: v.price != null ? v.price : gift?.price || 0,
      }));
    }
    return null;
  }, [gift]);

  const unitPrice = variants ? variants[variantIdx].price : gift?.price || 0;
  const total = unitPrice * quantity + (addCard ? CARD_FEE : 0);

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
    favs = favs.includes(gift.id) ? favs.filter((id) => id !== gift.id) : [...favs, gift.id];
    await AsyncStorage.setItem('@favorites', JSON.stringify(favs));
    setIsFavorite(!isFavorite);
  };

  const formatPrice = (p) => '₦' + (p || 0).toLocaleString();

  const handleAdd = () => {
    addItem(
      {
        ...gift,
        price: unitPrice,
        variant: variants ? variants[variantIdx].label : undefined,
        personal_message: addCard && message ? message : undefined,
        card_fee: addCard ? CARD_FEE : 0,
      },
      quantity
    );
    Alert.alert('Added!', `${gift.name} added to cart`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Hero image (300px) with floating controls */}
        <View className="bg-sand items-center justify-center" style={{ height: 300 }}>
          {gift?.image_url ? (
            <Image source={{ uri: gift.image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Ionicons name={iconFor(gift?.category || gift?.category_name)} size={92} color="#B5AFA2" />
          )}

          <View
            className="absolute left-5 right-5 flex-row items-center justify-between"
            style={{ top: Platform.OS === 'ios' ? 56 : 40 }}
          >
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#211F1C" />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
              onPress={toggleFavorite}
            >
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#D24B4B' : '#211F1C'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content sheet overlapping the hero */}
        <View
          className="bg-cream px-5 pt-6"
          style={{ marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        >
          {/* Title + rating */}
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-[22px] font-extrabold text-ink tracking-tight">{gift?.name}</Text>
              <Text className="text-[14px] text-ink-soft mt-1">by {gift?.vendor_name || gift?.vendor}</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-orange-light px-3 py-1.5 rounded-full mt-1">
              <Ionicons name="star" size={13} color="#E8632F" />
              <Text className="text-[13px] text-orange-dark font-bold">{gift?.rating || '—'}</Text>
            </View>
          </View>

          {/* Same-day pill */}
          <View className="flex-row items-center gap-2 mt-3">
            <View className="flex-row items-center gap-1.5 bg-success-bg px-3 py-1.5 rounded-full">
              <Ionicons name="bicycle-outline" size={14} color="#3E8E63" />
              <Text className="text-xs text-success font-bold">Same-day delivery</Text>
            </View>
          </View>

          {/* Description */}
          {gift?.description ? (
            <Text className="text-[13.5px] text-ink-soft leading-[21px] mt-4">{gift.description}</Text>
          ) : null}

          {/* Size variants */}
          {variants && (
            <View className="mt-6">
              <Text className="text-[16px] font-bold text-ink mb-3">Size</Text>
              <View className="flex-row flex-wrap gap-2.5">
                {variants.map((v, i) => {
                  const active = variantIdx === i;
                  return (
                    <TouchableOpacity
                      key={v.label + i}
                      className={`px-4 py-2.5 rounded-full border-[1.5px] ${active ? 'bg-teal border-teal' : 'bg-white border-line-border'}`}
                      onPress={() => setVariantIdx(i)}
                      activeOpacity={0.85}
                    >
                      <Text className={`text-[13px] font-bold ${active ? 'text-white' : 'text-ink'}`}>
                        {v.label} · {formatPrice(v.price)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity stepper */}
          <View className="mt-6">
            <Text className="text-[16px] font-bold text-ink mb-3">Quantity</Text>
            <View className="flex-row items-center gap-5">
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-sand items-center justify-center"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={18} color="#211F1C" />
              </TouchableOpacity>
              <Text className="text-[18px] font-extrabold text-ink w-8 text-center">{quantity}</Text>
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-teal items-center justify-center"
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Message card checkbox row (+₦500) */}
          <TouchableOpacity
            className="mt-6 flex-row items-center gap-3 bg-white rounded-[16px] p-4 border-[1.5px]"
            style={{ borderColor: addCard ? '#1F4A45' : '#EAE3D8' }}
            onPress={() => setAddCard(!addCard)}
            activeOpacity={0.85}
          >
            <View
              className="w-6 h-6 rounded-md items-center justify-center border-[1.5px]"
              style={{ backgroundColor: addCard ? '#1F4A45' : 'transparent', borderColor: addCard ? '#1F4A45' : '#B5AFA2' }}
            >
              {addCard && <Ionicons name="checkmark" size={15} color="#fff" />}
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-ink">Add a gift message card</Text>
              <Text className="text-[12px] text-ink-caption mt-0.5">Handwritten note with your message</Text>
            </View>
            <Text className="text-[13px] font-bold text-success">Free</Text>
          </TouchableOpacity>

          {/* Message input (revealed when card added) */}
          {addCard && (
            <View className="mt-3 bg-white rounded-[16px] border-[1.5px] border-line-border p-4">
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Write a heartfelt message…"
                placeholderTextColor="#B5AFA2"
                multiline
                style={{ minHeight: 72, fontSize: 14, color: '#211F1C', textAlignVertical: 'top' }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pinned bottom bar */}
      <View
        className="flex-row items-center gap-5 px-5 bg-white"
        style={{
          paddingTop: 14,
          paddingBottom: Platform.OS === 'ios' ? 34 : 18,
          borderTopWidth: 1,
          borderTopColor: '#F5F0E7',
        }}
      >
        <View>
          <Text className="text-xs text-ink-caption font-semibold">Total</Text>
          <Text className="text-[22px] font-extrabold text-ink">{formatPrice(total)}</Text>
        </View>
        <Button title="Add to Cart" onPress={handleAdd} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
