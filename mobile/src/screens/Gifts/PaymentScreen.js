import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, paymentsAPI } from '../../services/api';

export default function PaymentScreen({ route, navigation }) {
  const { user } = useAuth();
  const gift = route.params?.gift || {};
  const recipient = route.params?.recipient || {};
  const walletBalance = user?.wallet_balance || 0;

  const [selectedMethod, setSelectedMethod] = useState('wallet');
  const [paying, setPaying] = useState(false);

  const price = gift.price || 0;
  const deliveryFee = 1500;
  const total = price + deliveryFee;

  const handlePay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      // Step 1: Create the order
      const orderRes = await ordersAPI.create({
        product_id: gift.id,
        recipient_name: recipient.name,
        recipient_phone: recipient.phone,
        recipient_address: recipient.address,
        delivery_fee: deliveryFee,
        total_amount: total,
        payment_method: selectedMethod,
      });
      const order = orderRes.data;

      if (selectedMethod === 'card') {
        // Step 2a: Initialize Paystack payment for card
        const payRes = await paymentsAPI.initialize({
          order_id: order.id,
          amount: total,
          email: user?.email || user?.phone + '@quickgift.ng',
        });
        const payData = payRes.data;

        if (payData.authorization_url) {
          // Step 3a: Navigate to Paystack WebView
          setPaying(false);
          navigation.navigate('PaystackWebView', {
            authorization_url: payData.authorization_url,
            reference: payData.reference,
            successScreen: 'GiftsHome',
          });
          return;
        } else {
          // Dev mode fallback — no Paystack key configured
          Alert.alert(
            'Order Successful!',
            payData.message || `The gift for ${recipient.name} has been placed.`,
            [
              { text: 'Send Another Gift', onPress: () => navigation.navigate('GiftsHome') },
              { text: 'Back to Home', onPress: () => navigation.popToTop() },
            ]
          );
        }
      } else {
        // Step 2b: Wallet payment — initialize directly
        await paymentsAPI.initialize({
          order_id: order.id,
          amount: total,
          email: user?.email || user?.phone + '@quickgift.ng',
        });

        // Step 3b: Success for wallet
        Alert.alert(
          'Order Successful!',
          `The gift for ${recipient.name} has been sent and will arrive shortly.`,
          [
            { text: 'Send Another Gift', onPress: () => navigation.navigate('GiftsHome') },
            { text: 'Back to Home', onPress: () => navigation.popToTop() },
          ]
        );
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      Alert.alert('Payment Failed', message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-5 pb-3 bg-white"
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
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Payment</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Order Summary</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-5"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center gap-3 mb-3 pb-3 border-b border-gray-100">
            <View className="w-12 h-12 rounded-xl bg-teal-light items-center justify-center">
              <Text style={{ fontSize: 24 }}>🎁</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-800">{gift.name || 'Gift'}</Text>
              <Text className="text-xs text-gray-500">To {recipient.name}</Text>
            </View>
          </View>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Subtotal</Text>
              <Text className="text-sm text-gray-800">₦{price.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Delivery Fee</Text>
              <Text className="text-sm text-gray-800">₦{deliveryFee.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-gray-200">
              <Text className="text-base font-bold text-gray-800">Total</Text>
              <Text className="text-base font-extrabold text-teal">₦{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Info */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Delivery To</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-5 flex-row items-center gap-3"
          style={{
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="w-10 h-10 rounded-2xl bg-teal-light items-center justify-center">
            <Ionicons name="location-outline" size={18} color="#35615D" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-800">{recipient.name}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">{recipient.address}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Payment Method</Text>
        <View className="gap-3 mb-6">
          {/* Wallet */}
          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-2xl border-2 ${
              selectedMethod === 'wallet' ? 'border-teal bg-teal-light' : 'border-gray-100 bg-white'
            }`}
            style={selectedMethod === 'wallet' ? {
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            } : {
              shadowColor: '#1F2937',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => setSelectedMethod('wallet')}
          >
            <View className="w-10 h-10 rounded-2xl bg-teal-light items-center justify-center mr-3">
              <Ionicons name="wallet" size={20} color="#35615D" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800">QuickGift Wallet</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Balance: ₦{walletBalance.toLocaleString()}</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
              selectedMethod === 'wallet' ? 'border-teal' : 'border-gray-300'
            }`}>
              {selectedMethod === 'wallet' && <View className="w-3 h-3 rounded-full bg-teal" />}
            </View>
          </TouchableOpacity>

          {/* Card */}
          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-2xl border-2 ${
              selectedMethod === 'card' ? 'border-teal bg-teal-light' : 'border-gray-100 bg-white'
            }`}
            style={selectedMethod === 'card' ? {
              shadowColor: '#35615D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            } : {
              shadowColor: '#1F2937',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => setSelectedMethod('card')}
          >
            <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="card" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800">Debit/Credit Card</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Visa, Mastercard, Verve</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
              selectedMethod === 'card' ? 'border-teal' : 'border-gray-300'
            }`}>
              {selectedMethod === 'card' && <View className="w-3 h-3 rounded-full bg-teal" />}
            </View>
          </TouchableOpacity>
        </View>

        <View className="h-[100px]" />
      </ScrollView>

      {/* Bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4"
        style={{
          shadowColor: '#1F2937',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${paying ? 'bg-teal/70' : 'bg-teal'}`}
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={handlePay}
          disabled={paying}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Pay ₦{total.toLocaleString()}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
