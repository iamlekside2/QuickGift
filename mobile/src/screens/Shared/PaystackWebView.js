import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { paymentsAPI, walletAPI } from '../../services/api';

const CALLBACK_KEYWORDS = ['callback', 'trxref', 'reference'];

export default function PaystackWebView({ route, navigation }) {
  const { authorization_url, reference, successScreen, successParams = {}, verifyType } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const webViewRef = useRef(null);
  const hasHandledRedirect = useRef(false);

  const handleNavigationChange = async (navState) => {
    const { url } = navState;

    // Detect Paystack callback redirect
    const isCallback = CALLBACK_KEYWORDS.some((keyword) => url.toLowerCase().includes(keyword));

    if (isCallback && !hasHandledRedirect.current) {
      hasHandledRedirect.current = true;

      // Extract reference from URL if available
      let payRef = reference;
      try {
        const urlObj = new URL(url);
        const trxref = urlObj.searchParams.get('trxref') || urlObj.searchParams.get('reference');
        if (trxref) payRef = trxref;
      } catch {
        // URL parsing failed, use the reference passed via params
      }

      await verifyPayment(payRef);
    }
  };

  const verifyPayment = async (payRef) => {
    setVerifying(true);
    try {
      // Use wallet fund verify for wallet top-ups, standard verify for orders/bookings
      const res = verifyType === 'wallet_fund'
        ? await walletAPI.fundVerify(payRef)
        : await paymentsAPI.verify(payRef);
      const status = res.data?.status || res.data?.data?.status || (res.data?.id ? 'success' : null);

      if (status === 'success') {
        Alert.alert('Payment Successful', 'Your payment has been confirmed.', [
          {
            text: 'OK',
            onPress: () => {
              // Go back to wherever we came from
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Payment Failed', 'Your payment could not be verified. Please try again.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Could not verify payment.';
      Alert.alert('Verification Error', message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Payment', 'Are you sure you want to cancel this payment?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  if (!authorization_url) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text className="text-lg font-bold text-gray-800 mt-4 text-center">Payment Error</Text>
        <Text className="text-sm text-gray-500 mt-2 text-center">
          No payment URL was provided. Please try again.
        </Text>
        <TouchableOpacity
          className="mt-6 bg-teal py-3 px-8 rounded-2xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-bold text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-3 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={handleCancel}
        >
          <Ionicons name="close" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Paystack Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Verifying Overlay */}
      {verifying && (
        <View className="absolute inset-0 bg-white/90 items-center justify-center z-50">
          <ActivityIndicator size="large" color="#35615D" />
          <Text className="text-base font-semibold text-gray-800 mt-4">Verifying payment...</Text>
          <Text className="text-sm text-gray-500 mt-1">Please wait</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: authorization_url }}
        onNavigationStateChange={handleNavigationChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        style={{ flex: 1 }}
      />

      {/* Loading Indicator */}
      {loading && !verifying && (
        <View className="absolute inset-0 items-center justify-center bg-white/80" style={{ top: 100 }}>
          <ActivityIndicator size="large" color="#35615D" />
          <Text className="text-sm text-gray-500 mt-3">Loading payment page...</Text>
        </View>
      )}
    </View>
  );
}
