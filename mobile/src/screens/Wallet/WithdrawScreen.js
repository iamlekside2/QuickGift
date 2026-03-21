import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Platform, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { walletAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

export default function WithdrawScreen({ navigation }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [balance, setBalance] = useState(user?.wallet_balance || 0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Reload when returning from AddBankScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const [balRes, bankRes] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getBankAccounts(),
      ]);
      const bal = balRes.data?.balance || 0;
      setBalance(bal);
      const accounts = bankRes.data || [];
      setBankAccounts(accounts);
      // Auto-select default or first
      const defaultAcct = accounts.find(a => a.is_default) || accounts[0];
      if (defaultAcct) setSelectedAccount(defaultAcct);
    } catch (e) {
      console.log('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount >= 500 && numAmount <= balance && selectedAccount;

  const handleWithdraw = async () => {
    if (!isValid) return;

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ₦${numAmount.toLocaleString()} to ${selectedAccount.bank_name} ****${selectedAccount.account_number.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            setSubmitting(true);
            try {
              await walletAPI.withdraw(numAmount, selectedAccount.id);
              Alert.alert(
                'Withdrawal Requested',
                `₦${numAmount.toLocaleString()} is being sent to your ${selectedAccount.bank_name} account. This may take a few minutes.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || 'Withdrawal failed. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#35615D" />
      </View>
    );
  }

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
        <Text className="flex-1 text-center text-lg font-bold text-gray-800">Withdraw</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Balance */}
        <View className="items-center mt-6 mb-2">
          <Text className="text-sm text-gray-400 font-medium">Available Balance</Text>
          <Text className="text-3xl font-extrabold text-gray-900 mt-1">
            ₦{balance.toLocaleString()}
          </Text>
        </View>

        {/* Amount Input */}
        <View className="px-6 mt-6">
          <Text className="text-sm font-bold text-gray-700 mb-2">Amount to withdraw</Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-5 py-4 border border-gray-200">
            <Text className="text-2xl font-bold text-gray-400 mr-1">₦</Text>
            <TextInput
              className="flex-1 text-2xl font-bold text-gray-900"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#D1D5DB"
            />
          </View>
          {numAmount > 0 && numAmount < 500 && (
            <Text className="text-xs text-red-500 mt-2 ml-1">Minimum withdrawal is ₦500</Text>
          )}
          {numAmount > balance && (
            <Text className="text-xs text-red-500 mt-2 ml-1">Insufficient balance</Text>
          )}

          {/* Quick amounts */}
          <View className="flex-row gap-2.5 mt-3">
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  amount === String(amt) ? 'bg-teal' : 'bg-gray-100'
                }`}
                onPress={() => setAmount(String(amt))}
              >
                <Text className={`text-xs font-bold ${
                  amount === String(amt) ? 'text-white' : 'text-gray-600'
                }`}>
                  ₦{(amt / 1000)}k
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bank Account Selection */}
        <View className="px-6 mt-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-gray-700">Withdraw to</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddBankAccount')}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add-circle-outline" size={16} color="#35615D" />
              <Text className="text-xs font-semibold text-teal">Add Bank</Text>
            </TouchableOpacity>
          </View>

          {bankAccounts.length === 0 ? (
            <TouchableOpacity
              className="bg-gray-50 rounded-2xl p-5 items-center border border-dashed border-gray-300"
              onPress={() => navigation.navigate('AddBankAccount')}
            >
              <View className="w-12 h-12 rounded-full bg-teal-light items-center justify-center mb-3">
                <Ionicons name="card-outline" size={24} color="#35615D" />
              </View>
              <Text className="text-sm font-bold text-gray-700">No bank account added</Text>
              <Text className="text-xs text-gray-400 mt-1">Tap to add your bank account</Text>
            </TouchableOpacity>
          ) : (
            <View className="gap-2.5">
              {bankAccounts.map((acct) => (
                <TouchableOpacity
                  key={acct.id}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    selectedAccount?.id === acct.id
                      ? 'bg-teal-light/40 border-teal'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => setSelectedAccount(acct)}
                >
                  <View className={`w-11 h-11 rounded-xl items-center justify-center ${
                    selectedAccount?.id === acct.id ? 'bg-teal' : 'bg-gray-200'
                  }`}>
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color={selectedAccount?.id === acct.id ? '#fff' : '#6B7280'}
                    />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-[13px] font-bold text-gray-800">{acct.bank_name}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {acct.account_name} • ****{acct.account_number.slice(-4)}
                    </Text>
                  </View>
                  {selectedAccount?.id === acct.id ? (
                    <View className="w-6 h-6 rounded-full bg-teal items-center justify-center">
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  ) : (
                    <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
          onPress={handleWithdraw}
          disabled={!isValid || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`text-base font-bold ${isValid ? 'text-white' : 'text-gray-400'}`}>
              {numAmount > 0 ? `Withdraw ₦${numAmount.toLocaleString()}` : 'Enter amount'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
