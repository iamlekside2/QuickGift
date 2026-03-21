import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { walletAPI } from '../../services/api';

export default function WalletScreen() {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';

  const [balance, setBalance] = useState(user?.wallet_balance || 0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions({ page: 1, per_page: 20 }),
      ]);
      setBalance(balRes.data?.balance ?? 0);
      setTransactions(txRes.data || []);
    } catch (e) {
      // Silently fail — keep existing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleFund = () => {
    Alert.prompt(
      'Fund Wallet',
      'Enter amount (₦)',
      async (text) => {
        const amount = parseFloat(text);
        if (!amount || amount <= 0) {
          Alert.alert('Error', 'Please enter a valid amount');
          return;
        }
        try {
          const reference = `FND-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          await walletAPI.fund(amount, reference);
          Alert.alert('Success', `₦${amount.toLocaleString()} added to your wallet`);
          fetchData();
        } catch (e) {
          Alert.alert('Error', e.response?.data?.detail || 'Failed to fund wallet');
        }
      },
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleTransfer = () => {
    Alert.prompt(
      'Transfer',
      'Enter recipient phone number',
      (phone) => {
        if (!phone || phone.length < 10) {
          Alert.alert('Error', 'Please enter a valid phone number');
          return;
        }
        Alert.prompt(
          'Transfer Amount',
          `Enter amount to send to ${phone} (₦)`,
          async (text) => {
            const amount = parseFloat(text);
            if (!amount || amount <= 0) {
              Alert.alert('Error', 'Please enter a valid amount');
              return;
            }
            try {
              await walletAPI.transfer(phone, amount);
              Alert.alert('Success', `₦${amount.toLocaleString()} sent to ${phone}`);
              fetchData();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || 'Transfer failed');
            }
          },
          'plain-text',
          '',
          'numeric'
        );
      },
      'plain-text'
    );
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="bg-white px-5 pb-5"
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
      >
        <Text className="text-2xl font-extrabold text-gray-800">Wallet</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#35615D" />
        }
      >
        {/* Balance Card */}
        <View
          className="mx-5 mt-4 bg-teal rounded-3xl overflow-hidden"
          style={{
            shadowColor: '#35615D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View className="p-6 items-center">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Ionicons name="wallet" size={16} color="rgba(255,255,255,0.7)" />
              <Text className="text-white/70 text-sm font-medium">Available Balance</Text>
            </View>
            <Text className="text-white text-[38px] font-extrabold tracking-tight">
              ₦{balance.toLocaleString()}
            </Text>
            <View className="flex-row gap-3 mt-6 w-full">
              <TouchableOpacity
                onPress={isProvider ? () => navigation.navigate('WithdrawScreen') : handleFund}
                className="flex-1 flex-row items-center justify-center bg-white/20 py-3.5 rounded-2xl gap-2"
              >
                <Ionicons name={isProvider ? 'arrow-down-circle-outline' : 'add-circle-outline'} size={20} color="#fff" />
                <Text className="text-white text-sm font-bold">
                  {isProvider ? 'Withdraw' : 'Fund'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTransfer}
                className="flex-1 flex-row items-center justify-center bg-white/20 py-3.5 rounded-2xl gap-2"
              >
                <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
                <Text className="text-white text-sm font-bold">Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row px-5 mt-5 gap-3">
          {[
            { icon: 'card-outline', label: 'Cards', color: '#3B82F6' },
            { icon: 'receipt-outline', label: 'History', color: '#8B5CF6' },
            { icon: 'shield-checkmark-outline', label: 'Limits', color: '#10B981' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              className="flex-1 bg-white rounded-2xl py-4 items-center gap-2"
              style={{
                shadowColor: '#1F2937',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: action.color + '12' }}
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text className="text-xs font-semibold text-gray-600">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions */}
        <View className="px-5 mt-6 mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[17px] font-bold text-gray-800">Recent Transactions</Text>
            <TouchableOpacity>
              <Text className="text-[13px] text-teal font-semibold">See All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View className="mx-5 bg-white rounded-3xl py-12 items-center">
            <ActivityIndicator size="large" color="#35615D" />
          </View>
        ) : transactions.length > 0 ? (
          <View className="mx-5 bg-white rounded-3xl overflow-hidden"
            style={{
              shadowColor: '#1F2937',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {transactions.map((tx, i) => (
              <View
                key={tx.id}
                className={`flex-row items-center px-4 py-4 ${
                  i < transactions.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <View className={`w-11 h-11 rounded-2xl items-center justify-center ${
                  tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <Ionicons
                    name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={tx.type === 'credit' ? '#10B981' : '#EF4444'}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-[13px] font-bold text-gray-800">{tx.description || 'Transaction'}</Text>
                  <Text className="text-[11px] text-gray-400 mt-0.5">{tx.reference}</Text>
                </View>
                <View className="items-end">
                  <Text className={`text-[14px] font-extrabold ${
                    tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString()}
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">{formatDate(tx.created_at)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="mx-5 bg-white rounded-3xl py-12 items-center"
            style={{
              shadowColor: '#1F2937',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text className="text-base font-semibold text-gray-400 mt-3">No transactions yet</Text>
            <Text className="text-xs text-gray-300 mt-1">Your transaction history will appear here</Text>
          </View>
        )}

        <View className="h-[100px]" />
      </ScrollView>
    </View>
  );
}
