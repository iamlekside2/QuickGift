import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { walletAPI } from '../services/api';
import { getToken } from '../utils/tokenStore';
import { useAuth } from './AuthContext';

const STORAGE_KEY = '@wallet_balance';
const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const appState = useRef(AppState.currentState);
  const { token, loading: authLoading } = useAuth();

  // Show the cached balance straight away while the session is restored.
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached !== null) {
          const n = parseFloat(cached);
          if (Number.isFinite(n)) setBalance(n);
          setLoading(false);
        }
      } catch {}
    })();
  }, []);

  // Follow the session: fetch the balance as soon as someone signs in, and
  // wipe it (state + cache) the moment they sign out, so the next account on
  // this device never sees the previous one's money.
  useEffect(() => {
    if (authLoading) return;
    if (token) {
      refreshBalance();
    } else {
      resetBalance();
      setLoading(false);
    }
  }, [token, authLoading]);

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
      const sessionToken = await getToken();
      if (!sessionToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await walletAPI.getBalance();
      const bal = Number(res.data?.balance ?? 0) || 0;
      // The session may have ended while this was in flight.
      if (!(await getToken())) return;
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

  // Set the balance to a figure the server just told us (for example the
  // `new_balance` returned by a wallet payment or a verified top-up).
  const setServerBalance = useCallback((value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    setBalance(n);
    setLastFetched(Date.now());
    AsyncStorage.setItem(STORAGE_KEY, String(n)).catch(() => {});
  }, []);

  // Reset on logout
  const resetBalance = useCallback(async () => {
    setBalance(0);
    setLastFetched(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
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
        setServerBalance,
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
