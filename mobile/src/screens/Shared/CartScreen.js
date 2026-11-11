import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Platform, Alert, Modal, Image, Switch,
  TextInput, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { ordersAPI, paymentsAPI, promosAPI } from '../../services/api';
import AppInput from '../../components/common/AppInput';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { iconFor } from '../../utils/categoryIcons';
import { apiError } from '../../utils/errors';
import { useRequireAuth } from '../../utils/requireAuth';
import { notifySuccess, notifyError, tapLight } from '../../utils/haptics';
import { upcomingDays, formatDay } from '../../utils/dates';

// How far ahead a delivery day can be picked here (the server allows 90).
const DELIVERY_DAYS_AHEAD = 30;

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const { user } = useAuth();
  const { signedIn, requireAuth } = useRequireAuth();
  const { balance: walletBalance, setServerBalance, refreshBalance } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Recipient details state
  const [showRecipient, setShowRecipient] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  // '' = as soon as possible, otherwise the chosen day as YYYY-MM-DD.
  const [deliveryDay, setDeliveryDay] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const dayOptions = useMemo(() => upcomingDays(DELIVERY_DAYS_AHEAD), []);

  // Promo code. `promo` is what the server said the code is worth for a cart
  // of `promo.subtotal`; the real discount is worked out again by the server
  // when the order is created.
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);       // { code, discount, subtotal }
  const [promoMsg, setPromoMsg] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);

  // The preview was for a different cart total: it no longer applies.
  useEffect(() => {
    if (promo && promo.subtotal !== subtotal) {
      setPromo(null);
      setPromoMsg('Your cart changed. Apply the code again.');
    }
  }, [subtotal, promo]);

  // The order is created BEFORE payment. Keep it, with a fingerprint of what
  // it was created from, so a retry pays for the same order instead of
  // creating a second one.
  const [pendingOrder, setPendingOrder] = useState(null);   // { order, key }
  const pendingRef = useRef(null);
  // Set once payment is confirmed: switches this screen to the receipt view.
  const [placedOrder, setPlacedOrder] = useState(null);

  const formatPrice = (price) => '₦' + (Number(price) || 0).toLocaleString();

  const orderKey = () => JSON.stringify({
    items: items.map((i) => [i.id, i.quantity]),
    name: recipientName.trim(),
    phone: recipientPhone.trim(),
    address: deliveryAddress.trim(),
    note: personalMessage.trim(),
    day: deliveryDay,
    anonymous,
    promo: promo?.code || '',
  });

  // Once an order exists for exactly this cart, show the server's figures.
  const serverOrder = pendingOrder && pendingOrder.key === orderKey() ? pendingOrder.order : null;
  const shownSubtotal = serverOrder ? Number(serverOrder.subtotal) : subtotal;
  const shownDelivery = serverOrder ? Number(serverOrder.delivery_fee) || 0 : 0;
  const shownDiscount = serverOrder ? Number(serverOrder.discount) || 0 : promo?.discount || 0;
  const total = serverOrder ? Number(serverOrder.total) : Math.max(0, subtotal - shownDiscount);

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code || promoBusy) return;
    if (!requireAuth(
      'Create an account or sign in to use a promo code. Your cart will be waiting.',
      { beforeSignIn: () => navigation.canGoBack() && navigation.goBack() },
    )) {
      return;
    }
    setPromoBusy(true);
    setPromoMsg('');
    try {
      const res = await promosAPI.validate(code, subtotal);
      if (res.data?.valid) {
        notifySuccess();
        setPromo({ code: res.data.code, discount: Number(res.data.discount) || 0, subtotal });
        setPromoInput('');
      } else {
        notifyError();
        setPromo(null);
        setPromoMsg(res.data?.message || 'This promo code is not valid');
      }
    } catch (err) {
      setPromoMsg(apiError(err, 'We could not check that code. Please try again.'));
    } finally {
      setPromoBusy(false);
    }
  };

  const rememberOrder = (value) => {
    pendingRef.current = value;
    setPendingOrder(value);
  };

  const handleCheckout = () => {
    // Cart is a modal on top of the app: close it before leaving guest mode,
    // otherwise it is left behind as a dead-end screen.
    if (!requireAuth(
      'Create an account or sign in to place your order and track delivery. Your cart will be waiting.',
      { beforeSignIn: () => navigation.canGoBack() && navigation.goBack() },
    )) {
      return;
    }
    if (items.length === 0) return;
    setShowRecipient(true);
  };

  // Payment is confirmed: only now is the cart emptied.
  const finishPaid = (order, paidWith) => {
    notifySuccess();
    rememberOrder(null);
    setPlacedOrder({ ...order, paidWith });
    clearCart();
    refreshBalance();
  };

  const handlePlaceOrder = async () => {
    if (submitting) return;
    if (!recipientName.trim() || !recipientPhone.trim() || !deliveryAddress.trim()) {
      Alert.alert('Missing Info', 'Please fill in recipient name, phone, and delivery address.');
      return;
    }
    if (paymentMethod === 'wallet' && walletBalance < total) {
      Alert.alert(
        'Not enough in your wallet',
        `Your wallet balance (${formatPrice(walletBalance)}) does not cover ${formatPrice(total)}. Add money to your wallet or pay by card.`,
      );
      return;
    }

    setSubmitting(true);
    setShowRecipient(false);
    let order = null;
    try {
      const key = orderKey();
      const existing = pendingRef.current;

      if (existing && existing.key === key) {
        // Retry: pay for the order we already created.
        order = existing.order;
      } else {
        if (existing) {
          // The cart or recipient changed since the unpaid order was made, so
          // it no longer matches. Withdraw it rather than leave it hanging.
          ordersAPI.cancel(existing.order.id).catch(() => {});
          rememberOrder(null);
        }
        const res = await ordersAPI.create({
          order_type: 'gift',
          items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          delivery_address: deliveryAddress.trim(),
          delivery_city: user?.city || 'Lagos',
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          personal_message: personalMessage.trim() || undefined,
          scheduled_date: deliveryDay || undefined,
          is_anonymous: anonymous,
          promo_code: promo?.code || undefined,
          is_express: false,
        });
        order = res.data;
        rememberOrder({ order, key });
      }

      // The server charges the real order total; it takes no amount from us.
      const payRes = await paymentsAPI.initialize({ order_id: order.id, method: paymentMethod });
      const payData = payRes.data || {};

      if (paymentMethod === 'wallet') {
        if (payData.status !== 'success') {
          throw new Error('WALLET_NOT_CONFIRMED');
        }
        if (payData.new_balance !== undefined) setServerBalance(payData.new_balance);
        finishPaid({ ...order, total: payData.amount ?? order.total }, 'wallet');
        return;
      }

      if (payData.authorization_url) {
        // The cart stays as it is until the payment is verified in the WebView.
        const paidOrder = order;
        navigation.navigate('PaystackWebView', {
          authorization_url: payData.authorization_url,
          reference: payData.reference,
          onSuccess: () => finishPaid(paidOrder, 'card'),
        });
        return;
      }

      // No checkout address. Only a local development server does this (it
      // has no payment gateway); verify auto-approves there. Anywhere else it
      // is an error, never a placed order.
      if (__DEV__ && payData.reference) {
        const verifyRes = await paymentsAPI.verify(payData.reference);
        if (verifyRes.data?.status === 'success') {
          finishPaid(order, 'card');
          return;
        }
      }
      notifyError();
      Alert.alert(
        'Payment not started',
        'We could not start your card payment. Your order is saved. Please try again.',
      );
    } catch (err) {
      const message = apiError(err, 'Something went wrong. Please try again.');
      if (order && /already paid/i.test(message)) {
        // An earlier attempt went through after all.
        finishPaid(order, paymentMethod);
        return;
      }
      if (order && /expired/i.test(message)) {
        // A discounted order can only be paid for a short while. Forget it so
        // the next attempt makes a fresh order (and takes the code again).
        rememberOrder(null);
      }
      if (!order && promo && /promo|code/i.test(message)) {
        // The code stopped being usable between the preview and checkout.
        setPromo(null);
        setPromoMsg(message);
      }
      notifyError();
      if (err?.message === 'WALLET_NOT_CONFIRMED') {
        Alert.alert('Payment not completed', 'Your wallet payment was not confirmed. Please try again.');
      } else if (/insufficient/i.test(message)) {
        Alert.alert(
          'Not enough in your wallet',
          'Your wallet balance does not cover this order. Add money to your wallet or pay by card. Your order is saved.',
        );
        refreshBalance();
      } else {
        Alert.alert(order ? 'Payment Failed' : 'Order Failed', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Receipt: shown once payment is confirmed ──
  if (placedOrder) {
    const goToOrders = () => {
      const names = navigation.getState?.()?.routeNames || [];
      if (names.includes('MainApp') && user?.role !== 'provider') {
        navigation.popTo('MainApp', { screen: 'Orders' });
      } else {
        navigation.goBack();
      }
    };
    return (
      <View className="flex-1 bg-cream">
        <StatusBar style="dark" />
        <ScreenHeader variant="stack" title="Order placed" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-teal-light items-center justify-center mb-5">
            <Ionicons name="checkmark-circle" size={52} color="#1F4A45" />
          </View>
          <Text className="text-xl font-bold text-ink mb-2 text-center">Thank you! Your order is placed</Text>
          <Text className="text-sm text-ink-soft text-center leading-5">
            {placedOrder.order_number ? `Order ${placedOrder.order_number}` : 'Your order'}
            {placedOrder.recipient_name ? ` for ${placedOrder.recipient_name}` : ''} is paid
            {placedOrder.paidWith === 'wallet' ? ' from your wallet' : ''}.
          </Text>
          {placedOrder.scheduled_date ? (
            <Text className="text-sm text-ink-soft text-center leading-5 mt-1">
              Scheduled for delivery on {formatDay(placedOrder.scheduled_date)}.
            </Text>
          ) : null}
          <Text className="text-[22px] font-extrabold text-teal mt-4">{formatPrice(placedOrder.total)}</Text>
          <TouchableOpacity
            className="bg-teal px-8 h-[52px] rounded-[16px] items-center justify-center mt-8 self-stretch"
            onPress={goToOrders}
          >
            <Text className="text-[15px] font-bold text-white">View my orders</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 px-8" onPress={() => navigation.goBack()}>
            <Text className="text-[14px] font-bold text-ink-soft">Continue shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-cream">
        <StatusBar style="dark" />
        <ScreenHeader variant="stack" title="Cart" onBack={() => navigation.goBack()} />
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
      <StatusBar style="dark" />
      <ScreenHeader
        variant="stack"
        title={`Cart (${itemCount})`}
        onBack={() => navigation.goBack()}
        right={(
        <TouchableOpacity
          className="w-10 h-10 rounded-[14px] items-center justify-center"
          style={{ backgroundColor: '#F3F4F6' }}
          onPress={() => {
            Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#D24B4B" />
        </TouchableOpacity>
        )}
      />

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

        {/* Promo code */}
        <View
          className="bg-white rounded-[20px] p-4 mt-2 mb-1"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
        >
          {promo ? (
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-full bg-teal-light items-center justify-center mr-3">
                <Ionicons name="pricetag-outline" size={17} color="#1F4A45" />
              </View>
              <View className="flex-1">
                <Text className="text-[13.5px] font-bold text-ink">{promo.code} applied</Text>
                <Text className="text-[12px] text-success font-semibold mt-0.5">
                  You save {formatPrice(promo.discount)}
                </Text>
              </View>
              <TouchableOpacity
                className="px-3 py-2"
                onPress={() => { setPromo(null); setPromoMsg(''); }}
                disabled={submitting}
              >
                <Text className="text-[12.5px] font-bold text-ink-soft">Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="flex-row items-center gap-2.5">
                <View className="flex-1 flex-row items-center bg-cream rounded-[14px] px-3.5 h-[46px]">
                  <Ionicons name="pricetag-outline" size={16} color="#9A948A" />
                  <TextInput
                    className="flex-1 ml-2.5 text-[14px] text-ink"
                    style={{ paddingVertical: 0 }}
                    placeholder="Promo code"
                    placeholderTextColor="#B5AFA2"
                    value={promoInput}
                    onChangeText={(t) => { setPromoInput(t.toUpperCase().replace(/[^A-Z0-9]/g, '')); setPromoMsg(''); }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={32}
                    returnKeyType="done"
                    onSubmitEditing={handleApplyPromo}
                  />
                </View>
                <TouchableOpacity
                  className={`h-[46px] px-5 rounded-[14px] items-center justify-center ${
                    promoInput.trim() && !promoBusy ? 'bg-teal' : 'bg-sand'
                  }`}
                  onPress={handleApplyPromo}
                  disabled={!promoInput.trim() || promoBusy}
                >
                  {promoBusy ? (
                    <ActivityIndicator size="small" color="#1F4A45" />
                  ) : (
                    <Text className={`text-[13.5px] font-bold ${promoInput.trim() ? 'text-white' : 'text-ink-caption'}`}>
                      Apply
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {promoMsg ? (
                <Text className="text-[12px] mt-2 leading-4" style={{ color: '#D24B4B' }}>{promoMsg}</Text>
              ) : null}
            </>
          )}
        </View>

        <View
          className="bg-white rounded-[20px] p-5 mt-2"
          style={{ shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
        >
          <Text className="text-[16px] font-bold text-ink mb-4">Order Summary</Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-[13.5px] text-ink-soft">Subtotal ({itemCount} items)</Text>
              <Text className="text-[13.5px] font-bold text-ink">{formatPrice(shownSubtotal)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[13.5px] text-ink-soft">Delivery</Text>
              <Text className="text-[13.5px] font-bold text-success">
                {shownDelivery > 0 ? formatPrice(shownDelivery) : 'Free'}
              </Text>
            </View>
            {shownDiscount > 0 ? (
              <View className="flex-row justify-between">
                <Text className="text-[13.5px] text-ink-soft">
                  Discount{(serverOrder?.promo_code || promo?.code) ? ` (${serverOrder?.promo_code || promo?.code})` : ''}
                </Text>
                <Text className="text-[13.5px] font-bold text-success">-{formatPrice(shownDiscount)}</Text>
              </View>
            ) : null}
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
            {submitting
              ? 'Placing Order…'
              : !signedIn
                ? 'Sign in to check out'
                : serverOrder
                  ? `Complete payment · ${formatPrice(total)}`
                  : `Checkout · ${formatPrice(total)}`}
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
            {/* Delivery day */}
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2">Delivery Day</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              className="mb-2"
            >
              {[{ value: '', top: 'As soon as', bottom: 'possible' }, ...dayOptions].map((opt) => {
                const active = deliveryDay === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value || 'asap'}
                    className={`items-center justify-center px-3.5 py-2.5 rounded-2xl border-2 ${
                      active ? 'border-teal bg-teal-light/30' : 'border-gray-200 bg-gray-50'
                    }`}
                    style={{ minWidth: 76 }}
                    onPress={() => { tapLight(); setDeliveryDay(opt.value); }}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-[11px] font-semibold ${active ? 'text-teal' : 'text-gray-400'}`}>{opt.top}</Text>
                    <Text className={`text-[13px] font-bold mt-0.5 ${active ? 'text-teal' : 'text-gray-700'}`}>{opt.bottom}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text className="text-[12px] text-gray-400 mb-4">
              {deliveryDay
                ? `We will deliver on ${formatDay(deliveryDay)}.`
                : 'Pick a day to have it arrive on a birthday or anniversary.'}
            </Text>

            {/* Send anonymously */}
            <View className="flex-row items-center bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 mb-4">
              <Ionicons name="eye-off-outline" size={18} color={anonymous ? '#1F4A45' : '#9A948A'} />
              <View className="flex-1 ml-3 mr-2">
                <Text className="text-sm font-bold text-gray-800">Send anonymously</Text>
                <Text className="text-[11.5px] text-gray-400 mt-0.5 leading-4">
                  Your name is not shared with the seller or put on the gift.
                </Text>
              </View>
              <Switch
                value={anonymous}
                onValueChange={setAnonymous}
                trackColor={{ false: '#EAE3D8', true: '#1F4A45' }}
                thumbColor="#fff"
              />
            </View>

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
