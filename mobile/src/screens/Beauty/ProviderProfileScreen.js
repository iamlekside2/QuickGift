import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { providersAPI, reviewsAPI, chatsAPI } from '../../services/api';
import Button from '../../components/common/Button';

export default function ProviderProfileScreen({ navigation, route }) {
  const { provider } = route.params || {};
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price) => '\u20A6' + (price || 0).toLocaleString();

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

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Fixed Header Bar - stays above scroll */}
      <View
        className="flex-row items-center justify-between px-5 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 56 : 36,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <TouchableOpacity
          className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Provider Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View
          className="items-center pb-8 px-6"
          style={{ backgroundColor: '#F8FAFA', paddingTop: 24 }}
        >
          {/* Avatar */}
          <View
            className="w-24 h-24 rounded-3xl items-center justify-center mb-4"
            style={{ backgroundColor: '#35615D20' }}
          >
            <Text className="text-4xl font-bold text-teal">
              {provider?.business_name?.charAt(0) || provider?.name?.charAt(0)}
            </Text>
          </View>

          <Text className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {provider?.business_name || provider?.name}
          </Text>
          <Text className="text-base text-gray-400 mt-0.5">
            {provider?.service_type || provider?.service}
          </Text>

          {/* Stats Row */}
          <View
            className="flex-row items-center mt-6 bg-white rounded-2xl px-6 py-4 gap-6"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View className="items-center flex-1">
              <Text className="text-2xl font-extrabold text-gray-800">{provider?.rating || '4.8'}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Rating</Text>
            </View>
            <View className="w-px h-8 bg-gray-200" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-extrabold text-gray-800">{provider?.review_count || provider?.reviews || 0}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Reviews</Text>
            </View>
            <View className="w-px h-8 bg-gray-200" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-extrabold text-gray-800">{provider?.experience || '2yr'}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Experience</Text>
            </View>
          </View>

          {/* Badges */}
          <View className="flex-row gap-2 mt-4 flex-wrap justify-center">
            {provider?.is_verified && (
              <View className="flex-row items-center gap-1 bg-emerald-50 px-3.5 py-1.5 rounded-full">
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text className="text-xs font-semibold text-emerald-600">Verified</Text>
              </View>
            )}
            <View className="flex-row items-center gap-1 bg-teal-light px-3.5 py-1.5 rounded-full">
              <Ionicons name="location" size={14} color="#35615D" />
              <Text className="text-xs font-semibold text-teal">{provider?.city || provider?.location || 'Lagos'}</Text>
            </View>
            {(provider?.is_available || provider?.available) && (
              <View className="flex-row items-center gap-1 px-3.5 py-1.5 rounded-full" style={{ backgroundColor: '#10B98115' }}>
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-xs font-semibold text-emerald-600">Available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Services */}
        <View className="px-6 mt-7 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Services & Pricing</Text>
          {loading ? (
            <ActivityIndicator color="#35615D" />
          ) : services.length > 0 ? (
            services.map((svc, i) => (
              <View
                key={svc.id || i}
                className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <View className="w-10 h-10 rounded-xl bg-teal-light items-center justify-center mr-3">
                  <Ionicons name="cut-outline" size={18} color="#35615D" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-800">{svc.name}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {svc.duration_minutes ? `${svc.duration_minutes}min` : svc.duration}
                  </Text>
                </View>
                <Text className="text-base font-extrabold text-teal">{formatPrice(svc.price)}</Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-gray-400 text-center py-4">No services listed yet</Text>
          )}
        </View>

        {/* Portfolio */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Portfolio</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View
                key={i}
                className="rounded-2xl bg-cream items-center justify-center"
                style={{ width: '31%', aspectRatio: 1 }}
              >
                <Text className="text-3xl">{'\uD83D\uDC85'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Reviews</Text>
          {reviews.length > 0 ? (
            reviews.map((review, i) => (
              <View
                key={review.id || i}
                className="bg-gray-50 rounded-2xl p-4 mb-3"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-orange-light items-center justify-center">
                      <Text className="text-xs font-bold text-orange">
                        {review.user_name?.charAt(0) || 'U'}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-gray-800">{review.user_name}</Text>
                  </View>
                  <View className="flex-row gap-0.5">
                    {Array(Math.round(review.rating)).fill(0).map((_, j) => (
                      <Ionicons key={j} name="star" size={12} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text className="text-sm text-gray-500 leading-5">{review.comment}</Text>
                )}
              </View>
            ))
          ) : (
            <Text className="text-sm text-gray-400 text-center py-4">No reviews yet</Text>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View
        className="flex-row items-center gap-3 px-6 pb-9 pt-5 bg-white"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <TouchableOpacity
          className="w-14 h-14 rounded-2xl border-2 border-teal items-center justify-center"
          onPress={async () => {
            try {
              const providerName = provider?.business_name || provider?.name || 'Provider';
              const res = await chatsAPI.createConversation(provider?.id, providerName);
              const conv = res.data;
              navigation.navigate('ChatScreen', {
                conversationId: conv.id,
                otherName: providerName,
                otherAvatar: providerName.charAt(0).toUpperCase(),
                providerId: provider?.id,
                buyerId: conv.buyer_id,
              });
            } catch (err) {
              console.log('Error opening chat:', err);
            }
          }}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#35615D" />
        </TouchableOpacity>
        <Button
          title="Book Now"
          onPress={() => navigation.navigate('Booking', { provider, services })}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
