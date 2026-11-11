import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Platform, Share,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '../../components/common/IconCompat';
import { referralAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../utils/errors';
import { tapLight, notifySuccess } from '../../utils/haptics';

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const cardShadow = {
  shadowColor: '#211F1C',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
};

/**
 * Refer a friend. Everything here comes from the server: the personal code,
 * the current reward, and the friends who joined with the code. Both people
 * are paid into their wallets when the friend's first order is delivered.
 */
export default function ReferFriendScreen({ navigation }) {
  const { isAuthenticated, isGuest, logout } = useAuth();
  const signedIn = !!isAuthenticated && !isGuest;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(signedIn);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!signedIn) return;
    try {
      const res = await referralAPI.mine();
      setData(res.data);
      setError('');
    } catch (err) {
      setError(apiError(err, 'We could not load your referral code. Please try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [signedIn]);

  // Reload whenever the screen is opened, so a friend who has just joined shows up.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const code = data?.code || '';
  const reward = naira(data?.reward_amount ?? 500);
  const minOrder = Number(data?.min_order_amount) || 0;
  const firstOrder = minOrder > 0 ? `first order of ${naira(minOrder)} or more` : 'first order';
  const referrals = data?.referrals || [];
  const live = !!data?.enabled && Number(data?.reward_amount) > 0;

  const steps = [
    { title: 'Share your code', desc: 'Send your personal code to friends and family', icon: 'share-outline', color: '#1F4A45' },
    { title: 'They sign up', desc: 'Your friend enters the code when creating an account', icon: 'person-add-outline', color: '#4C7CB0' },
    { title: 'You both earn', desc: `You each get ${reward} in your wallet when their ${firstOrder} is delivered`, icon: 'gift-outline', color: '#E8632F' },
  ];

  const handleShare = async () => {
    if (!code) return;
    tapLight();
    try {
      await Share.share({
        message:
          `Send gifts and book trusted services on QuickGift. Sign up with my code ${code} ` +
          `and we each get ${reward} in our wallets when your ${firstOrder} is delivered.\n\n` +
          'https://www.quickgift.ng',
      });
    } catch {
      // The share sheet was dismissed or is unavailable: nothing to do.
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    notifySuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const header = (
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

        <View className="bg-white/15 rounded-3xl p-5 items-center">
          <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Earned</Text>
          <Text className="text-white text-4xl font-extrabold mt-1">{naira(data?.total_earned)}</Text>
          <Text className="text-white/50 text-xs mt-1">
            {data?.rewarded_count || 0} successful · {data?.pending_count || 0} pending
          </Text>
        </View>
      </View>
      <View className="bg-gray-50 h-5" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
    </View>
  );

  // Guests have no code: explain, and offer the way in.
  if (!signedIn) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="light" />
        {header}
        <View className="items-center px-8 pt-10">
          <View className="w-16 h-16 rounded-full bg-teal-light items-center justify-center mb-4">
            <Ionicons name="people-outline" size={28} color="#1F4A45" />
          </View>
          <Text className="text-base font-bold text-gray-800 mb-1">Sign in to get your code</Text>
          <Text className="text-xs text-gray-400 text-center leading-4 mb-6">
            Create an account or sign in, then share your personal code and earn when friends order.
          </Text>
          <TouchableOpacity className="bg-teal px-8 py-3.5 rounded-2xl" onPress={() => logout()}>
            <Text className="text-white font-bold text-[15px]">Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      {header}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#1F4A45"
          />
        }
      >
        {/* Referral code */}
        <View
          className="mx-5 -mt-1 bg-white rounded-2xl p-5 mb-5"
          style={{ ...cardShadow, shadowColor: '#1F4A45', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}
        >
          <Text className="text-[13px] font-bold text-gray-400 text-center mb-3">YOUR REFERRAL CODE</Text>

          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#1F4A45" />
            </View>
          ) : error ? (
            <View className="items-center py-4">
              <Text className="text-[13px] text-gray-500 text-center leading-5 mb-4">{error}</Text>
              <TouchableOpacity
                className="border-[1.5px] border-teal px-6 py-2.5 rounded-xl"
                onPress={() => { setLoading(true); load(); }}
              >
                <Text className="text-teal font-bold text-[13.5px]">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                className="bg-gray-50 rounded-2xl py-4 items-center border-2 border-dashed border-gray-200 mb-4"
                onPress={handleCopyCode}
                activeOpacity={0.7}
              >
                <Text className="text-2xl font-extrabold text-teal tracking-widest">{code}</Text>
                <View className="flex-row items-center gap-1 mt-1.5">
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={14}
                    color={copied ? '#3E8E63' : '#9A948A'}
                  />
                  <Text className="text-[11px] text-gray-400 font-semibold">
                    {copied ? 'Copied!' : 'Tap to copy'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-teal flex-row items-center justify-center py-4 rounded-2xl gap-2.5"
                style={{
                  shadowColor: '#1F4A45',
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

              {!live ? (
                <Text className="text-[12px] text-gray-400 text-center mt-3 leading-4">
                  Referral rewards are paused at the moment. Your code still works once they are back.
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* How it works */}
        <View className="px-5 mb-5">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">How It Works</Text>
          <View className="bg-white rounded-2xl p-4 gap-4" style={cardShadow}>
            {steps.map((item) => (
              <View key={item.title} className="flex-row items-center gap-3.5">
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: item.color + '15' }}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-800">{item.title}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5 leading-4">{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Friends who joined */}
        <View className="px-5 mb-5">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Your Referrals ({referrals.length})
          </Text>
          {referrals.length === 0 ? (
            <View className="items-center py-8 px-8">
              <View className="w-16 h-16 rounded-full bg-teal-light items-center justify-center mb-4">
                <Ionicons name="people-outline" size={28} color="#1F4A45" />
              </View>
              <Text className="text-base font-bold text-gray-800 mb-1">No referrals yet</Text>
              <Text className="text-xs text-gray-400 text-center leading-4">
                Share your code with friends to start earning rewards
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-2xl overflow-hidden" style={cardShadow}>
              {referrals.map((ref, i) => {
                const earned = ref.status === 'rewarded';
                const waiting = ref.status === 'pending';
                return (
                  <View
                    key={`${ref.name}-${ref.created_at}-${i}`}
                    className={`flex-row items-center px-4 py-3.5 ${
                      i < referrals.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-teal-light items-center justify-center mr-3">
                      <Text className="text-sm font-bold text-teal">{String(ref.name || '?').charAt(0)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-800">{ref.name}</Text>
                      <Text className="text-[11px] text-gray-400 mt-0.5">
                        {waiting ? 'Joined' : earned ? 'Rewarded' : 'Joined'} {formatDate(earned ? ref.rewarded_at : ref.created_at)}
                      </Text>
                    </View>
                    {earned ? (
                      <View className="items-end">
                        <Text className="text-sm font-extrabold text-green-600">+{naira(ref.reward_amount)}</Text>
                        <Text className="text-[10px] text-green-500 font-semibold">Earned</Text>
                      </View>
                    ) : waiting ? (
                      <View className="bg-amber-50 px-2.5 py-1 rounded-full">
                        <Text className="text-[10px] text-amber-600 font-bold">Awaiting first order</Text>
                      </View>
                    ) : (
                      <View className="bg-gray-100 px-2.5 py-1 rounded-full">
                        <Text className="text-[10px] text-gray-500 font-bold">No reward</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Reward summary */}
        {live ? (
          <View className="mx-5 mb-4">
            <View className="bg-orange-light rounded-2xl p-4 flex-row items-center gap-3.5">
              <View className="w-14 h-14 rounded-2xl bg-orange/10 items-center justify-center">
                <Ionicons name="gift-outline" size={26} color="#E8632F" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-800">Earn {reward} per friend</Text>
                <Text className="text-xs text-gray-500 mt-0.5 leading-4">
                  You and your friend each get {reward} in your wallet when their {firstOrder} is delivered.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
