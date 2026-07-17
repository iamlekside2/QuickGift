import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, Modal, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ordersAPI, paymentsAPI } from '../../services/api';
import AppInput from '../../components/common/AppInput';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { iconFor } from '../../utils/categoryIcons';

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const { user, isAuthenticated, isGuest } = useAuth();
  const { balance: walletBalance, debit: walletDebit, refreshBalance } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Recipient details state
  const [showRecipient, setShowRecipient] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString();
  const deliveryFee = 0; // Backend DELIVERY_BASE_FEE=0 — delivery currently free
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

      // Initialize payment with method
      const payRes = await paymentsAPI.initialize({
        order_id: order.id,
        amount: order.total,
        email: user?.email || `${user?.phone}@quickgift.ng`,
        method: paymentMethod,
      });
      const payData = payRes.data;

      if (payData.status === 'success' && paymentMethod === 'wallet') {
        // Wallet payment succeeded — update local balance
        walletDebit(order.total);
        refreshBalance();
        clearCart();
        Alert.alert(
          'Order Placed!',
          `Order ${order.order_number} paid from wallet.\nTotal: ${formatPrice(order.total)}`,
          [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
        return;
      }

      if (payData.authorization_url) {
        // Don't clear cart yet — only clear after payment verified
        navigation.navigate('PaystackWebView', {
          authorization_url: payData.authorization_url,
          reference: payData.reference,
          successScreen: 'HomeMain',
        });
        // Clear cart after navigating (payment will be verified in WebView)
        clearCart();
        return;
      }

      // Dev mode fallback
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
      <View className="flex-1 bg-cream">
        <StatusBar style="dark" />
        <View
          className="flex-row items-center justify-between px-5 pb-3"
          style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
        >
          <TouchableOpacity
            className="w-10 h-10 rounded-[14px] bg-sand items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#211F1C" />
          </TouchableOpacity>
          <Text className="text-[19px] font-bold text-ink">Cart</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-sand items-center justify-center mb-5">
            <Ionicons name="cart-outline" size={44} color="#9A948A" />
          </View>
          <Text className="text-xl font-bold text-ink mb-2">Your cart is empty</Text>
          <Text className="text-sm text-ink-soft text-center mb-6">
            Browse our collection and add gifts to your cart
          </Text>
          <TouchableOpacity
            className="bg-teal px-8 h-[52px] rounded-[16px] items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-[15px] font-bold text-white">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <StatusBar style="light" />
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
        <Text className="text-[19px] font-bold text-white">Cart ({itemCount})</Text>
        <TouchableOpacity
          className="w-10 h-10 rounded-[14px] bg-white/15 items-center justify-center"
          onPress={() => {
            Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <View
            key={item.id}
            className="bg-white rounded-[20px] p-4 mb-3 flex-row items-center"
            style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
          >
            <View className="w-[72px] h-[72px] rounded-[14px] bg-cream items-center justify-center overflow-hidden">
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Ionicons name={iconFor(item.category || item.category_name)} size={30} color="#B5AFA2" />
              )}
            </View>
            <View className="flex-1 ml-3.5">
              <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>{item.name}</Text>
              <Text className="text-[12px] text-ink-caption" numberOfLines={1}>
                {item.vendor_name || item.variant || 'Gift'}
              </Text>
              <View className="flex-row items-center justify-between mt-1.5">
                <Text className="text-[15px] font-extrabold text-teal">{formatPrice(item.price * item.quantity)}</Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    className="w-7 h-7 rounded-full bg-sand items-center justify-center"
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={15} color="#211F1C" />
                  </TouchableOpacity>
                  <Text className="text-[14px] font-bold text-ink w-5 text-center">{item.quantity}</Text>
                  <TouchableOpacity
                    className="w-7 h-7 rounded-full bg-teal items-center justify-center"
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={15} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableOpacity className="ml-2 self-start" onPress={() => removeItem(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#D24B4B" />
            </TouchableOpacity>
          </View>
        ))}

        <View
          className="bg-white rounded-[20px] p-5 mt-2"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
        >
          <Text className="text-[16px] font-bold text-ink mb-4">Order Summary</Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-[13.5px] text-ink-soft">Subtotal ({itemCount} items)</Text>
              <Text className="text-[13.5px] font-bold text-ink">{formatPrice(subtotal)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[13.5px] text-ink-soft">Delivery</Text>
              <Text className="text-[13.5px] font-bold text-success">Free</Text>
            </View>
            <View className="h-px bg-line-divider" />
            <View className="flex-row justify-between">
              <Text className="text-[15px] font-bold text-ink">Total</Text>
              <Text className="text-[18px] font-extrabold text-teal">{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        <View className="h-[130px]" />
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4"
        style={{ borderTopWidth: 1, borderTopColor: '#F5F0E7' }}
      >
        <TouchableOpacity
          className={`h-[52px] rounded-[16px] items-center justify-center ${submitting ? 'bg-gray-300' : 'bg-teal'}`}
          onPress={handleCheckout}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text className="text-[15px] font-bold text-white">
            {submitting ? 'Placing Order…' : `Checkout · ${formatPrice(total)}`}
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
              <Ionicons name="close" size={20} color="#6E6A63" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
            <Text className="text-sm text-gray-500 mb-5">Who is this gift for?</Text>

            <AppInput
              label="Recipient Name"
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Enter recipient's name"
              icon="person-outline"
            />
            <AppInput
              label="Phone Number"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              placeholder="801 234 5678"
              type="phone"
            />
            <AppInput
              label="Delivery Address"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Full delivery address"
              type="multiline"
              icon="location-outline"
            />
            <AppInput
              label="Personal Message (optional)"
              value={personalMessage}
              onChangeText={setPersonalMessage}
              placeholder="Add a note for the recipient..."
              type="multiline"
              icon="chatbubble-outline"
            />
            {/* Payment Method */}
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2">Payment Method</Text>
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-2 p-3.5 rounded-2xl border-2 ${
                  paymentMethod === 'card' ? 'border-teal bg-teal-light/30' : 'border-gray-200 bg-gray-50'
                }`}
                onPress={() => setPaymentMethod('card')}
              >
                <Ionicons name="card-outline" size={18} color={paymentMethod === 'card' ? '#1F4A45' : '#9A948A'} />
                <Text className={`text-sm font-bold ${paymentMethod === 'card' ? 'text-teal' : 'text-gray-400'}`}>Card</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-2 p-3.5 rounded-2xl border-2 ${
                  paymentMethod === 'wallet' ? 'border-teal bg-teal-light/30' : 'border-gray-200 bg-gray-50'
                }`}
                onPress={() => setPaymentMethod('wallet')}
              >
                <Ionicons name="wallet-outline" size={18} color={paymentMethod === 'wallet' ? '#1F4A45' : '#9A948A'} />
                <View>
                  <Text className={`text-sm font-bold ${paymentMethod === 'wallet' ? 'text-teal' : 'text-gray-400'}`}>Wallet</Text>
                  <Text className="text-[10px] text-gray-400">₦{walletBalance.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
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
