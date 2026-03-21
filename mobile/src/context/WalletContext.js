import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { walletAPI } from '../services/api';

const STORAGE_KEY = '@wallet_balance';
const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const appState = useRef(AppState.currentState);

  // Load cached balance on mount, then fetch fresh
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached !== null) {
          setBalance(parseFloat(cached));
          setLoading(false);
        }
      } catch {}
      // Fetch fresh in background
      await refreshBalance();
    })();
  }, []);

  // Re-fetch when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refreshBalance();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await walletAPI.getBalance();
      const bal = res.data?.balance ?? 0;
      setBalance(bal);
      setLastFetched(Date.now());
      await AsyncStorage.setItem(STORAGE_KEY, String(bal));
    } catch (e) {
      // Keep cached balance on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimistic debit — instant UI feedback before API confirms
  const debit = useCallback(async (amount) => {
    setBalance((prev) => {
      const next = Math.max(0, prev - amount);
      AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  // Optimistic credit — instant UI feedback
  const credit = useCallback(async (amount) => {
    setBalance((prev) => {
      const next = prev + amount;
      AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  // Reset on logout
  const resetBalance = useCallback(async () => {
    setBalance(0);
    setLastFetched(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        balance,
        loading,
        lastFetched,
        refreshBalance,
        debit,
        credit,
        resetBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
