import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { ordersAPI, bookingsAPI, providersAPI } from '../../services/api';

const logoSmall = require('../../../assets/images/logo-small.png');

const BUYER_MENU = [
  { icon: 'wallet-outline', label: 'Wallet', sub: 'Balance & transactions', color: '#35615D', screen: 'WalletScreen' },
  { icon: 'heart-outline', label: 'Favourites', sub: 'Saved gifts & providers', color: '#EF4444', screen: 'Favourites' },
  { icon: 'notifications-outline', label: 'Reminders', sub: 'Birthday & event alerts', color: '#FD8950', screen: 'Reminders' },
  { icon: 'location-outline', label: 'Addresses', sub: 'Delivery addresses', color: '#3B82F6', screen: 'Addresses' },
  { icon: 'people-outline', label: 'Refer a Friend', sub: 'Earn \u20A6500 per referral', color: '#8B5CF6', screen: 'ReferFriend' },
  { icon: 'help-circle-outline', label: 'Help & Support', sub: 'FAQs and chat support', color: '#10B981', screen: 'HelpSupport' },
  { icon: 'settings-outline', label: 'Settings', sub: 'Account preferences', color: '#6B7280', screen: 'Settings' },
];

const PROVIDER_MENU = [
  { icon: 'briefcase-outline', label: 'Business Profile', sub: 'Your public business page', color: '#35615D', screen: 'BusinessProfile' },
  { icon: 'time-outline', label: 'Availability', sub: 'Working hours & days off', color: '#3B82F6', screen: 'AvailabilityScreen' },
  { icon: 'wallet-outline', label: 'Wallet & Earnings', sub: 'Balance, payouts & history', color: '#10B981', screen: 'WalletScreen' },
  { icon: 'pricetag-outline', label: 'My Services', sub: 'Manage your services', color: '#FD8950', screen: 'ProviderServices' },
  { icon: 'cube-outline', label: 'My Products', sub: 'Manage gift products', color: '#8B5CF6', screen: 'ProviderProducts' },
  { icon: 'star-outline', label: 'Reviews', sub: 'Client feedback & ratings', color: '#F59E0B', screen: 'ProviderReviews' },
  { icon: 'help-circle-outline', label: 'Help & Support', sub: 'FAQs and chat support', color: '#6B7280', screen: 'HelpSupport' },
  { icon: 'settings-outline', label: 'Settings', sub: 'Account preferences', color: '#6B7280', screen: 'Settings' },
];

export default function ProfileScreen({ navigation }) {
  const { user, isGuest, isAuthenticated, logout } = useAuth();
  const [stats, setStats] = useState({ orders: 0, gifts: 0, bookings: 0 });
  const [providerStatus, setProviderStatus] = useState(null); // 'pending', 'verified', 'suspended'

  const isProvider = user?.role === 'provider';
  const menuItems = isProvider ? PROVIDER_MENU : BUYER_MENU;

  useEffect(() => {
    if (isAuthenticated && !isGuest) {
      loadStats();
      if (isProvider) loadProviderStatus();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const [ordersRes, bookingsRes] = await Promise.allSettled([
        ordersAPI.list(),
        bookingsAPI.list(),
      ]);
      const orderCount = ordersRes.status === 'fulfilled'
        ? (ordersRes.value.data?.items?.length || ordersRes.value.data?.length || 0) : 0;
      const bookingCount = bookingsRes.status === 'fulfilled'
        ? (bookingsRes.value.data?.items?.length || bookingsRes.value.data?.length || 0) : 0;
      setStats({ orders: orderCount + bookingCount, gifts: orderCount, bookings: bookingCount });
    } catch {}
  };

  const loadProviderStatus = async () => {
    try {
      const res = await providersAPI.me();
      setProviderStatus(res.data?.status || 'pending');
    } catch {
      setProviderStatus('pending');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleMenuPress = (item) => {
    if (item.screen) navigation.navigate(item.screen);
  };

  const displayName = isGuest ? 'Guest User' : (user?.full_name || 'User');
  const displayPhone = isGuest ? '' : (user?.phone || '');
  const initials = displayName.charAt(0).toUpperCase();
  const { balance: walletBalance } = useWallet();

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />

      {/* Fixed teal header - stays above scroll */}
      <View
        className="bg-teal"
        style={{ paddingTop: Platform.OS === 'ios' ? 50 : 30 }}
      >
        <View className="px-5 pb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-extrabold text-white tracking-tight">Profile</Text>
            <Image source={logoSmall} style={{ width: 28, height: 28, resizeMode: 'contain', tintColor: 'rgba(255,255,255,0.4)' }} />
          </View>

          <View className="flex-row items-center">
            <View className="w-[68px] h-[68px] rounded-3xl bg-white/15 items-center justify-center mr-4">
              <Text className="text-[26px] font-extrabold text-white">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">{displayName}</Text>
              {displayPhone ? (
                <Text className="text-sm text-white/60 mt-0.5">{displayPhone}</Text>
              ) : null}
              {isProvider && providerStatus === 'verified' && (
                <View className="flex-row items-center mt-1.5 bg-white/15 self-start px-2.5 py-1 rounded-full gap-1">
                  <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
                  <Text className="text-[10px] text-white font-semibold">Verified</Text>
                </View>
              )}
              {isProvider && providerStatus === 'pending' && (
                <View className="flex-row items-center mt-1.5 bg-amber-400/20 self-start px-2.5 py-1 rounded-full gap-1">
                  <Ionicons name="hourglass-outline" size={12} color="#FBBF24" />
                  <Text className="text-[10px] text-amber-200 font-semibold">Pending Approval</Text>
                </View>
              )}
              {isProvider && providerStatus === 'suspended' && (
                <View className="flex-row items-center mt-1.5 bg-red-400/20 self-start px-2.5 py-1 rounded-full gap-1">
                  <Ionicons name="close-circle" size={12} color="#F87171" />
                  <Text className="text-[10px] text-red-300 font-semibold">Suspended</Text>
                </View>
              )}
              {isGuest && (
                <Text className="text-sm text-white/50 mt-0.5">Sign in for full experience</Text>
              )}
            </View>
            {!isGuest && (
              <TouchableOpacity
                className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center"
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Stats card - overlaps header with negative margin */}
        <View
          className="mx-5 bg-white rounded-3xl p-5 -mt-1 mb-4"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-extrabold text-gray-800">{stats.orders}</Text>
              <Text className="text-[11px] text-gray-400 mt-1 font-medium">{isProvider ? 'Jobs' : 'Orders'}</Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-extrabold text-gray-800">{stats.gifts}</Text>
              <Text className="text-[11px] text-gray-400 mt-1 font-medium">{isProvider ? 'Products' : 'Gifts Sent'}</Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-extrabold text-gray-800">{stats.bookings}</Text>
              <Text className="text-[11px] text-gray-400 mt-1 font-medium">Bookings</Text>
            </View>
          </View>
        </View>

        {/* Guest sign in prompt */}
        {isGuest && (
          <TouchableOpacity
            className="flex-row items-center gap-3 mx-5 mb-4 p-4 bg-teal-light rounded-2xl"
            onPress={handleLogout}
          >
            <Ionicons name="log-in-outline" size={22} color="#35615D" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-teal">Sign in to your account</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Access all features and track orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#35615D" />
          </TouchableOpacity>
        )}

        {/* Wallet Quick Card */}
        {!isGuest && (
          <View
            className="mx-5 mb-4 bg-white rounded-2xl p-4 flex-row items-center"
            style={{
              shadowColor: '#1F2937',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View className="w-12 h-12 rounded-2xl bg-orange-light items-center justify-center mr-3">
              <Ionicons name="wallet" size={22} color="#FD8950" />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] text-gray-400 font-medium">Wallet Balance</Text>
              <Text className="text-xl font-extrabold text-gray-800">{'\u20A6'}{walletBalance.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              className="bg-teal px-5 py-2.5 rounded-xl"
              style={{
                shadowColor: '#35615D',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={() => navigation.navigate(isProvider ? 'WithdrawScreen' : 'WalletScreen')}
            >
              <Text className="text-xs text-white font-bold">{isProvider ? 'Withdraw' : 'Top Up'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items */}
        <View
          className="mx-5 bg-white rounded-3xl overflow-hidden mb-4"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              className={`flex-row items-center gap-3.5 px-4 py-4 ${
                i < menuItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
              activeOpacity={0.6}
              onPress={() => handleMenuPress(item)}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: item.color + '12' }}
              >
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-gray-800">{item.label}</Text>
                <Text className="text-[11px] text-gray-400 mt-0.5">{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="mx-5 bg-white rounded-2xl flex-row items-center justify-center gap-2 py-4 mb-4"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-sm text-red-500 font-bold">
            {isGuest ? 'Exit Guest Mode' : 'Log Out'}
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-[10px] text-gray-300 mb-2">QuickGift v2.0.0</Text>
        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
