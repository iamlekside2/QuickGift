import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '../common/IconCompat';
import AppInput from '../common/AppInput';
import { ordersAPI } from '../../services/api';
import { apiError } from '../../utils/errors';
import { shareGiftLink } from '../../utils/giftLink';
import { notifySuccess, notifyError, tapLight } from '../../utils/haptics';

const shadow = { shadowColor: '#211F1C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 };

/**
 * Shown on an order that was placed without a delivery address. The buyer can
 * share the link again, or type the address in themselves.
 *
 * @param {object} order   The order (needs id, recipient_name, claim_url).
 * @param {(patch: object) => void} onDone  Called with the saved address.
 */
export default function AddressPendingCard({ order, onDone }) {
  const [typing, setTyping] = useState(false);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const who = String(order?.recipient_name || '').trim().split(/\s+/)[0] || 'the recipient';
  const paid = order?.payment_status === 'paid';

  const save = async () => {
    if (address.trim().length < 8 || saving) return;
    setSaving(true);
    try {
      const res = await ordersAPI.setAddress(order.id, { delivery_address: address.trim() });
      notifySuccess();
      onDone?.({
        delivery_address: res.data?.delivery_address || address.trim(),
        address_pending: false,
        claim_url: null,
      });
    } catch (err) {
      notifyError();
      Alert.alert('Address not saved', apiError(err, 'We could not save the address. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="bg-white rounded-[20px] p-5 mt-4" style={{ ...shadow, borderWidth: 1.5, borderColor: '#F6C9A9' }}>
      <View className="flex-row items-center gap-2.5 mb-2">
        <View className="w-9 h-9 rounded-full bg-orange-light items-center justify-center">
          <Ionicons name="location-outline" size={18} color="#E8632F" />
        </View>
        <Text className="flex-1 text-[14.5px] font-bold text-ink">Waiting for the delivery address</Text>
      </View>
      <Text className="text-[13px] text-ink-soft leading-[19px] mb-4">
        {paid
          ? `We cannot send this gift until we know where ${who} wants it. Share the link so they can tell us, or enter the address yourself.`
          : `Once this order is paid, ${who} can use the link to tell us where to deliver. You can also enter the address yourself.`}
      </Text>

      {order?.claim_url ? (
        <TouchableOpacity
          className="bg-teal h-[48px] rounded-[14px] flex-row items-center justify-center gap-2 mb-2.5"
          onPress={() => { tapLight(); shareGiftLink(order); }}
          activeOpacity={0.85}
        >
          <Ionicons name="share-social" size={17} color="#fff" />
          <Text className="text-[14px] font-bold text-white">Share the link with {who}</Text>
        </TouchableOpacity>
      ) : null}

      {typing ? (
        <View className="mt-1">
          <AppInput
            label="Delivery Address"
            value={address}
            onChangeText={setAddress}
            placeholder="House number, street and area"
            type="multiline"
            icon="location-outline"
            maxLength={300}
          />
          <TouchableOpacity
            className={`h-[48px] rounded-[14px] items-center justify-center ${
              address.trim().length >= 8 && !saving ? 'bg-teal' : 'bg-sand'
            }`}
            onPress={save}
            disabled={address.trim().length < 8 || saving}
          >
            <Text className={`text-[14px] font-bold ${address.trim().length >= 8 && !saving ? 'text-white' : 'text-ink-caption'}`}>
              {saving ? 'Saving…' : 'Save address'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          className="h-[46px] rounded-[14px] items-center justify-center border-[1.5px] border-line-border"
          onPress={() => setTyping(true)}
        >
          <Text className="text-[13.5px] font-bold text-ink">Enter the address myself</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
