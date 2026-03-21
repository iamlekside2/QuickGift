import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { walletAPI } from '../../services/api';
import AppInput from '../../components/common/AppInput';

export default function WalletScreen({ navigation }) {
  const { user } = useAuth();
  const { balance, refreshBalance, credit, debit } = useWallet();
  const isProvider = user?.role === 'provider';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states (cross-platform replacement for Alert.prompt)
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferPhone, setTransferPhone] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const lastFetchRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      await refreshBalance();
      const txRes = await walletAPI.getTransactions({ page: 1, per_page: 20 });
      setTransactions(txRes.data || []);
    } catch (e) {
      // Silently fail — keep existing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshBalance]);

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetchRef.current > 30000) {
        setLoading(true);
        fetchData().then(() => {
          lastFetchRef.current = Date.now();
        });
      }
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleFundSubmit = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      // Initialize Paystack payment for wallet funding
      const initRes = await walletAPI.fundInitialize(amount);
      const data = initRes.data;

      if (data.authorization_url) {
        setShowFundModal(false);
        setFundAmount('');
        setProcessing(false);
        // Navigate to Paystack WebView
        navigation.navigate('PaystackWebView', {
          authorization_url: data.authorization_url,
          reference: data.reference,
          successScreen: 'WalletMain',
          onSuccess: async () => {
            await walletAPI.fundVerify(data.reference);
            credit(amount);
            refreshBalance();
          },
        });
        return;
      }

      // Dev mode — no Paystack key, auto-verify
      if (data.reference) {
        await walletAPI.fundVerify(data.reference);
        credit(amount);
        refreshBalance();
      }
      Alert.alert('Success', `₦${amount.toLocaleString()} added to your wallet`);
      setShowFundModal(false);
      setFundAmount('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to fund wallet');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferPhone || transferPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      await walletAPI.transfer(transferPhone, amount);
      debit(amount);
      Alert.alert('Success', `₦${amount.toLocaleString()} sent to ${transferPhone}`);
      setShowTransferModal(false);
      setTransferPhone('');
      setTransferAmount('');
      refreshBalance();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Transfer failed');
    } finally {
      setProcessing(false);
    }
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
                onPress={isProvider ? () => navigation.navigate('WithdrawScreen') : () => setShowFundModal(true)}
                className="flex-1 flex-row items-center justify-center bg-white/20 py-3.5 rounded-2xl gap-2"
              >
                <Ionicons name={isProvider ? 'arrow-down-circle-outline' : 'add-circle-outline'} size={20} color="#fff" />
                <Text className="text-white text-sm font-bold">
                  {isProvider ? 'Withdraw' : 'Fund'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTransferModal(true)}
                className="flex-1 flex-row items-center justify-center bg-white/20 py-3.5 rounded-2xl gap-2"
              >
                <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
                <Text className="text-white text-sm font-bold">Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Transactions */}
        <View className="px-5 mt-6 mb-2">
          <Text className="text-[17px] font-bold text-gray-800 mb-4">Recent Transactions</Text>
        </View>

        {loading ? (
          <View className="mx-5 bg-white rounded-3xl py-12 items-center">
            <ActivityIndicator size="large" color="#35615D" />
          </View>
        ) : transactions.length > 0 ? (
          <View className="mx-5 bg-white rounded-3xl overflow-hidden"
            style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
          >
            {transactions.map((tx, i) => (
              <View
                key={tx.id}
                className={`flex-row items-center px-4 py-4 ${i < transactions.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <View className={`w-11 h-11 rounded-2xl items-center justify-center ${tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <Ionicons name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={18} color={tx.type === 'credit' ? '#10B981' : '#EF4444'} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-[13px] font-bold text-gray-800">{tx.description || 'Transaction'}</Text>
                  <Text className="text-[11px] text-gray-400 mt-0.5">{tx.reference}</Text>
                </View>
                <View className="items-end">
                  <Text className={`text-[14px] font-extrabold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString()}
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">{formatDate(tx.created_at)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="mx-5 bg-white rounded-3xl py-12 items-center"
            style={{ shadowColor: '#1F2937', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
          >
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text className="text-base font-semibold text-gray-400 mt-3">No transactions yet</Text>
            <Text className="text-xs text-gray-300 mt-1">Your transaction history will appear here</Text>
          </View>
        )}

        <View className="h-[100px]" />
      </ScrollView>

      {/* Fund Wallet Modal */}
      <Modal visible={showFundModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-[360px]">
            <Text className="text-lg font-bold text-gray-800 mb-1">Fund Wallet</Text>
            <Text className="text-sm text-gray-400 mb-5">Enter amount to add</Text>
            <AppInput
              label="Amount"
              value={fundAmount}
              onChangeText={setFundAmount}
              type="number"
              placeholder="0"
              icon="cash-outline"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 h-12 rounded-2xl items-center justify-center bg-gray-100"
                onPress={() => { setShowFundModal(false); setFundAmount(''); }}
              >
                <Text className="text-sm font-bold text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] h-12 rounded-2xl items-center justify-center bg-teal"
                onPress={handleFundSubmit}
                disabled={processing}
              >
                <Text className="text-sm font-bold text-white">{processing ? 'Adding...' : 'Add Funds'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal visible={showTransferModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-[360px]">
            <Text className="text-lg font-bold text-gray-800 mb-1">Transfer</Text>
            <Text className="text-sm text-gray-400 mb-5">Send money to another user</Text>
            <AppInput
              label="Phone Number"
              value={transferPhone}
              onChangeText={setTransferPhone}
              type="phone"
              placeholder="801 234 5678"
              autoFocus
            />
            <AppInput
              label="Amount"
              value={transferAmount}
              onChangeText={setTransferAmount}
              type="number"
              placeholder="0"
              icon="cash-outline"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 h-12 rounded-2xl items-center justify-center bg-gray-100"
                onPress={() => { setShowTransferModal(false); setTransferPhone(''); setTransferAmount(''); }}
              >
                <Text className="text-sm font-bold text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] h-12 rounded-2xl items-center justify-center bg-teal"
                onPress={handleTransferSubmit}
                disabled={processing}
              >
                <Text className="text-sm font-bold text-white">{processing ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
