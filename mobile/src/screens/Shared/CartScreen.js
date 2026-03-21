import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ordersAPI, paymentsAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const { user, isAuthenticated, isGuest } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Recipient details state
  const [showRecipient, setShowRecipient] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString();
  const deliveryFee = 0; // Delivery fee handled by logistics later
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (isGuest || !isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to place an order.');
      return;
    }
    if (items.length === 0) return;
    setShowRecipient(true);
  };

  const handlePlaceOrder = async () => {
    if (!recipientName.trim() || !recipientPhone.trim() || !deliveryAddress.trim()) {
      Alert.alert('Missing Info', 'Please fill in recipient name, phone, and delivery address.');
      return;
    }

    setSubmitting(true);
    setShowRecipient(false);
    try {
      const orderData = {
        order_type: 'gift',
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        delivery_address: deliveryAddress.trim(),
        delivery_city: user?.city || 'Lagos',
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        personal_message: personalMessage.trim() || undefined,
        is_express: false,
      };
      const res = await ordersAPI.create(orderData);
      const order = res.data;

      // Initialize payment
      const payRes = await paymentsAPI.initialize({
        order_id: order.id,
        amount: order.total,
        email: user?.email || `${user?.phone}@quickgift.ng`,
      });
      const payData = payRes.data;

      if (payData.authorization_url) {
        clearCart();
        navigation.navigate('PaystackWebView', {
          authorization_url: payData.authorization_url,
          reference: payData.reference,
          successScreen: 'HomeMain',
        });
        return;
      }

      // Dev mode / wallet fallback
      clearCart();
      Alert.alert(
        'Order Placed!',
        `Order ${order.order_number} created for ${recipientName}.\nTotal: ${formatPrice(order.total)}`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Order Failed', err.response?.data?.detail || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View
          className="flex-row items-center justify-between px-5 pb-3"
          style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
        >
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Cart</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-gray-50 items-center justify-center mb-5">
            <Text style={{ fontSize: 44 }}>🛒</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Browse our collection and add gifts to your cart
          </Text>
          <TouchableOpacity
            className="bg-teal px-8 py-3.5 rounded-2xl"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-sm font-semibold text-white">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View
        className="flex-row items-center justify-between px-5 pb-3 bg-white"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Cart ({itemCount})</Text>
        <TouchableOpacity onPress={() => {
          Alert.alert('Clear Cart', 'Remove all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ]);
        }}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <View key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-xl bg-cream items-center justify-center">
                <Text style={{ fontSize: 28 }}>{item.emoji || '🎁'}</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
                <Text className="text-xs text-gray-500">{item.vendor_name || 'Gift'}</Text>
                <Text className="text-base font-bold text-teal mt-1">{formatPrice(item.price * item.quantity)}</Text>
              </View>
              <TouchableOpacity className="ml-2" onPress={() => removeItem(item.id)}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-end mt-3 pt-3 border-t border-gray-100">
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color="#1F2937" />
              </TouchableOpacity>
              <Text className="text-base font-bold text-gray-800 mx-4">{item.quantity}</Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-teal items-center justify-center"
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View className="bg-white rounded-2xl p-5 mt-2 shadow-sm">
          <Text className="text-base font-bold text-gray-800 mb-4">Order Summary</Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Subtotal ({itemCount} items)</Text>
              <Text className="text-sm font-semibold text-gray-800">{formatPrice(subtotal)}</Text>
            </View>
            <View className="h-px bg-gray-100" />
            <View className="flex-row justify-between">
              <Text className="text-base font-bold text-gray-800">Total</Text>
              <Text className="text-lg font-extrabold text-teal">{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        <View className="h-[120px]" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pb-8 pt-4">
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${submitting ? 'bg-gray-300' : 'bg-teal'}`}
          onPress={handleCheckout}
          disabled={submitting}
        >
          <Text className="text-base font-semibold text-white">
            {submitting ? 'Placing Order...' : `Checkout ${formatPrice(total)}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recipient Details Modal */}
      <Modal visible={showRecipient} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'ios' ? 60 : 30 }}>
          <View className="flex-row items-center px-5 pb-4 border-b border-gray-100">
            <Text className="flex-1 text-lg font-bold text-gray-800">Recipient Details</Text>
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => setShowRecipient(false)}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
            <Text className="text-sm text-gray-500 mb-5">Who is this gift for?</Text>

            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recipient Name *</Text>
            <View className="flex-row items-center bg-gray-50 rounded-2xl h-14 px-4 border border-gray-200 mb-4">
              <Ionicons name="person-outline" size={18} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-sm text-gray-900"
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Enter recipient's name"
                placeholderTextColor="#D1D5DB"
              />
            </View>

            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number *</Text>
            <View className="flex-row items-center bg-gray-50 rounded-2xl h-14 px-4 border border-gray-200 mb-4">
              <Ionicons name="call-outline" size={18} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-sm text-gray-900"
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                placeholder="e.g. 08012345678"
                placeholderTextColor="#D1D5DB"
                keyboardType="phone-pad"
              />
            </View>

            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Address *</Text>
            <View className="flex-row items-start bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 mb-4">
              <Ionicons name="location-outline" size={18} color="#6B7280" style={{ marginTop: 2 }} />
              <TextInput
                className="flex-1 ml-3 text-sm text-gray-900"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Full delivery address"
                placeholderTextColor="#D1D5DB"
                multiline
                numberOfLines={2}
                style={{ minHeight: 50, textAlignVertical: 'top' }}
              />
            </View>

            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Personal Message (optional)</Text>
            <View className="flex-row items-start bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 mb-6">
              <Ionicons name="chatbubble-outline" size={18} color="#6B7280" style={{ marginTop: 2 }} />
              <TextInput
                className="flex-1 ml-3 text-sm text-gray-900"
                value={personalMessage}
                onChangeText={setPersonalMessage}
                placeholder="Add a note for the recipient..."
                placeholderTextColor="#D1D5DB"
                multiline
                numberOfLines={3}
                style={{ minHeight: 60, textAlignVertical: 'top' }}
              />
            </View>
          </ScrollView>

          <View className="px-5 pb-8 pt-4 border-t border-gray-100">
            <TouchableOpacity
              className={`h-14 rounded-2xl items-center justify-center ${
                recipientName && recipientPhone && deliveryAddress ? 'bg-teal' : 'bg-gray-200'
              }`}
              onPress={handlePlaceOrder}
              disabled={!recipientName || !recipientPhone || !deliveryAddress || submitting}
            >
              <Text className={`text-base font-bold ${
                recipientName && recipientPhone && deliveryAddress ? 'text-white' : 'text-gray-400'
              }`}>
                {submitting ? 'Placing Order...' : `Pay ${formatPrice(total)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
