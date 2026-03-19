import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const REVIEWS = [
  { id: '1', client: 'Amina Okafor', rating: 5, comment: 'Amazing gel nails! Lasted 3 weeks without chipping. Will definitely book again.', date: 'Mar 18', service: 'Gel Nails' },
  { id: '2', client: 'Blessing Eze', rating: 5, comment: 'Beautiful box braids, exactly what I wanted. Very neat and professional.', date: 'Mar 15', service: 'Box Braids' },
  { id: '3', client: 'Chioma Adeyemi', rating: 4, comment: 'Great bridal makeup! Was a bit late but the result was perfect.', date: 'Mar 12', service: 'Bridal Makeup' },
  { id: '4', client: 'Fatima Yusuf', rating: 5, comment: 'Love my nails! The nail art was so creative.', date: 'Mar 10', service: 'Nail Art' },
  { id: '5', client: 'Grace Okwu', rating: 4, comment: 'Good service overall. The acrylic set looks natural.', date: 'Mar 8', service: 'Acrylic Nails' },
];

const STATS = { average: 4.8, total: 127, five: 98, four: 22, three: 5, two: 1, one: 1 };

export default function ProviderReviews({ navigation }) {
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

      {/* Stats Card */}
      <View
        className="mx-5 mt-4 mb-5 bg-white rounded-2xl p-5 flex-row items-center"
        style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
      >
        <View className="items-center mr-6">
          <Text className="text-4xl font-extrabold text-gray-800">{STATS.average}</Text>
          <View className="flex-row mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(STATS.average) ? 'star' : 'star-half'}
                size={14}
                color="#FD8950"
              />
            ))}
          </View>
          <Text className="text-xs text-gray-400 mt-1">{STATS.total} reviews</Text>
        </View>
        <View className="flex-1 gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = STATS[['one', 'two', 'three', 'four', 'five'][star - 1]];
            const pct = (count / STATS.total) * 100;
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
        {REVIEWS.map((review) => (
          <View
            key={review.id}
            className="bg-white rounded-2xl p-4 mb-3"
            style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
          >
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-row items-center gap-2">
                <View className="w-9 h-9 rounded-full bg-teal-light items-center justify-center">
                  <Text className="text-teal font-bold text-sm">{review.client.charAt(0)}</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-gray-800">{review.client}</Text>
                  <Text className="text-[10px] text-gray-400">{review.service} - {review.date}</Text>
                </View>
              </View>
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= review.rating ? 'star' : 'star-outline'}
                    size={12}
                    color="#FD8950"
                  />
                ))}
              </View>
            </View>
            <Text className="text-xs text-gray-600 leading-[18px]">{review.comment}</Text>
          </View>
        ))}
        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
