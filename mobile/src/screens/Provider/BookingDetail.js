import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { bookingsAPI } from '../../services/api';
import { apiError } from '../../utils/errors';
import { notifySuccess, notifyError } from '../../utils/haptics';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export default function BookingDetail({ route, navigation }) {
  const booking = route.params?.booking || {};
  const [status, setStatus] = useState(booking.status || 'pending');
  const [paymentStatus, setPaymentStatus] = useState(booking.payment_status || 'pending');
  const [actionLoading, setActionLoading] = useState(false);

  const bookingId = booking.id || booking._id;

  // Resolves to true only when the server accepted the change.
  const updateStatus = async (newStatus, successTitle, successMsg) => {
    if (!bookingId) {
      Alert.alert('Booking not found', 'Please go back and open this booking again.');
      return false;
    }
    try {
      setActionLoading(true);
      await bookingsAPI.updateStatus(bookingId, newStatus);
      setStatus(newStatus);
      if ((newStatus === 'declined' || newStatus === 'cancelled') && paymentStatus === 'paid') {
        setPaymentStatus('refunded');
      }
      notifySuccess();
      Alert.alert(successTitle, successMsg);
      return true;
    } catch (e) {
      // The server explains why, for example when the booking is not paid
      // for yet: show its reason.
      notifyError();
      Alert.alert('Booking not updated', apiError(e, 'We could not update this booking. Please try again.'));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = () => {
    updateStatus('confirmed', 'Booking accepted', 'The client has been notified.');
  };

  // A pending request is declined; one already accepted is cancelled.
  const handleDecline = () => {
    const pending = status === 'pending';
    Alert.alert(
      pending ? 'Decline Booking' : 'Cancel Booking',
      paymentStatus === 'paid'
        ? `Are you sure? The client will be refunded to their wallet.`
        : 'Are you sure?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: pending ? 'Decline' : 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            const ok = await updateStatus(
              pending ? 'declined' : 'cancelled',
              pending ? 'Booking declined' : 'Booking cancelled',
              'The client has been notified.',
            );
            if (ok) navigation.goBack();
          },
        },
      ],
    );
  };

  const handleStart = () => {
    updateStatus('in_progress', 'Service started', 'Mark it complete when you are done.');
  };

  const handleComplete = () => {
    updateStatus('completed', 'Service completed', 'Great work! The client can now leave a review.');
  };

  const statusColors = {
    pending: { bg: 'bg-orange-light', text: 'text-orange', label: 'Pending' },
    accepted: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Accepted' },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Confirmed' },
    in_progress: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'In Progress' },
    completed: { bg: 'bg-green-50', text: 'text-green-600', label: 'Completed' },
    declined: { bg: 'bg-red-50', text: 'text-red-500', label: 'Declined' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-500', label: 'Cancelled' },
  };

  const s = statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: String(status) };

  const clientName = booking.client_name || 'Client';
  const clientPhone = booking.client_phone || '';
  const serviceName = booking.service_name || 'N/A';
  const bookingDate = formatDate(booking.booking_date);
  const bookingTime = booking.booking_time || 'N/A';
  const duration = booking.duration_minutes ? `${booking.duration_minutes} min` : 'N/A';
  const price = booking.price;
  const address = booking.address || 'Not provided';
  const notes = booking.notes;
  const serviceTypeLabel =
    booking.service_type === 'home' ? 'Home service'
      : booking.service_type === 'salon' ? 'Salon visit'
        : booking.service_type || 'Location';
  const paymentLabel =
    paymentStatus === 'paid' ? 'Paid'
      : paymentStatus === 'refunded' ? 'Refunded'
        : 'Awaiting payment';
  const paymentColor = paymentStatus === 'paid' ? '#3E8E63' : paymentStatus === 'refunded' ? '#6E6A63' : '#B8862E';
  const ended = ['completed', 'cancelled', 'declined'].includes(status);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        className="px-5 pb-4 bg-white"
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#211F1C" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-gray-800" style={{ letterSpacing: 0.3 }}>Booking Details</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View className="flex-row items-center gap-2 mb-5">
          <View className={`px-4 py-1.5 rounded-full ${s.bg}`}>
            <Text className={`text-sm font-bold ${s.text}`}>{s.label}</Text>
          </View>
          <View className="px-4 py-1.5 rounded-full bg-white">
            <Text className="text-sm font-bold" style={{ color: paymentColor }}>{paymentLabel}</Text>
          </View>
        </View>

        {/* Why nothing can start yet */}
        {!ended && paymentStatus !== 'paid' && paymentStatus !== 'refunded' ? (
          <View className="bg-amber-50 rounded-2xl p-4 mb-4 flex-row gap-3">
            <Ionicons name="alert-circle-outline" size={18} color="#B8862E" />
            <Text className="flex-1 text-xs leading-[18px]" style={{ color: '#7A5A1E' }}>
              The client has not paid for this booking yet. You can confirm and start it once they pay.
            </Text>
          </View>
        ) : null}

        {/* Client Info */}
        <View
          className="flex-row items-center bg-white rounded-2xl p-4 mb-4"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="w-14 h-14 rounded-full bg-teal-light items-center justify-center">
            <Text className="text-teal font-bold text-xl">
              {clientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-base font-bold text-gray-800">{clientName}</Text>
            <Text className="text-sm text-gray-400 mt-0.5">{clientPhone || 'No phone number'}</Text>
          </View>
          {!!clientPhone && (
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-teal-light items-center justify-center"
              onPress={() => Linking.openURL(`tel:${clientPhone}`).catch(() => {})}
            >
              <Ionicons name="call-outline" size={18} color="#1F4A45" />
            </TouchableOpacity>
          )}
        </View>

        {/* Service Details */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Service Details</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-4 gap-3"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Service</Text>
            <Text className="text-sm font-bold text-gray-800">{serviceName}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Date</Text>
            <Text className="text-sm font-bold text-gray-800">{bookingDate}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Time</Text>
            <Text className="text-sm font-bold text-gray-800">{bookingTime}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Duration</Text>
            <Text className="text-sm font-bold text-gray-800">{duration}</Text>
          </View>
          <View className="flex-row justify-between border-t border-gray-100 pt-3">
            <Text className="text-sm font-bold text-gray-800">Total</Text>
            <Text className="text-lg font-extrabold text-teal">
              {price != null ? `${'\u20A6'}${Number(price).toLocaleString()}` : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Location */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Location</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-4 flex-row items-center gap-3"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <View className="w-10 h-10 rounded-full bg-teal-light items-center justify-center">
            <Ionicons name="location-outline" size={18} color="#1F4A45" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-800">{serviceTypeLabel}</Text>
            <Text className="text-xs text-gray-400 mt-0.5">{address}</Text>
          </View>
        </View>

        {/* Client Notes */}
        <Text className="text-[17px] font-bold text-gray-800 mb-3">Client Notes</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-6"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
          <Text className="text-sm text-gray-600 leading-5">
            {notes || 'No notes provided'}
          </Text>
        </View>

        {/* Completed - Rating */}
        {status === 'completed' && booking.review && (
          <View
            className="bg-white rounded-2xl p-4 mb-6 items-center"
            style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
          >
            <View className="flex-row mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= (booking.review?.rating || 0) ? 'star' : 'star-outline'}
                  size={20}
                  color="#E8632F"
                />
              ))}
            </View>
            <Text className="text-sm font-bold text-green-700 mt-1">
              Client rated {booking.review?.rating || 0}.0
            </Text>
            {booking.review?.comment ? (
              <Text className="text-xs text-gray-400 mt-1">"{booking.review.comment}"</Text>
            ) : null}
          </View>
        )}

        <View className="h-[120px]" />
      </ScrollView>

      {/* Action Buttons */}
      {!ended && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pb-8 pt-4"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 4 }}
        >
          {actionLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#1F4A45" />
            </View>
          ) : (
            <>
              {status === 'pending' && (
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
                    onPress={handleDecline}
                  >
                    <Text className="text-base font-bold text-gray-600">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-teal py-4 rounded-2xl items-center"
                    onPress={handleAccept}
                  >
                    <Text className="text-base font-bold text-white">Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
              {(status === 'confirmed' || status === 'accepted') && (
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
                    onPress={handleDecline}
                  >
                    <Text className="text-base font-bold text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-teal py-4 rounded-2xl items-center"
                    onPress={handleStart}
                  >
                    <Text className="text-base font-bold text-white">Start Service</Text>
                  </TouchableOpacity>
                </View>
              )}
              {status === 'in_progress' && (
                <TouchableOpacity
                  className="bg-teal py-4 rounded-2xl items-center"
                  onPress={handleComplete}
                >
                  <Text className="text-base font-bold text-white">Complete Service</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
