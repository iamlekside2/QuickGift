import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { providersAPI, reviewsAPI, chatsAPI } from '../../services/api';
import Button from '../../components/common/Button';
import { iconFor } from '../../utils/categoryIcons';
import { SERIF_FAMILY } from '../../components/common/Typography';

export default function ProviderProfileScreen({ navigation, route }) {
  const { provider } = route.params || {};
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString();
  const name = provider?.business_name || provider?.name || 'Provider';
  const serviceType = provider?.service_type || provider?.service || '';
  const area = provider?.city || provider?.location || 'Lagos';

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      const [svcRes, revRes] = await Promise.allSettled([
        providersAPI.services(provider?.id),
        reviewsAPI.list('provider', provider?.id),
      ]);
      if (svcRes.status === 'fulfilled') setServices(svcRes.value.data || []);
      if (revRes.status === 'fulfilled') setReviews(revRes.value.data || []);
    } catch (err) {
      console.log('Error loading provider data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async () => {
    try {
      const res = await chatsAPI.createConversation(provider?.id, name);
      const conv = res.data;
      navigation.navigate('ChatScreen', {
        conversationId: conv.id,
        otherName: name,
        otherAvatar: name.charAt(0).toUpperCase(),
        providerId: provider?.id,
        buyerId: conv.buyer_id,
      });
    } catch (err) {
      console.log('Error opening chat:', err);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Portfolio hero (260px) with floating back */}
        <View className="bg-sand items-center justify-center" style={{ height: 260 }}>
          {provider?.cover_image || provider?.image_url || provider?.avatar_url ? (
            <Image source={{ uri: provider.cover_image || provider.image_url || provider.avatar_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Ionicons name={iconFor(serviceType)} size={80} color="#B5AFA2" />
          )}
          <TouchableOpacity
            className="absolute w-10 h-10 rounded-full items-center justify-center"
            style={{ top: Platform.OS === 'ios' ? 56 : 40, left: 20, backgroundColor: 'rgba(255,255,255,0.92)' }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
          </TouchableOpacity>
        </View>

        {/* Content sheet */}
        <View className="bg-cream px-5 pt-6" style={{ marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text style={{ fontFamily: SERIF_FAMILY, fontSize: 24, color: '#211F1C' }}>{name}</Text>
              <Text className="text-[13.5px] text-ink-soft mt-1">
                {serviceType}{serviceType ? ' · ' : ''}{area}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-orange-light px-3 py-1.5 rounded-full mt-1">
              <Ionicons name="star" size={13} color="#E8632F" />
              <Text className="text-[13px] text-orange-dark font-bold">{provider?.rating || '—'}</Text>
            </View>
          </View>

          {/* Badge chips */}
          <View className="flex-row gap-2 mt-4 flex-wrap">
            {provider?.is_verified && (
              <View className="flex-row items-center gap-1 bg-teal-light px-3 py-1.5 rounded-full">
                <Ionicons name="shield-checkmark" size={13} color="#1F4A45" />
                <Text className="text-[12px] font-bold text-teal">Verified</Text>
              </View>
            )}
            <View className="flex-row items-center gap-1 bg-sand px-3 py-1.5 rounded-full">
              <Ionicons name="time-outline" size={13} color="#6E6A63" />
              <Text className="text-[12px] font-bold text-ink-soft">{provider?.experience || 'Experienced'}</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-sand px-3 py-1.5 rounded-full">
              <Ionicons name="briefcase-outline" size={13} color="#6E6A63" />
              <Text className="text-[12px] font-bold text-ink-soft">{provider?.jobs_done || provider?.review_count || 0} jobs</Text>
            </View>
          </View>

          {/* Services & pricing */}
          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">Services & Prices</Text>
          {loading ? (
            <ActivityIndicator color="#1F4A45" />
          ) : services.length > 0 ? (
            services.map((svc, i) => (
              <View key={svc.id || i} className="flex-row items-center p-4 bg-white rounded-[16px] mb-2.5 border-[1.5px] border-line-border">
                <View className="w-10 h-10 rounded-[12px] bg-teal-light items-center justify-center mr-3">
                  <Ionicons name={iconFor(serviceType)} size={18} color="#1F4A45" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-ink">{svc.name}</Text>
                  <Text className="text-[12px] text-ink-caption mt-0.5">
                    {svc.duration_minutes ? `${svc.duration_minutes} min` : svc.duration || ''}
                  </Text>
                </View>
                <Text className="text-[15px] font-extrabold text-teal">{formatPrice(svc.price)}</Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-ink-caption py-3">No services listed yet</Text>
          )}

          {/* Recent review */}
          <Text className="text-[16px] font-bold text-ink mt-6 mb-3">Recent Review</Text>
          {reviews.length > 0 ? (
            <View className="bg-white rounded-[16px] p-4 border-[1.5px] border-line-border">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-orange-light items-center justify-center">
                    <Text className="text-xs font-bold text-orange-dark">{reviews[0].user_name?.charAt(0) || 'U'}</Text>
                  </View>
                  <Text className="text-[13px] font-bold text-ink">{reviews[0].user_name || 'Customer'}</Text>
                </View>
                <View className="flex-row gap-0.5">
                  {Array(Math.round(reviews[0].rating || 5)).fill(0).map((_, j) => (
                    <Ionicons key={j} name="star" size={12} color="#E8632F" />
                  ))}
                </View>
              </View>
              {reviews[0].comment && <Text className="text-[13px] text-ink-soft leading-5">{reviews[0].comment}</Text>}
            </View>
          ) : (
            <Text className="text-sm text-ink-caption py-3">No reviews yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Pinned bottom bar */}
      <View
        className="flex-row items-center gap-3 px-5 bg-white"
        style={{ paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 18, borderTopWidth: 1, borderTopColor: '#F5F0E7' }}
      >
        <TouchableOpacity
          className="w-[52px] h-[52px] rounded-[16px] border-[1.5px] border-teal items-center justify-center"
          onPress={openChat}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#1F4A45" />
        </TouchableOpacity>
        <Button
          title="Book Appointment"
          onPress={() => navigation.navigate('Booking', { provider, services })}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
