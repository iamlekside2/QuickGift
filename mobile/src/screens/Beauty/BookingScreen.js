import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { bookingsAPI } from '../../services/api';
import Button from '../../components/common/Button';

export default function BookingScreen({ navigation, route }) {
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
        service_type: serviceType,
        notes: `${serviceType === 'home' ? 'Home Service' : 'Salon Visit'}`,
      };

      await bookingsAPI.create(bookingData);
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your appointment with ${provider?.business_name || provider?.name} has been booked for ${dates[selectedDate].day} ${dates[selectedDate].date} ${dates[selectedDate].month} at ${selectedTime}.`,
        [{ text: 'View Orders', onPress: () => navigation.navigate('Orders') }]
      );
    } catch (err) {
      Alert.alert('Booking Failed', err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const servicePrice = selectedService?.price || provider?.price || 5000;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* Fixed Header - stays above scroll */}
      <View
        className="flex-row items-center justify-between px-6 pb-4 bg-white"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <TouchableOpacity
          className="w-11 h-11 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Book Appointment</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Provider Info Card */}
        <View
          className="flex-row items-center gap-3.5 mx-6 p-4 bg-teal-light rounded-2xl mb-7"
        >
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: '#35615D20' }}
          >
            <Text className="text-xl font-bold text-teal">
              {(provider?.business_name || provider?.name || 'P').charAt(0)}
            </Text>
          </View>
          <View>
            <Text className="text-base font-bold text-gray-800">
              {provider?.business_name || provider?.name}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">
              {provider?.service_type || provider?.service}
            </Text>
          </View>
        </View>

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
                  <Ionicons name="checkmark-circle" size={24} color="#35615D" />
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
                color={serviceType === 'home' ? '#35615D' : '#9CA3AF'}
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
                color={serviceType === 'salon' ? '#35615D' : '#9CA3AF'}
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
                  shadowColor: '#35615D',
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
                  shadowColor: '#35615D',
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

      {/* Premium Bottom Bar */}
      <View
        className="flex-row items-center gap-4 px-6 pb-9 pt-5 bg-white"
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
        <View>
          <Text className="text-xs text-gray-400 font-medium">Deposit required</Text>
          <Text className="text-2xl font-extrabold text-gray-800">{formatPrice(servicePrice * 0.3)}</Text>
        </View>
        <Button
          title={submitting ? 'Booking...' : 'Confirm Booking'}
          onPress={handleConfirmBooking}
          disabled={selectedTime === null || submitting}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
