import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { bookingsAPI, providersAPI, uploadAPI } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function ProviderDashboard({ navigation }) {
  const { user, updateProfile, updateUser } = useAuth();
  const { refreshLocation, coords } = useLocation();
  // Use business name on provider screens, personal name only as last fallback
  const displayName = providerData?.business_name || user?.full_name?.split(' ')[0] || 'Provider';

  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [providerData, setProviderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupDismissed, setSetupDismissed] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsRes, providerRes] = await Promise.all([
        bookingsAPI.list().catch(() => ({ data: [] })),
        providersAPI.me().catch(() => ({ data: null })),
      ]);
      const all = bookingsRes.data?.bookings || bookingsRes.data || [];
      setBookings(Array.isArray(all) ? all : []);

      const prov = providerRes.data;
      if (prov) {
        setProviderData(prov);
        setServices(prov.services || []);
      }
    } catch (e) {
      console.log('Error fetching data:', e);
      setBookings([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [user?.provider_id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const todayBookings = bookings.filter((b) => {
    const bDate = b.date || b.booking_date || '';
    return bDate.startsWith(todayStr);
  });
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  ).slice(0, 5);

  const totalEarnings = completedBookings.reduce(
    (sum, b) => sum + (b.price || b.amount || 0), 0
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthEarnings = completedBookings
    .filter((b) => {
      const d = new Date(b.date || b.booking_date || b.completed_at || '');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, b) => sum + (b.price || b.amount || 0), 0);

  const rating = user?.rating || user?.provider_rating || 0;

  // Determine business type from provider data
  const providerServiceType = providerData?.service_type || '';
  const isSeller = providerServiceType === 'Seller' || providerServiceType === 'Both';
  const isServiceProv = providerServiceType !== 'Seller';
  const providerStatus = providerData?.status || 'pending';
  const isPendingApproval = providerStatus === 'pending';

  // Setup checklist — show when provider is new
  const hasServices = services.length > 0;
  const hasBookings = bookings.length > 0;
  const hasAvatar = !!user?.avatar_url;
  const hasLocation = !!(user?.lat && user?.lng) || !!(coords?.lat && coords?.lng);
  const isNewProvider = (!hasServices && !hasBookings && !setupDismissed) || isPendingApproval;

  const [locationLoading, setLocationLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleSetLocation = async () => {
    setLocationLoading(true);
    try {
      const result = await refreshLocation();
      if (result) {
        await updateProfile({ lat: result.lat, lng: result.lng, city: result.areaName || user?.city });
        updateUser({ lat: result.lat, lng: result.lng });
        Alert.alert('Location Set', `Your location has been set to ${result.areaName || 'your current position'}`);
      } else {
        Alert.alert('Permission Needed', 'Please enable location access in your device settings.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUploadAvatar = async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert('Permission Needed', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;

      setAvatarLoading(true);
      const uri = result.assets[0].uri;
      const uploadRes = await uploadAPI.image(uri);
      const avatarUrl = uploadRes.data?.url || uploadRes.data?.secure_url;
      if (avatarUrl) {
        await updateProfile({ avatar_url: avatarUrl });
        updateUser({ avatar_url: avatarUrl });
        Alert.alert('Photo Updated', 'Your profile photo has been uploaded!');
      }
    } catch (e) {
      Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const setupSteps = [
    // Dynamic first step based on business type
    isSeller ? {
      id: 'products',
      label: 'Add your first product',
      description: 'List what you sell — cakes, flowers, hampers, etc.',
      icon: 'cube-outline',
      done: false, // TODO: check product count when product API is ready
      action: () => navigation.navigate('ProductForm', { mode: 'add' }),
    } : {
      id: 'services',
      label: 'Add your first service',
      description: 'Tell clients what you offer and set your prices',
      icon: 'pricetag-outline',
      done: hasServices,
      action: () => navigation.navigate('ServiceForm', { mode: 'add' }),
    },
    {
      id: 'avatar',
      label: 'Upload a profile photo',
      description: 'Help clients recognize your brand',
      icon: 'camera-outline',
      done: hasAvatar,
      loading: avatarLoading,
      action: handleUploadAvatar,
    },
    {
      id: 'location',
      label: 'Set your exact location',
      description: 'So nearby clients can find you easily',
      icon: 'location-outline',
      done: hasLocation,
      loading: locationLoading,
      action: handleSetLocation,
    },
  ];
  const completedSteps = setupSteps.filter(s => s.done).length;
  const totalSteps = setupSteps.length;

  const stats = {
    todayBookings: todayBookings.length,
    pendingRequests: pendingBookings.length,
    completedJobs: completedBookings.length,
    totalEarnings,
    thisMonthEarnings,
    rating,
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="px-5 pb-5 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-extrabold text-gray-800">Hi {displayName}</Text>
            <Text className="text-sm text-gray-400 mt-0.5">Here's your business overview</Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.navigate('ProviderNotifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Pending Approval Banner */}
        {isPendingApproval && (
          <View
            className="mx-5 mt-4 bg-amber-50 rounded-2xl p-4 flex-row items-center gap-3 border border-amber-200"
          >
            <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center">
              <Ionicons name="hourglass-outline" size={22} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-amber-800">Pending Approval</Text>
              <Text className="text-[11px] text-amber-600 mt-0.5 leading-4">
                Your store is under review. Once approved by our team, customers will be able to find you. Complete your setup below in the meantime!
              </Text>
            </View>
          </View>
        )}

        {/* Setup Checklist — for new providers */}
        {isNewProvider && (
          <View className="mx-5 mt-4 bg-white rounded-3xl overflow-hidden"
            style={{
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Header */}
            <View className="bg-gradient-to-r from-teal to-teal-dark p-5 bg-teal">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-lg font-extrabold">
                    {completedSteps === 0
                      ? (isSeller ? "Let's set up your store!" : "Let's set up your profile!")
                      : "Almost there!"}
                  </Text>
                  <Text className="text-white/60 text-xs mt-1">
                    {isSeller
                      ? 'Complete these steps to start selling'
                      : 'Complete these steps to start getting clients'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSetupDismissed(true)}
                  className="w-8 h-8 rounded-full bg-white/15 items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              {/* Progress bar */}
              <View className="mt-4 flex-row items-center gap-2.5">
                <View className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-white rounded-full"
                    style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                  />
                </View>
                <Text className="text-white/80 text-xs font-bold">{completedSteps}/{totalSteps}</Text>
              </View>
            </View>

            {/* Steps */}
            <View className="p-4 gap-2">
              {setupSteps.map((step) => (
                <TouchableOpacity
                  key={step.id}
                  className={`flex-row items-center gap-3 p-3.5 rounded-2xl ${
                    step.done ? 'bg-green-50/80' : 'bg-gray-50'
                  }`}
                  onPress={() => {
                    if (!step.done && !step.loading && step.action) step.action();
                  }}
                  activeOpacity={step.done ? 1 : 0.7}
                  disabled={step.loading}
                >
                  <View className={`w-10 h-10 rounded-xl items-center justify-center ${
                    step.done ? 'bg-green-100' : 'bg-teal-light'
                  }`}>
                    {step.loading ? (
                      <ActivityIndicator size="small" color="#35615D" />
                    ) : step.done ? (
                      <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    ) : (
                      <Ionicons name={step.icon} size={20} color="#35615D" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[13px] font-bold ${
                      step.done ? 'text-green-700 line-through' : 'text-gray-800'
                    }`}>
                      {step.label}
                    </Text>
                    <Text className={`text-[11px] mt-0.5 ${
                      step.done ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {step.loading ? 'Please wait...' : step.done ? 'Completed' : step.description}
                    </Text>
                  </View>
                  {!step.done && !step.loading && (
                    <View className="w-7 h-7 rounded-full bg-teal items-center justify-center">
                      <Ionicons name="arrow-forward" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Earnings Card */}
        <View
          className="mx-5 mt-4 bg-teal rounded-3xl p-6 overflow-hidden"
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.6)" />
            <Text className="text-white/60 text-sm font-medium">This Month's Earnings</Text>
          </View>
          <Text className="text-white text-[34px] font-extrabold tracking-tight">
            {'\u20A6'}{stats.thisMonthEarnings.toLocaleString()}
          </Text>
          <View className="flex-row mt-5 gap-6">
            <View>
              <Text className="text-white/50 text-[10px] font-medium">Total Earnings</Text>
              <Text className="text-white text-base font-bold">{'\u20A6'}{stats.totalEarnings.toLocaleString()}</Text>
            </View>
            <View>
              <Text className="text-white/50 text-[10px] font-medium">Completed</Text>
              <Text className="text-white text-base font-bold">{stats.completedJobs} jobs</Text>
            </View>
            <View>
              <Text className="text-white/50 text-[10px] font-medium">Rating</Text>
              <Text className="text-white text-base font-bold">{stats.rating || '--'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row px-5 mt-5 gap-3">
          {[
            { value: stats.pendingRequests, label: 'Pending', color: '#FD8950', bg: 'bg-orange-light' },
            { value: stats.todayBookings, label: 'Today', color: '#35615D', bg: 'bg-teal-light' },
            { value: stats.completedJobs, label: 'Done', color: '#10B981', bg: 'bg-green-50' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              className={`flex-1 ${item.bg} rounded-2xl py-4 items-center`}
              style={{
                shadowColor: item.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text className="text-[26px] font-extrabold" style={{ color: item.color }}>{item.value}</Text>
              <Text className="text-[11px] text-gray-500 mt-0.5 font-medium">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="px-5 mt-6">
          <Text className="text-[17px] font-bold text-gray-800 mb-3">Quick Actions</Text>
          <View className="flex-row gap-3 mb-3">
            {[
              { icon: 'calendar-outline', label: 'Schedule', screen: 'ProviderSchedule' },
              { icon: 'pricetag-outline', label: 'Services', screen: 'ProviderServices' },
              { icon: 'cube-outline', label: 'Products', screen: 'ProviderProducts' },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                className="flex-1 bg-white rounded-2xl py-4 items-center gap-2"
                style={{
                  shadowColor: '#1F2937',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View className="w-10 h-10 rounded-xl bg-teal-light items-center justify-center">
                  <Ionicons name={action.icon} size={20} color="#35615D" />
                </View>
                <Text className="text-[11px] font-semibold text-gray-600">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            {[
              { icon: 'star-outline', label: 'Reviews', screen: 'ProviderReviews' },
              { icon: 'time-outline', label: 'Availability', screen: 'AvailabilityScreen' },
              { icon: 'cash-outline', label: 'Earnings', screen: 'WalletScreen' },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                className="flex-1 bg-white rounded-2xl py-4 items-center gap-2"
                style={{
                  shadowColor: '#1F2937',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View className="w-10 h-10 rounded-xl bg-teal-light items-center justify-center">
                  <Ionicons name={action.icon} size={20} color="#35615D" />
                </View>
                <Text className="text-[11px] font-semibold text-gray-600">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Bookings */}
        <View className="px-5 mt-6 mb-3">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[17px] font-bold text-gray-800">Upcoming Bookings</Text>
            <TouchableOpacity
              className="flex-row items-center gap-0.5"
              onPress={() => navigation.getParent()?.navigate('Bookings')}
            >
              <Text className="text-[13px] text-teal font-semibold">See All</Text>
              <Ionicons name="chevron-forward" size={14} color="#35615D" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#35615D" />
            </View>
          ) : upcomingBookings.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="text-base font-bold text-gray-800 mt-3">No upcoming bookings</Text>
              <Text className="text-sm text-gray-400 mt-1">New bookings will appear here</Text>
            </View>
          ) : (
            upcomingBookings.map((booking) => {
              const clientName = booking.client_name || booking.client || 'Client';
              const serviceName = booking.service_name || booking.service || 'Service';
              const bookingTime = booking.time || booking.booking_time || '';
              return (
                <TouchableOpacity
                  key={booking.id || booking._id}
                  className="flex-row items-center bg-white rounded-2xl p-4 mb-3 gap-3"
                  style={{
                    shadowColor: '#1F2937',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                  onPress={() => navigation.navigate('BookingDetail', { booking })}
                >
                  <View className="w-12 h-12 rounded-2xl bg-teal-light items-center justify-center">
                    <Text className="text-teal font-extrabold text-lg">
                      {clientName.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-gray-800">{clientName}</Text>
                    <Text className="text-xs text-gray-400">{serviceName}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-bold text-gray-800">{bookingTime}</Text>
                    <View className={`mt-1 px-2 py-0.5 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-50' : 'bg-orange-light'
                    }`}>
                      <Text className={`text-[10px] font-bold ${
                        booking.status === 'confirmed' ? 'text-green-600' : 'text-orange'
                      }`}>
                        {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
