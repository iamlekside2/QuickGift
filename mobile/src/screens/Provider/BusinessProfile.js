import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { providersAPI } from '../../services/api';

export default function BusinessProfile({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const providerId = user?.id || user?._id;
      if (providerId) {
        const res = await providersAPI.get(providerId);
        setProfile(res.data?.provider || res.data || null);
      }
    } catch (e) {
      console.log('Error fetching provider profile:', e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const business = {
    name: profile?.business_name || profile?.full_name || user?.full_name || 'My Business',
    category: profile?.category || 'Not set',
    bio: profile?.bio || profile?.description || '',
    rating: profile?.rating || 0,
    reviews: profile?.review_count || profile?.reviews_count || 0,
    location: profile?.location || profile?.address || user?.city || 'Not set',
    serviceType: profile?.service_type || 'Not set',
    phone: profile?.phone || user?.phone || 'Not set',
    email: profile?.email || user?.email || 'Not set',
    hours: profile?.hours || profile?.working_hours || 'Not set',
    verified: profile?.verified || false,
  };

  const portfolio = profile?.portfolio || [];

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
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
            <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Business Profile</Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#35615D" />
        </View>
      </View>
    );
  }

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
            <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Business Profile</Text>
          </View>
          <TouchableOpacity
            className="bg-teal px-4 py-2.5 rounded-2xl"
            onPress={() => navigation.navigate('EditBusinessProfile')}
          >
            <Text className="text-sm text-white font-bold">Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View
          className="items-center mb-6 bg-white rounded-3xl py-6 px-4"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="w-20 h-20 rounded-full bg-teal items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">{business.name.charAt(0)}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800">{business.name}</Text>
          <Text className="text-sm text-gray-400 mt-0.5">{business.category}</Text>
          {business.verified && (
            <View className="flex-row items-center mt-2 gap-1 bg-teal-light px-3 py-1 rounded-full">
              <Ionicons name="checkmark-circle" size={14} color="#35615D" />
              <Text className="text-xs text-teal font-bold">Verified Provider</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View
          className="flex-row bg-white rounded-2xl p-4 mb-5"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="flex-1 items-center">
            <Text className="text-xl font-extrabold text-gray-800">
              {business.rating > 0 ? `${'\u2B50'} ${business.rating}` : '--'}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">Rating</Text>
          </View>
          <View className="w-px bg-gray-100" />
          <View className="flex-1 items-center">
            <Text className="text-xl font-extrabold text-gray-800">{business.reviews}</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Reviews</Text>
          </View>
        </View>

        {/* Bio */}
        <Text className="text-[17px] font-bold text-gray-800 mb-2">About</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-5"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <Text className="text-sm text-gray-600 leading-5">
            {business.bio || 'No bio set. Tap Edit to add a description of your business.'}
          </Text>
        </View>

        {/* Details */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Details</Text>
        <View
          className="gap-3 mb-5 bg-white rounded-2xl p-4"
          style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          {[
            { icon: 'location-outline', label: business.location },
            { icon: 'home-outline', label: business.serviceType },
            { icon: 'time-outline', label: business.hours },
            { icon: 'call-outline', label: business.phone },
            { icon: 'mail-outline', label: business.email },
          ].map((item, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-teal-light items-center justify-center">
                <Ionicons name={item.icon} size={16} color="#35615D" />
              </View>
              <Text className="text-sm text-gray-700">{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Portfolio */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Portfolio</Text>
        {portfolio.length === 0 ? (
          <View
            className="bg-white rounded-2xl p-6 mb-6 items-center"
            style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
          >
            <Ionicons name="images-outline" size={36} color="#9CA3AF" />
            <Text className="text-sm text-gray-400 mt-2">No portfolio yet</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2 mb-6">
            {portfolio.map((item, i) => (
              <View
                key={i}
                className="bg-white rounded-2xl items-center justify-center"
                style={{ width: '31%', aspectRatio: 1, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              >
                <Ionicons name="image-outline" size={28} color="#9CA3AF" />
              </View>
            ))}
          </View>
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </View>
  );
}
