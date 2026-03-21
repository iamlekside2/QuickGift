import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Platform, ScrollView,
  TextInput, Alert, ActivityIndicator, FlatList, Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { walletAPI } from '../../services/api';

export default function AddBankAccountScreen({ navigation }) {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const res = await walletAPI.getBanks();
      setBanks(res.data || []);
    } catch (e) {
      console.log('Error loading banks:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const isValid = selectedBank && accountNumber.length >= 10 && accountName.trim().length >= 3;

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
        `${selectedBank.name} account ending in ${accountNumber.slice(-4)} has been saved.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to add bank account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4 bg-white border-b border-gray-100"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
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

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Bank Selector */}
        <View className="mt-6">
          <Text className="text-sm font-bold text-gray-700 mb-2">Select Bank</Text>
          <TouchableOpacity
            className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200"
            onPress={() => setShowBankPicker(true)}
          >
            <Ionicons name="business-outline" size={20} color="#6B7280" />
            <Text className={`flex-1 ml-3 text-sm ${selectedBank ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
              {selectedBank ? selectedBank.name : 'Choose your bank'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Account Number */}
        <View className="mt-5">
          <Text className="text-sm font-bold text-gray-700 mb-2">Account Number</Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
            <Ionicons name="keypad-outline" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-sm text-gray-900 font-semibold"
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0123456789"
              placeholderTextColor="#D1D5DB"
              maxLength={10}
            />
            {accountNumber.length === 10 && (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>
        </View>

        {/* Account Name */}
        <View className="mt-5">
          <Text className="text-sm font-bold text-gray-700 mb-2">Account Name</Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
            <Ionicons name="person-outline" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-sm text-gray-900 font-semibold"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="John Doe"
              placeholderTextColor="#D1D5DB"
              autoCapitalize="words"
            />
          </View>
          <Text className="text-[11px] text-gray-400 mt-1.5 ml-1">
            Enter the name on your bank account exactly as it appears
          </Text>
        </View>

        {/* Info Note */}
        <View className="flex-row items-start gap-2.5 mt-8 bg-teal-light/40 rounded-2xl p-4">
          <Ionicons name="shield-checkmark-outline" size={18} color="#35615D" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-teal">Secure & Verified</Text>
            <Text className="text-[11px] text-gray-500 mt-0.5 leading-4">
              Your bank details are encrypted and stored securely. Withdrawals are processed within 24 hours.
            </Text>
          </View>
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-6 pb-8 pt-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${isValid ? 'bg-teal' : 'bg-gray-200'}`}
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
              Save Bank Account
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bank Picker Modal */}
      <Modal visible={showBankPicker} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'ios' ? 60 : 30 }}>
          <View className="flex-row items-center px-5 pb-4 border-b border-gray-100">
            <Text className="flex-1 text-lg font-bold text-gray-800">Select Bank</Text>
            <TouchableOpacity onPress={() => setShowBankPicker(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-5 mt-3 mb-2">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3.5 py-3">
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
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`flex-row items-center py-3.5 px-3 rounded-xl mb-0.5 ${
                  selectedBank?.code === item.code ? 'bg-teal-light/40' : ''
                }`}
                onPress={() => {
                  setSelectedBank(item);
                  setShowBankPicker(false);
                  setBankSearch('');
                }}
              >
                <View className="w-9 h-9 rounded-lg bg-gray-100 items-center justify-center mr-3">
                  <Ionicons name="business" size={16} color="#6B7280" />
                </View>
                <Text className="flex-1 text-sm font-medium text-gray-800">{item.name}</Text>
                {selectedBank?.code === item.code && (
                  <Ionicons name="checkmark-circle" size={20} color="#35615D" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Text className="text-sm text-gray-400">No banks found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}
