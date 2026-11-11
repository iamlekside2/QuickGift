import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '../../components/common/IconCompat';
import { paymentsAPI, walletAPI } from '../../services/api';
import { notifySuccess, notifyError } from '../../utils/haptics';
import { apiError, apiStatus } from '../../utils/errors';

// Where Paystack sends the browser once the customer is done. The page itself
// does not need to load: seeing this address is the signal to verify.
const CALLBACK_HOST = 'quickgift.ng';
const CALLBACK_PATH = '/payment/callback';

const queryParam = (url, name) => {
  const m = new RegExp('[?&]' + name + '=([^&#]*)').exec(String(url || ''));
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
};

const isCallbackUrl = (url) => {
  const u = String(url || '').toLowerCase();
  if (!u) return false;
  const hostAndPath = u.replace(/^https?:\/\//, '').split(/[?#]/)[0];
  if (
    (hostAndPath.startsWith(CALLBACK_HOST) || hostAndPath.startsWith('www.' + CALLBACK_HOST)) &&
    hostAndPath.includes(CALLBACK_PATH)
  ) {
    return true;
  }
  // Paystack appends ?trxref=...&reference=... to whatever callback is set.
  return !!queryParam(u, 'trxref');
};

/**
 * Card checkout in a WebView.
 *
 * Route params:
 *   authorization_url  Paystack checkout address (required)
 *   reference          the payment reference we created (required to verify)
 *   verifyType         'wallet_fund' for a wallet top-up; anything else
 *                      verifies an order / booking payment
 *   onSuccess          called once with the verify response when the payment
 *                      is confirmed
 *   successScreen      screen to replace this one with after success. Only
 *                      used when it is registered in the same stack as this
 *                      screen; otherwise we simply go back.
 *   successParams      params for successScreen
 */
export default function PaystackWebView({ route, navigation }) {
  const {
    authorization_url,
    reference,
    successScreen,
    successParams,
    onSuccess,
    verifyType,
  } = route.params || {};

  const [loading, setLoading] = useState(true);
  // 'paying' | 'verifying' | 'pending' | 'error'
  const [phase, setPhase] = useState('paying');
  const [notice, setNotice] = useState('');
  // Once Paystack has handed the customer back, the checkout page is done
  // with: checking again must not reload it.
  const [webDone, setWebDone] = useState(false);
  const hasHandledRedirect = useRef(false);
  const finished = useRef(false);
  const mounted = useRef(true);
  const phaseRef = useRef('paying');

  const goPhase = (next) => {
    phaseRef.current = next;
    if (mounted.current) setPhase(next);
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Asks the server once. Never throws.
  // → { status: 'success' | 'pending' | 'failed' | 'error', data?, message? }
  const checkOnce = useCallback(async (payRef) => {
    const ref = payRef || reference;
    if (!ref) return { status: 'error', message: 'This payment has no reference to check.' };
    try {
      const res = verifyType === 'wallet_fund'
        ? await walletAPI.fundVerify(ref)
        : await paymentsAPI.verify(ref);
      const status = res.data?.status;
      if (status === 'success') return { status: 'success', data: res.data };
      if (status === 'failed') return { status: 'failed', message: res.data?.message };
      // 'pending', or anything we do not recognise: not confirmed. Never a success.
      return { status: 'pending', message: res.data?.message };
    } catch (err) {
      const message = apiError(err, 'We could not check your payment. Please try again.');
      // The wallet endpoint answers 400 "Payment not verified yet" while the
      // gateway has not confirmed the top-up.
      if (apiStatus(err) === 400 && /not verified/i.test(message)) {
        return { status: 'pending', message };
      }
      return { status: 'error', message };
    }
  }, [reference, verifyType]);

  const leave = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const succeed = useCallback((data) => {
    if (finished.current) return;
    finished.current = true;
    notifySuccess();
    try {
      onSuccess?.(data);
    } catch (e) {
      // A broken callback must not strand the customer on the payment page.
    }
    const routeNames = navigation.getState?.()?.routeNames || [];
    if (successScreen && routeNames.includes(successScreen)) {
      navigation.replace(successScreen, successParams);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, onSuccess, successScreen, successParams]);

  // Verify after Paystack hands the customer back (or when they press Retry).
  const verifyPayment = useCallback(async (payRef) => {
    if (finished.current) return;
    goPhase('verifying');
    let result = await checkOnce(payRef);
    // The gateway can lag a moment behind the redirect: give it one more go.
    if (result.status === 'pending') {
      await new Promise((r) => setTimeout(r, 2500));
      if (finished.current) return;
      result = await checkOnce(payRef);
    }
    if (finished.current) return;

    if (result.status === 'success') {
      succeed(result.data);
      return;
    }
    if (result.status === 'failed') {
      notifyError();
      finished.current = true;
      Alert.alert(
        'Payment not completed',
        result.message || 'Your payment did not go through. Please try again.',
        [{ text: 'OK', onPress: () => navigation.canGoBack() && navigation.goBack() }],
        { cancelable: false },
      );
      return;
    }
    // Not confirmed yet, or we could not reach the server. Stay here and let
    // the customer check again: never call this a failure.
    if (mounted.current) setWebDone(true);
    setNotice(
      result.status === 'pending'
        ? 'We have not received confirmation of your payment yet. This can take a moment.'
        : result.message,
    );
    goPhase(result.status === 'pending' ? 'pending' : 'error');
  }, [checkOnce, succeed, navigation]);

  const handleCallback = (url) => {
    if (hasHandledRedirect.current) return;
    hasHandledRedirect.current = true;
    // Verify the reference WE created; fall back to the one in the address.
    verifyPayment(reference || queryParam(url, 'reference') || queryParam(url, 'trxref'));
  };

  // Closing the page. One verify first, so a payment that already went
  // through is never lost, then leave.
  const closeAfterCheck = useCallback(async () => {
    if (finished.current) return;
    goPhase('verifying');
    const result = await checkOnce();
    if (finished.current) return;
    if (result.status === 'success') {
      succeed(result.data);
      return;
    }
    leave();
  }, [checkOnce, succeed, leave]);

  const handleCancel = useCallback(() => {
    if (finished.current || phaseRef.current === 'verifying') return;
    if (phaseRef.current !== 'paying') {
      // Already on the "not confirmed yet" view: one more check, then close.
      closeAfterCheck();
      return;
    }
    Alert.alert(
      'Leave payment?',
      'If you have already paid, we will confirm it before closing.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: closeAfterCheck },
      ],
    );
  }, [closeAfterCheck]);

  // Android hardware back and the iOS swipe go through the same check.
  useEffect(() => {
    navigation.setOptions?.({ gestureEnabled: false });
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!authorization_url) return false;
      handleCancel();
      return true;
    });
    return () => sub.remove();
  }, [navigation, handleCancel, authorization_url]);

  if (!authorization_url) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="warning-outline" size={48} color="#D24B4B" />
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

  const verifying = phase === 'verifying';
  const waiting = webDone;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-3 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#211F1C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={handleCancel}
          disabled={verifying}
        >
          <Ionicons name="close" size={20} color="#211F1C" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Paystack Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      {waiting ? (
        /* Not confirmed yet: let the customer check again. */
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-sand items-center justify-center mb-5">
            <Ionicons name={phase === 'error' ? 'cloud-offline-outline' : 'time-outline'} size={38} color="#1F4A45" />
          </View>
          <Text className="text-lg font-bold text-gray-800 text-center">
            {phase === 'error' ? 'Could not check your payment' : 'Payment not confirmed yet'}
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center leading-5">{notice}</Text>
          <Text className="text-xs text-gray-400 mt-2 text-center leading-4">
            If you were charged, your payment is safe. Check again in a moment.
          </Text>
          <TouchableOpacity
            className="mt-6 bg-teal h-[52px] px-10 rounded-2xl items-center justify-center self-stretch"
            onPress={() => verifyPayment()}
          >
            <Text className="text-white font-bold text-[15px]">Check again</Text>
          </TouchableOpacity>
          <TouchableOpacity className="mt-2 py-3 px-8" onPress={leave}>
            <Text className="text-gray-500 font-bold text-sm">Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ uri: authorization_url }}
          onNavigationStateChange={(navState) => {
            if (isCallbackUrl(navState.url)) handleCallback(navState.url);
          }}
          onShouldStartLoadWithRequest={(request) => {
            // Intercept the callback address before the WebView tries to load it
            if (isCallbackUrl(request.url)) {
              handleCallback(request.url);
              return false;
            }
            return true;
          }}
          onError={(syntheticEvent) => {
            // If the callback page itself fails to load, verify anyway
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent?.url && isCallbackUrl(nativeEvent.url)) handleCallback(nativeEvent.url);
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          style={{ flex: 1 }}
        />
      )}

      {/* Verifying Overlay */}
      {verifying && (
        <View className="absolute inset-0 bg-white/90 items-center justify-center z-50">
          <ActivityIndicator size="large" color="#1F4A45" />
          <Text className="text-base font-semibold text-gray-800 mt-4">Verifying payment...</Text>
          <Text className="text-sm text-gray-500 mt-1">Please wait</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && phase === 'paying' && (
        <View className="absolute inset-0 items-center justify-center bg-white/80" style={{ top: 100 }}>
          <ActivityIndicator size="large" color="#1F4A45" />
          <Text className="text-sm text-gray-500 mt-3">Loading payment page...</Text>
        </View>
      )}
    </View>
  );
}
