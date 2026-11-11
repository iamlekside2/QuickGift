import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { bookingsAPI, paymentsAPI, providersAPI } from '../../services/api';
import Button from '../../components/common/Button';
import ScreenHeader from '../../components/common/ScreenHeader';
import { notifyError } from '../../utils/haptics';
import { apiError } from '../../utils/errors';
import { useRequireAuth } from '../../utils/requireAuth';

// Used when the provider's working hours cannot be loaded.
const DEFAULT_TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// "9:00 AM" or "14:30" → minutes after midnight (null when unreadable).
const toMinutes = (value) => {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i.exec(String(value || ''));
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const period = m[3] ? m[3].toUpperCase() : null;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
};

const toLabel = (minutes) => {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function BookingScreen({ navigation, route }) {
  const { requireAuth } = useRequireAuth();
  const { provider, services = [] } = route.params || {};
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(services[0] || null);
  const [serviceType, setServiceType] = useState('home');
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState(null);   // { lat, lng } for home service
  const [area, setArea] = useState(null);        // address/area label from the picker
  const [availability, setAvailability] = useState(null); // provider's working hours, or null

  // The booking is created BEFORE payment. Keep it, with a fingerprint of the
  // choices it was made from, so a retry pays for the same booking instead of
  // creating a second one.
  const pendingRef = useRef(null); // { booking, key }

  useEffect(() => {
    let alive = true;
    if (!provider?.id) return undefined;
    providersAPI.availability(provider.id)
      .then((res) => {
        const data = res.data;
        if (alive && data && typeof data.schedule === 'object' && data.schedule) setAvailability(data);
      })
      .catch(() => {
        // Fall back to the default hours below.
      });
    return () => { alive = false; };
  }, [provider?.id]);

  const openPicker = () => {
    navigation.navigate('LocationPicker', {
      title: 'Your location',
      initial: coords,
      onPick: ({ lat, lng, address }) => {
        setCoords({ lat, lng });
        if (address) setArea(address);
      },
    });
  };

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en', { month: 'short' }),
      fullDate: d,
    };
  }), []);

  // Time slots for the chosen day, from the provider's real working hours.
  const { times, closedReason } = useMemo(() => {
    const day = dates[selectedDate].fullDate;
    let slots = DEFAULT_TIMES;
    let reason = null;

    if (availability) {
      const blocked = (availability.blocked_dates || []).some((b) => {
        const value = typeof b === 'string' ? b : b?.date;
        return value && String(value).slice(0, 10) === isoDay(day);
      });
      const hours = availability.schedule?.[DAY_KEYS[day.getDay()]];
      const start = toMinutes(hours?.start);
      const end = toMinutes(hours?.end);
      if (blocked) {
        slots = [];
        reason = 'This provider is not available on this date.';
      } else if (hours && hours.active === false) {
        slots = [];
        reason = 'This provider does not work on this day.';
      } else if (hours && start !== null && end !== null && end > start) {
        // Hourly starts, leaving room to finish the service before closing.
        const duration = Number(selectedService?.duration_minutes) > 0 ? Number(selectedService.duration_minutes) : 60;
        const lastStart = Math.max(start, end - duration);
        slots = [];
        for (let t = start; t <= lastStart; t += 60) slots.push(toLabel(t));
      }
    }

    // Today: drop the times that have already gone.
    if (selectedDate === 0) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      slots = slots.filter((label) => (toMinutes(label) ?? 0) > nowMinutes);
      if (!slots.length && !reason) reason = 'No times left today. Please pick another day.';
    }
    return { times: slots, closedReason: slots.length ? null : reason || 'No times available on this day.' };
  }, [availability, selectedDate, selectedService?.duration_minutes, dates]);

  // A time picked for one day may not exist on another.
  useEffect(() => {
    if (selectedTime && !times.includes(selectedTime)) setSelectedTime(null);
  }, [times, selectedTime]);

  const formatPrice = (price) => '₦' + (Number(price) || 0).toLocaleString();

  const hasServices = services.length > 0;
  // The price always comes from the chosen service (the server charges that).
  const servicePrice = Number(selectedService?.price) || 0;
  const providerName = provider?.business_name || provider?.name || 'Provider';
  const canConfirm = !!selectedService && !!selectedTime && !submitting;

  const confirmedParams = (booking) => ({
    providerName,
    serviceName: booking?.service_name || selectedService?.name,
    when: `${dates[selectedDate].day} ${dates[selectedDate].date} ${dates[selectedDate].month}, ${selectedTime}`,
    location: serviceType === 'home' ? (area || 'Home Service') : 'Salon Visit',
    bookingId: booking?.booking_number || booking?.id,
  });

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedTime || submitting) return;
    if (!requireAuth('Create an account or sign in to book this appointment.')) return;

    setSubmitting(true);
    let booking = null;
    try {
      const minutes = toMinutes(selectedTime) ?? 0;
      const bookingDate = new Date(dates[selectedDate].fullDate);
      bookingDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

      const key = [
        provider?.id, selectedService.id, bookingDate.toISOString(), serviceType,
        serviceType === 'home' ? `${coords?.lat ?? ''},${coords?.lng ?? ''},${area ?? ''}` : '',
      ].join('|');
      const existing = pendingRef.current;

      if (existing && existing.key === key) {
        // Retry: pay for the booking we already created.
        booking = existing.booking;
      } else {
        if (existing) {
          // The choices changed since the unpaid booking was made. Withdraw it.
          bookingsAPI.cancel(existing.booking.id).catch(() => {});
          pendingRef.current = null;
        }
        const bookingData = {
          provider_id: provider?.id,
          service_id: selectedService.id,
          booking_date: bookingDate.toISOString(),
          booking_time: selectedTime,
          service_type: serviceType,
          notes: serviceType === 'home' ? 'Home Service' : 'Salon Visit',
        };
        // Attach the customer's location for home service so the provider knows where to go
        if (serviceType === 'home' && coords) {
          bookingData.address = area || undefined;
          bookingData.lat = coords.lat;
          bookingData.lng = coords.lng;
        }
        const bookingRes = await bookingsAPI.create(bookingData);
        booking = bookingRes.data;
        pendingRef.current = { booking, key };
      }

      // Full payment upfront. The server charges the booking's real price.
      const payRes = await paymentsAPI.initialize({ booking_id: booking.id, method: 'card' });
      const payData = payRes.data || {};
      const params = confirmedParams(booking);

      if (payData.authorization_url) {
        setSubmitting(false);
        navigation.navigate('PaystackWebView', {
          authorization_url: payData.authorization_url,
          reference: payData.reference,
          onSuccess: () => { pendingRef.current = null; },
          successScreen: 'BookingConfirmed',
          successParams: params,
        });
        return;
      }

      // No checkout address. Only a local development server does this (it
      // has no payment gateway); verify auto-approves there. Anywhere else it
      // is an error, never a confirmed booking.
      if (__DEV__ && payData.reference) {
        const verifyRes = await paymentsAPI.verify(payData.reference);
        if (verifyRes.data?.status === 'success') {
          pendingRef.current = null;
          navigation.replace('BookingConfirmed', params);
          return;
        }
      }
      notifyError();
      Alert.alert(
        'Payment not started',
        'We could not start your card payment. Your booking is saved. Please try again.',
      );
    } catch (err) {
      const message = apiError(err, 'Something went wrong. Please try again.');
      if (booking && /already paid/i.test(message)) {
        // An earlier attempt went through after all.
        pendingRef.current = null;
        navigation.replace('BookingConfirmed', confirmedParams(booking));
        return;
      }
      notifyError();
      Alert.alert(booking ? 'Payment Failed' : 'Booking Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="dark" />
      {/* Header */}
      <ScreenHeader variant="stack" title={`Book ${providerName}`} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20 }}>

        {/* No services: nothing can be booked or priced */}
        {!hasServices && (
          <View className="mx-6 mb-7 p-4 rounded-2xl bg-orange-light flex-row gap-3">
            <Ionicons name="alert-circle-outline" size={20} color="#C94F1F" />
            <Text className="flex-1 text-[13px] text-orange-dark leading-5">
              {providerName} has not listed any services yet, so there is nothing to book. You can message them from their profile to ask what they offer.
            </Text>
          </View>
        )}

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

          {/* Home-service location capture */}
          {serviceType === 'home' && (
            <View className="mt-3">
              <TouchableOpacity
                onPress={openPicker}
                activeOpacity={0.8}
                className="flex-row items-center gap-2 self-start px-3.5 py-2.5 rounded-xl bg-teal/10"
              >
                <Ionicons name="map" size={15} color="#1F4A45" />
                <Text className="text-[12.5px] font-bold text-teal">
                  {coords ? 'Update my location' : 'Set my location on map'}
                </Text>
              </TouchableOpacity>
              <Text className="text-[11.5px] mt-1.5" style={{ color: area ? '#3E8E63' : '#9A948A' }}>
                {area
                  ? `✓ Your stylist will come to ${area}`
                  : 'Share your location so your stylist knows where to come.'}
              </Text>
            </View>
          )}
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
          {closedReason ? (
            <Text className="text-[13px] text-ink-soft leading-5">{closedReason}</Text>
          ) : null}
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
          title={
            submitting
              ? 'Booking…'
              : !hasServices
                ? 'No services to book'
                : `Confirm · ${formatPrice(servicePrice)}`
          }
          onPress={handleConfirmBooking}
          disabled={!canConfirm}
          variant="terracotta"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
