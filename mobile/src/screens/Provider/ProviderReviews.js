import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { reviewsAPI, providersAPI } from '../../services/api';

export default function ProviderReviews({ navigation }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      // First get the provider ID via /providers/me
      const meRes = await providersAPI.me();
      const providerId = meRes.data?.id;
      if (providerId) {
        const res = await reviewsAPI.list('provider', providerId);
        const data = res.data?.reviews || res.data || [];
        setReviews(Array.isArray(data) ? data : []);
      } else {
        setReviews([]);
      }
    } catch (e) {
      console.log('Error fetching reviews:', e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [fetchReviews])
  );

  // Compute stats from fetched reviews
  const total = reviews.length;
  const average = total > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total).toFixed(1)
    : '0.0';
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rating = Math.round(r.rating || 0);
    if (rating >= 1 && rating <= 5) starCounts[rating]++;
  });

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        className="px-5 pb-4 bg-white"
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Reviews</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#35615D" />
        </View>
      ) : reviews.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="star-outline" size={48} color="#9CA3AF" />
          <Text className="text-base font-bold text-gray-800 mt-3">No reviews yet</Text>
          <Text className="text-sm text-gray-400 mt-1 text-center">Reviews from your clients will appear here</Text>
        </View>
      ) : (
        <>
          {/* Stats Card */}
          <View
            className="mx-5 mt-4 mb-5 bg-white rounded-2xl p-5 flex-row items-center"
            style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
          >
            <View className="items-center mr-6">
              <Text className="text-4xl font-extrabold text-gray-800">{average}</Text>
              <View className="flex-row mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.floor(Number(average)) ? 'star' : (star - 0.5 <= Number(average) ? 'star-half' : 'star-outline')}
                    size={14}
                    color="#FD8950"
                  />
                ))}
              </View>
              <Text className="text-xs text-gray-400 mt-1">{total} review{total !== 1 ? 's' : ''}</Text>
            </View>
            <View className="flex-1 gap-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starCounts[star];
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <View key={star} className="flex-row items-center gap-2">
                    <Text className="text-[10px] text-gray-400 w-2">{star}</Text>
                    <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-orange rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Reviews List */}
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {reviews.map((review) => {
              const clientName = review.client_name || review.reviewer_name || review.user_name || 'Client';
              const serviceName = review.service_name || review.service || '';
              const dateStr = review.date || review.created_at || '';
              const displayDate = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
              return (
                <View
                  key={review.id || review._id}
                  className="bg-white rounded-2xl p-4 mb-3"
                  style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center gap-2">
                      <View className="w-9 h-9 rounded-full bg-teal-light items-center justify-center">
                        <Text className="text-teal font-bold text-sm">{clientName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text className="text-sm font-bold text-gray-800">{clientName}</Text>
                        <Text className="text-[10px] text-gray-400">
                          {serviceName}{serviceName && displayDate ? ' - ' : ''}{displayDate}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= (review.rating || 0) ? 'star' : 'star-outline'}
                          size={12}
                          color="#FD8950"
                        />
                      ))}
                    </View>
                  </View>
                  <Text className="text-xs text-gray-600 leading-[18px]">{review.comment || review.text || ''}</Text>
                </View>
              );
            })}
            <View className="h-[40px]" />
          </ScrollView>
        </>
      )}
    </View>
  );
}
