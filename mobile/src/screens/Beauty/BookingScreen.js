import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { bookingsAPI, paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function BookingScreen({ navigation, route }) {
  const { user } = useAuth();
  const { provider, services = [] } = route.params || {};
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(services[0] || null);
  const [serviceType, setServiceType] = useState('home');
  const [submitting, setSubmitting] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en', { month: 'short' }),
      fullDate: d,
    };
  });

  const times = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString();

  const servicePrice = selectedService?.price || provider?.price || 5000;

  const handleConfirmBooking = async () => {
    if (!selectedTime) return;
    setSubmitting(true);
    try {
      const bookingDate = dates[selectedDate].fullDate;
      const [time, period] = selectedTime.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      bookingDate.setHours(hour, parseInt(minutes), 0, 0);

      const bookingData = {
        provider_id: provider?.id,
        service_id: selectedService?.id,
        service_name: selectedService?.name || provider?.service || 'Beauty Service',
        booking_date: bookingDate.toISOString(),
        booking_time: selectedTime,
        service_type: serviceType,
        notes: `${serviceType === 'home' ? 'Home Service' : 'Salon Visit'}`,
      };

      const bookingRes = await bookingsAPI.create(bookingData);
      const booking = bookingRes.data;

      // Collect full payment upfront
      const depositAmount = servicePrice;
      const payRes = await paymentsAPI.initialize({
        booking_id: booking.id,
        amount: depositAmount,
        email: user?.email || user?.phone + '@quickgift.ng',
      });
      const payData = payRes.data;

      if (payData.authorization_url) {
        // Navigate to Paystack WebView for card payment
        setSubmitting(false);
        navigation.navigate('PaystackWebView', {
          authorization_url: payData.authorization_url,
          reference: payData.reference,
          successScreen: 'HomeMain',
        });
        return;
      }

      // Dev mode fallback — no Paystack key configured
      navigation.replace('BookingConfirmed', {
        providerName: provider?.business_name || provider?.name,
        serviceName: selectedService?.name || provider?.service || 'Beauty Service',
        when: `${dates[selectedDate].day} ${dates[selectedDate].date} ${dates[selectedDate].month}, ${selectedTime}`,
        location: serviceType === 'home' ? 'Home Service' : 'Salon Visit',
        bookingId: booking?.booking_number || booking?.id,
      });
    } catch (err) {
      Alert.alert('Booking Failed', err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const providerName = provider?.business_name || provider?.name || 'Provider';

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="light" />
      {/* Teal header */}
      <View
        className="flex-row items-center justify-between px-5 bg-teal"
        style={{ paddingTop: Platform.OS === 'ios' ? 56 : 38, paddingBottom: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-[14px] bg-white/15 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-white" numberOfLines={1}>Book {providerName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20 }}>

        {/* Service Selection */}
        {services.length > 0 && (
          <View className="px-6 mb-7">
            <Text className="text-lg font-bold text-gray-800 mb-3">Select Service</Text>
            {services.map((svc) => (
              <TouchableOpacity
                key={svc.id}
                className={`flex-row items-center p-4 rounded-2xl mb-2.5 border-2 ${
                  selectedService?.id === svc.id
                    ? 'border-teal bg-teal-light'
                    : 'border-transparent bg-gray-50'
                }`}
                onPress={() => setSelectedService(svc)}
              >
                <View className="flex-1">
                  <Text
                    className={`text-sm font-bold ${
                      selectedService?.id === svc.id ? 'text-teal' : 'text-gray-800'
                    }`}
                  >
                    {svc.name}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {svc.duration_minutes ? `${svc.duration_minutes}min` : ''} · {formatPrice(svc.price)}
                  </Text>
                </View>
                {selectedService?.id === svc.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#1F4A45" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Service Type */}
        <View className="px-6 mb-7">
          <Text className="text-lg font-bold text-gray-800 mb-3">Service Location</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 p-4 rounded-2xl border-2 ${
                serviceType === 'home'
                  ? 'border-teal bg-teal-light'
                  : 'border-transparent bg-gray-50'
              }`}
              onPress={() => setServiceType('home')}
            >
              <Ionicons
                name="home-outline"
                size={20}
                color={serviceType === 'home' ? '#1F4A45' : '#9A948A'}
              />
              <Text
                className={`text-sm font-bold ${
                  serviceType === 'home' ? 'text-teal' : 'text-gray-400'
                }`}
              >
                Home Service
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 p-4 rounded-2xl border-2 ${
                serviceType === 'salon'
                  ? 'border-teal bg-teal-light'
                  : 'border-transparent bg-gray-50'
              }`}
              onPress={() => setServiceType('salon')}
            >
              <Ionicons
                name="business-outline"
                size={20}
                color={serviceType === 'salon' ? '#1F4A45' : '#9A948A'}
              />
              <Text
                className={`text-sm font-bold ${
                  serviceType === 'salon' ? 'text-teal' : 'text-gray-400'
                }`}
              >
                Visit Salon
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View className="px-6 mb-7">
          <Text className="text-lg font-bold text-gray-800 mb-3">Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {dates.map((d, i) => (
              <TouchableOpacity
                key={i}
                className={`w-[70px] items-center py-3 rounded-2xl ${
                  selectedDate === i ? 'bg-teal' : 'bg-gray-50'
                }`}
                onPress={() => setSelectedDate(i)}
                style={selectedDate === i ? {
                  shadowColor: '#1F4A45',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                } : undefined}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedDate === i ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  {d.day}
                </Text>
                <Text
                  className={`text-2xl font-extrabold my-0.5 ${
                    selectedDate === i ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {d.date}
                </Text>
                <Text
                  className={`text-[10px] ${
                    selectedDate === i ? 'text-white/70' : 'text-gray-300'
                  }`}
                >
                  {d.month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View className="px-6 mb-7">
          <Text className="text-lg font-bold text-gray-800 mb-3">Select Time</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {times.map((time) => (
              <TouchableOpacity
                key={time}
                className={`px-5 py-3 rounded-2xl ${
                  selectedTime === time ? 'bg-teal' : 'bg-gray-50'
                }`}
                onPress={() => setSelectedTime(time)}
                style={selectedTime === time ? {
                  shadowColor: '#1F4A45',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 4,
                } : undefined}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedTime === time ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Pinned bottom bar */}
      <View
        className="flex-row items-center gap-4 px-5 bg-white"
        style={{ paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 18, borderTopWidth: 1, borderTopColor: '#F5F0E7' }}
      >
        <View>
          <Text className="text-xs text-ink-caption font-semibold">Total</Text>
          <Text className="text-[22px] font-extrabold text-ink">{formatPrice(servicePrice)}</Text>
        </View>
        <Button
          title={submitting ? 'Booking…' : `Confirm · ${formatPrice(servicePrice)}`}
          onPress={handleConfirmBooking}
          disabled={selectedTime === null || submitting}
          variant="terracotta"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
