import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Provider Info */}
        <View style={styles.providerCard}>
          <View style={styles.providerAvatar}>
            <Text style={styles.avatarText}>{(provider?.business_name || provider?.name || 'P').charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.providerName}>{provider?.business_name || provider?.name}</Text>
            <Text style={styles.providerService}>{provider?.service_type || provider?.service}</Text>
          </View>
        </View>

        {/* Service Selection */}
        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Service</Text>
            {services.map((svc) => (
              <TouchableOpacity
                key={svc.id}
                style={[styles.serviceChip, selectedService?.id === svc.id && styles.serviceChipActive]}
                onPress={() => setSelectedService(svc)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceChipName, selectedService?.id === svc.id && { color: COLORS.primary }]}>
                    {svc.name}
                  </Text>
                  <Text style={styles.serviceChipDuration}>
                    {svc.duration_minutes ? `${svc.duration_minutes}min` : ''} · {formatPrice(svc.price)}
                  </Text>
                </View>
                {selectedService?.id === svc.id && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Service Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Location</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeOption, serviceType === 'home' && styles.typeActive]}
              onPress={() => setServiceType('home')}
            >
              <Ionicons name="home-outline" size={20} color={serviceType === 'home' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.typeText, serviceType === 'home' && styles.typeTextActive]}>Home Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, serviceType === 'salon' && styles.typeActive]}
              onPress={() => setServiceType('salon')}
            >
              <Ionicons name="business-outline" size={20} color={serviceType === 'salon' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.typeText, serviceType === 'salon' && styles.typeTextActive]}>Visit Salon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dateCard, selectedDate === i && styles.dateCardActive]}
                onPress={() => setSelectedDate(i)}
              >
                <Text style={[styles.dateDay, selectedDate === i && styles.dateDayActive]}>{d.day}</Text>
                <Text style={[styles.dateNum, selectedDate === i && styles.dateNumActive]}>{d.date}</Text>
                <Text style={[styles.dateMonth, selectedDate === i && styles.dateMonthActive]}>{d.month}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {times.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeChip, selectedTime === time && styles.timeChipActive]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.depositLabel}>Deposit required</Text>
          <Text style={styles.depositAmount}>{formatPrice(servicePrice * 0.3)}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundGray, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    marginHorizontal: SPACING.xl, padding: SPACING.lg,
    backgroundColor: COLORS.backgroundGray, borderRadius: RADIUS.lg, marginBottom: SPACING.xxl,
  },
  providerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  providerName: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text },
  providerService: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xxl },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.lg,
    backgroundColor: COLORS.backgroundGray, borderRadius: RADIUS.lg, marginBottom: SPACING.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  serviceChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  serviceChipName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  serviceChipDuration: { fontSize: FONTS.sizes.sm, color: COLORS.textLight, marginTop: 2 },
  typeRow: { flexDirection: 'row', gap: SPACING.md },
  typeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, padding: SPACING.lg, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundGray, borderWidth: 2, borderColor: 'transparent',
  },
  typeActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  typeText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textSecondary },
  typeTextActive: { color: COLORS.primary },
  dateRow: { gap: SPACING.sm },
  dateCard: {
    width: 65, alignItems: 'center', paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.backgroundGray,
  },
  dateCardActive: { backgroundColor: COLORS.primary },
  dateDay: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '500' },
  dateDayActive: { color: 'rgba(255,255,255,0.7)' },
  dateNum: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text, marginVertical: 2 },
  dateNumActive: { color: COLORS.textWhite },
  dateMonth: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  dateMonthActive: { color: 'rgba(255,255,255,0.7)' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  timeChip: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full, backgroundColor: COLORS.backgroundGray,
  },
  timeChipActive: { backgroundColor: COLORS.primary },
  timeText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, fontWeight: '500' },
  timeTextActive: { color: COLORS.textWhite },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
    padding: SPACING.xl, paddingBottom: 34,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  depositLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  depositAmount: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text },
});
