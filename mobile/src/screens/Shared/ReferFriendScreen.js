import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Share, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const REFERRAL_CODE = 'QUICKGIFT500';

const MOCK_REFERRALS = [
  { id: '1', name: 'Amina O.', date: 'Mar 15, 2026', status: 'completed', earned: 500 },
  { id: '2', name: 'Tunde K.', date: 'Mar 10, 2026', status: 'completed', earned: 500 },
  { id: '3', name: 'Blessing E.', date: 'Mar 5, 2026', status: 'pending', earned: 0 },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Share your code', desc: 'Send your unique referral code to friends', icon: 'share-outline', color: '#35615D' },
  { step: '2', title: 'They sign up', desc: 'Your friend creates an account using your code', icon: 'person-add-outline', color: '#3B82F6' },
  { step: '3', title: 'You both earn', desc: 'Get ₦500 each when they make their first order', icon: 'gift-outline', color: '#FD8950' },
];

export default function ReferFriendScreen({ navigation }) {
  const [copied, setCopied] = useState(false);
  const totalEarned = MOCK_REFERRALS.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.earned, 0);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join QuickGift and get ₦500 off your first order! Use my referral code: ${REFERRAL_CODE}\n\nDownload QuickGift now and send amazing gifts to loved ones. 🎁`,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      {/* Teal Hero Header */}
      <View className="bg-teal" style={{ paddingTop: Platform.OS === 'ios' ? 55 : 35 }}>
        <View className="px-5 pb-6">
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Refer a Friend</Text>
          </View>

          {/* Earnings Card */}
          <View
            className="bg-white/15 rounded-3xl p-5 items-center"
          >
            <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Earned</Text>
            <Text className="text-white text-4xl font-extrabold mt-1">
              ₦{totalEarned.toLocaleString()}
            </Text>
            <Text className="text-white/50 text-xs mt-1">
              {MOCK_REFERRALS.filter(r => r.status === 'completed').length} successful referrals
            </Text>
          </View>
        </View>

        {/* Curved transition */}
        <View className="bg-gray-50 h-5" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Referral Code Card */}
        <View
          className="mx-5 -mt-1 bg-white rounded-2xl p-5 mb-5"
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <Text className="text-[13px] font-bold text-gray-400 text-center mb-3">YOUR REFERRAL CODE</Text>
          <TouchableOpacity
            className="bg-gray-50 rounded-2xl py-4 items-center border-2 border-dashed border-gray-200 mb-4"
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <Text className="text-2xl font-extrabold text-teal tracking-widest">{REFERRAL_CODE}</Text>
            <View className="flex-row items-center gap-1 mt-1.5">
              <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={14} color={copied ? '#10B981' : '#9CA3AF'} />
              <Text className="text-[11px] text-gray-400 font-semibold">
                {copied ? 'Copied!' : 'Tap to copy'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-teal flex-row items-center justify-center py-4 rounded-2xl gap-2.5"
            style={{
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text className="text-base text-white font-bold">Share with Friends</Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View className="px-5 mb-5">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">How It Works</Text>
          <View
            className="bg-white rounded-2xl p-4 gap-4"
            style={{
              shadowColor: '#1F2937',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {HOW_IT_WORKS.map((item, i) => (
              <View key={i} className="flex-row items-center gap-3.5">
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: item.color + '15' }}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-800">{item.title}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{item.desc}</Text>
                </View>
                {i < HOW_IT_WORKS.length - 1 && (
                  <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Referral History */}
        <View className="px-5 mb-5">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Your Referrals ({MOCK_REFERRALS.length})
          </Text>
          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              shadowColor: '#1F2937',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {MOCK_REFERRALS.map((ref, i) => (
              <View
                key={ref.id}
                className={`flex-row items-center px-4 py-3.5 ${
                  i < MOCK_REFERRALS.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <View className="w-10 h-10 rounded-xl bg-teal-light items-center justify-center mr-3">
                  <Text className="text-sm font-bold text-teal">{ref.name.charAt(0)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-800">{ref.name}</Text>
                  <Text className="text-[11px] text-gray-400 mt-0.5">{ref.date}</Text>
                </View>
                {ref.status === 'completed' ? (
                  <View className="items-end">
                    <Text className="text-sm font-extrabold text-green-600">+₦{ref.earned}</Text>
                    <Text className="text-[10px] text-green-500 font-semibold">Earned</Text>
                  </View>
                ) : (
                  <View className="bg-amber-50 px-2.5 py-1 rounded-full">
                    <Text className="text-[10px] text-amber-600 font-bold">Pending</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Reward Card */}
        <View className="mx-5 mb-4">
          <View
            className="bg-orange-light rounded-2xl p-4 flex-row items-center gap-3.5"
          >
            <View className="w-14 h-14 rounded-2xl bg-orange/10 items-center justify-center">
              <Text style={{ fontSize: 28 }}>🎁</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-800">Earn ₦500 per friend</Text>
              <Text className="text-xs text-gray-500 mt-0.5 leading-4">
                Both you and your friend get ₦500 credit when they make their first order!
              </Text>
            </View>
          </View>
        </View>

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
