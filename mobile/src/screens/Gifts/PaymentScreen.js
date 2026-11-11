import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useWallet } from '../../context/WalletContext';
import { ordersAPI, paymentsAPI } from '../../services/api';
import { notifySuccess, notifyError } from '../../utils/haptics';
import { apiError } from '../../utils/errors';
import { useRequireAuth } from '../../utils/requireAuth';

export default function PaymentScreen({ route, navigation }) {
  const { requireAuth } = useRequireAuth();
  const { balance: walletBalance, setServerBalance, refreshBalance } = useWallet();
  const gift = route.params?.gift || {};
  const recipient = route.params?.recipient || {};

  const [selectedMethod, setSelectedMethod] = useState('wallet');
  const [paying, setPaying] = useState(false);
  // The order is created before payment; keep it so a retry pays for the same
  // order instead of creating a duplicate.
  const orderRef = useRef(null);
  const [serverTotal, setServerTotal] = useState(null);

  const price = Number(gift.price) || 0;
  const deliveryFee = 0; // Delivery is currently free; the server sets the real fee
  const total = serverTotal ?? price + deliveryFee;

  const insufficientWallet = selectedMethod === 'wallet' && walletBalance < total;

  // Payment is confirmed.
  const orderDone = (order) => {
    orderRef.current = null;
    notifySuccess();
    refreshBalance();
    const names = navigation.getState?.()?.routeNames || [];
    Alert.alert(
      'Order Successful!',
      `Your gift for ${recipient.name || 'your recipient'} is paid${order?.order_number ? ` (order ${order.order_number})` : ''}. You can follow it under Orders.`,
      [
        {
          text: 'Send Another Gift',
          onPress: () => (names.includes('GiftsHome') ? navigation.popTo('GiftsHome') : navigation.popToTop()),
        },
        { text: 'Back to Home', onPress: () => navigation.popToTop() },
      ],
      { cancelable: false },
    );
  };

  const handlePay = async () => {
    if (paying) return;
    if (!requireAuth('Create an account or sign in to send this gift.')) return;
    if (insufficientWallet) {
      notifyError();
      Alert.alert('Insufficient Balance', `Your wallet balance (₦${walletBalance.toLocaleString()}) is less than the total (₦${total.toLocaleString()}). Please fund your wallet or pay with card.`);
      return;
    }
    setPaying(true);
    let order = orderRef.current;
    try {
      // Step 1: Create the order (once)
      if (!order) {
        const orderRes = await ordersAPI.create({
          items: [{ product_id: gift.id, quantity: 1 }],
          delivery_address: recipient.address,
          delivery_city: recipient.city || 'Lagos',
          delivery_lat: recipient.lat,
          delivery_lng: recipient.lng,
          recipient_name: recipient.name,
          recipient_phone: recipient.phone,
          personal_message: recipient.note || undefined,
        });
        order = orderRes.data;
        orderRef.current = order;
        if (order?.total !== undefined) setServerTotal(Number(order.total));
      }

      // Step 2: Pay. The server charges the real order total.
      const payRes = await paymentsAPI.initialize({ order_id: order.id, method: selectedMethod });
      const payData = payRes.data || {};

      if (selectedMethod === 'wallet') {
        if (payData.status !== 'success') {
          notifyError();
          Alert.alert('Payment not completed', 'Your wallet payment was not confirmed. Please try again.');
          return;
        }
        if (payData.new_balance !== undefined) setServerBalance(payData.new_balance);
        orderDone(order);
        return;
      }

      if (payData.authorization_url) {
        const paidOrder = order;
        setPaying(false);
        navigation.navigate('PaystackWebView', {
          authorization_url: payData.authorization_url,
          reference: payData.reference,
          onSuccess: () => orderDone(paidOrder),
        });
        return;
      }

      // No checkout address: only a local development server does this, and
      // verify auto-approves there. Anywhere else it is an error.
      if (__DEV__ && payData.reference) {
        const verifyRes = await paymentsAPI.verify(payData.reference);
        if (verifyRes.data?.status === 'success') {
          orderDone(order);
          return;
        }
      }
      notifyError();
      Alert.alert('Payment not started', 'We could not start your card payment. Your order is saved. Please try again.');
    } catch (err) {
      const message = apiError(err, 'Something went wrong. Please try again.');
      if (order && /already paid/i.test(message)) {
        orderDone(order);
        return;
      }
      notifyError();
      Alert.alert(order ? 'Payment Failed' : 'Order Failed', message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <ScreenHeader variant="stack" title="Payment" onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <Text className="text-base font-bold text-gray-800 mt-6 mb-4">Order Summary</Text>
        <View
          className="bg-white rounded-2xl p-4 mb-5"
          style={{
            shadowColor: '#211F1C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center gap-3 mb-3 pb-3 border-b border-gray-100">
            <View className="w-12 h-12 rounded-xl bg-teal-light items-center justify-center">
              <Ionicons name="gift-outline" size={24} color="#1F4A45" />
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
            shadowColor: '#211F1C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="w-10 h-10 rounded-2xl bg-teal-light items-center justify-center">
            <Ionicons name="location-outline" size={18} color="#1F4A45" />
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
              shadowColor: '#1F4A45',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            } : {
              shadowColor: '#211F1C',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => setSelectedMethod('wallet')}
          >
            <View className="w-10 h-10 rounded-2xl bg-teal-light items-center justify-center mr-3">
              <Ionicons name="wallet" size={20} color="#1F4A45" />
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
              shadowColor: '#1F4A45',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            } : {
              shadowColor: '#211F1C',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => setSelectedMethod('card')}
          >
            <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="card" size={20} color="#4C7CB0" />
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
          shadowColor: '#211F1C',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${paying ? 'bg-teal/70' : 'bg-teal'}`}
          style={{
            shadowColor: '#1F4A45',
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
