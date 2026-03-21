import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Platform, ScrollView,
  TextInput, Alert, ActivityIndicator, FlatList, Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { walletAPI } from '../../services/api';

// Fallback banks if API fails
const FALLBACK_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

export default function AddBankAccountScreen({ navigation }) {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const resolveTimer = useRef(null);

  useEffect(() => {
    loadBanks();
  }, []);

  // Auto-resolve when bank is selected and account number is 10 digits
  useEffect(() => {
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
    setResolved(false);
    setResolveError('');

    if (selectedBank && accountNumber.length === 10) {
      resolveTimer.current = setTimeout(() => {
        resolveAccount();
      }, 300);
    } else {
      setAccountName('');
    }

    return () => {
      if (resolveTimer.current) clearTimeout(resolveTimer.current);
    };
  }, [accountNumber, selectedBank]);

  const loadBanks = async () => {
    try {
      const res = await walletAPI.getBanks();
      setBanks(res.data?.length ? res.data : FALLBACK_BANKS);
    } catch (e) {
      setBanks(FALLBACK_BANKS);
    } finally {
      setLoading(false);
    }
  };

  const resolveAccount = async () => {
    setResolving(true);
    setResolveError('');
    setAccountName('');
    try {
      const res = await walletAPI.resolveAccount(accountNumber, selectedBank.code);
      if (res.data?.account_name) {
        setAccountName(res.data.account_name);
        setResolved(true);
      }
    } catch (e) {
      const msg = e.response?.data?.detail || 'Could not verify this account';
      setResolveError(msg);
      setAccountName('');
    } finally {
      setResolving(false);
    }
  };

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const isValid = selectedBank && accountNumber.length === 10 && accountName.trim().length >= 3 && resolved;

  const handleSave = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await walletAPI.addBankAccount({
        bank_name: selectedBank.name,
        bank_code: selectedBank.code,
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        is_default: true,
      });
      Alert.alert(
        'Bank Account Added',
        `${selectedBank.name} — ${accountName}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to add bank account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#35615D" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4 bg-white"
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-800">Add Bank Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Form Card */}
        <View
          className="mx-5 mt-5 bg-white rounded-3xl p-5"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          {/* Step 1: Bank */}
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Step 1 — Select Bank</Text>
          <TouchableOpacity
            className={`flex-row items-center bg-gray-50 rounded-2xl h-14 px-4 border mb-5 ${
              selectedBank ? 'border-teal' : 'border-gray-200'
            }`}
            onPress={() => setShowBankPicker(true)}
          >
            <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${
              selectedBank ? 'bg-teal' : 'bg-gray-200'
            }`}>
              <Ionicons name="business" size={18} color={selectedBank ? '#fff' : '#6B7280'} />
            </View>
            <Text className={`flex-1 text-sm ${selectedBank ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
              {selectedBank ? selectedBank.name : 'Choose your bank'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Step 2: Account Number */}
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Step 2 — Account Number</Text>
          <View
            className={`flex-row items-center bg-gray-50 rounded-2xl h-14 px-4 border mb-2 ${
              accountNumber.length === 10 ? (resolveError ? 'border-red-400' : 'border-teal') : 'border-gray-200'
            }`}
          >
            <View className="w-9 h-9 rounded-xl bg-gray-200 items-center justify-center mr-3">
              <Ionicons name="keypad" size={18} color="#6B7280" />
            </View>
            <TextInput
              className="flex-1 text-sm text-gray-900 font-semibold"
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="Enter 10-digit account number"
              placeholderTextColor="#D1D5DB"
              maxLength={10}
              editable={!!selectedBank}
            />
            {resolving && <ActivityIndicator size="small" color="#35615D" />}
            {resolved && !resolving && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
            {resolveError && !resolving && <Ionicons name="close-circle" size={20} color="#EF4444" />}
          </View>
          {!selectedBank && accountNumber.length === 0 && (
            <Text className="text-[11px] text-gray-400 ml-1 mb-4">Select a bank first</Text>
          )}
          {resolveError ? (
            <Text className="text-[11px] text-red-500 ml-1 mb-4">{resolveError}</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Step 3: Account Name (auto-filled) */}
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Step 3 — Account Name</Text>
          <View
            className={`flex-row items-center rounded-2xl h-14 px-4 border ${
              resolved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${
              resolved ? 'bg-green-100' : 'bg-gray-200'
            }`}>
              <Ionicons name="person" size={18} color={resolved ? '#10B981' : '#6B7280'} />
            </View>
            {resolving ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#35615D" />
                <Text className="text-sm text-gray-400">Verifying account...</Text>
              </View>
            ) : (
              <Text className={`flex-1 text-sm ${
                resolved ? 'text-gray-900 font-bold' : 'text-gray-400'
              }`}>
                {accountName || 'Will auto-fill when verified'}
              </Text>
            )}
          </View>
        </View>

        {/* Info */}
        <View className="flex-row items-start gap-3 mx-5 mt-5 bg-teal-light/30 rounded-2xl p-4">
          <Ionicons name="shield-checkmark" size={20} color="#35615D" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-teal">Verified by Paystack</Text>
            <Text className="text-[11px] text-gray-500 mt-1 leading-4">
              We verify your account name automatically. Withdrawals are processed within 24 hours.
            </Text>
          </View>
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-6 pb-8 pt-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          className={`h-14 rounded-2xl items-center justify-center ${isValid ? 'bg-teal' : 'bg-gray-200'}`}
          style={isValid ? {
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          } : undefined}
          onPress={handleSave}
          disabled={!isValid || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`text-base font-bold ${isValid ? 'text-white' : 'text-gray-400'}`}>
              {resolved ? `Save — ${accountName}` : 'Verify account to continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bank Picker Modal */}
      <Modal visible={showBankPicker} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'ios' ? 60 : 30 }}>
          <View className="flex-row items-center px-5 pb-4 border-b border-gray-100">
            <Text className="flex-1 text-lg font-bold text-gray-800">Select Bank</Text>
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => { setShowBankPicker(false); setBankSearch(''); }}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="px-5 mt-3 mb-2">
            <View className="flex-row items-center bg-gray-100 rounded-2xl h-12 px-4">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2.5 text-sm text-gray-900"
                value={bankSearch}
                onChangeText={setBankSearch}
                placeholder="Search banks..."
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
              {bankSearch ? (
                <TouchableOpacity onPress={() => setBankSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => item.code}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`flex-row items-center py-3.5 px-4 rounded-2xl mb-1 ${
                  selectedBank?.code === item.code ? 'bg-teal-light/40' : ''
                }`}
                onPress={() => {
                  setSelectedBank(item);
                  setShowBankPicker(false);
                  setBankSearch('');
                }}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                  selectedBank?.code === item.code ? 'bg-teal' : 'bg-gray-100'
                }`}>
                  <Ionicons name="business" size={18} color={selectedBank?.code === item.code ? '#fff' : '#6B7280'} />
                </View>
                <Text className={`flex-1 text-sm font-medium ${
                  selectedBank?.code === item.code ? 'text-teal font-bold' : 'text-gray-800'
                }`}>{item.name}</Text>
                {selectedBank?.code === item.code && (
                  <Ionicons name="checkmark-circle" size={20} color="#35615D" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Ionicons name="search-outline" size={32} color="#D1D5DB" />
                <Text className="text-sm text-gray-400 mt-2">No banks found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}
