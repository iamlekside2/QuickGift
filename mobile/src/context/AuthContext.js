import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, setOnUnauthorized } from '../services/api';
import { getToken, setToken as storeToken, clearToken } from '../utils/tokenStore';
import { registerForPushNotifications } from '../utils/notifications';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);

  const applyUser = (next) => {
    userRef.current = next;
    setUser(next);
  };

  useEffect(() => {
    // Register 401 handler to sync React state when the session is no longer
    // valid (expired token, deactivated or deleted account).
    setOnUnauthorized(() => {
      setToken(null);
      applyUser(null);
    });
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    let restored = false;
    try {
      const storedToken = await getToken();
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        applyUser(JSON.parse(storedUser));
        restored = true;
      } else if (storedToken || storedUser) {
        // Half a session is no session.
        await clearToken();
        await AsyncStorage.removeItem('user');
      }
    } catch (e) {
      console.log('Error loading auth:', e);
    } finally {
      setLoading(false);
    }
    // Check the restored session against the server without holding up the
    // first screen. A 401 clears the session quietly (see api.js); a network
    // error keeps the cached user so the app still opens offline.
    if (restored) refreshUser();
  };

  /** Re-read the signed-in user from the server and update the cached copy. */
  const refreshUser = async () => {
    try {
      const res = await authAPI.getProfile();
      const fresh = res.data;
      if (!fresh?.id) return null;
      // The session may have ended while the request was in flight.
      if (!userRef.current || userRef.current.role === 'guest') return null;
      // /auth/me does not carry login-only fields such as profile_complete,
      // so merge instead of replacing.
      const merged = { ...userRef.current, ...fresh };
      applyUser(merged);
      await AsyncStorage.setItem('user', JSON.stringify(merged));
      return merged;
    } catch (e) {
      return null;
    }
  };

  const saveAuth = async (tokenValue, userData) => {
    try {
      await storeToken(tokenValue);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.log('Error saving auth:', e);
    }
    setToken(tokenValue);
    applyUser(userData);
  };

  const checkPhone = async (phone) => {
    const res = await authAPI.checkPhone(phone);
    return res.data;
  };

  const sendOTP = async (phone, email) => {
    const res = await authAPI.sendOTP(phone, email);
    return res.data;
  };

  const verifyOTP = async (phone, code) => {
    const res = await authAPI.verifyOTP(phone, code);
    const data = res.data;
    if (data?.access_token && data?.user) {
      await saveAuth(data.access_token, data.user);
      registerForPushNotifications().catch(() => {});
    } else if (data?.user) {
      applyUser(data.user);
    }
    return data;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    await saveAuth(res.data.access_token, res.data.user);
    registerForPushNotifications().catch(() => {});
    return res.data;
  };

  const login = async (phone, password) => {
    const res = await authAPI.login(phone, password);
    await saveAuth(res.data.access_token, res.data.user);
    registerForPushNotifications().catch(() => {});
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    const updatedUser = { ...(userRef.current || {}), ...(res.data || {}) };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    applyUser(updatedUser);
    return updatedUser;
  };

  // Ends the session on this device. The wallet and cart providers watch the
  // token and wipe their own state, so the next account never sees this one's
  // balance or basket.
  const logout = async () => {
    await clearToken();
    await AsyncStorage.removeItem('user');
    setToken(null);
    applyUser(null);
  };

  /** Permanently delete the signed-in account, then end the session. */
  const deleteAccount = async () => {
    const res = await authAPI.deleteAccount();
    await logout();
    return res.data;
  };

  const updateUser = async (fields) => {
    const updatedUser = { ...(userRef.current || {}), ...fields };
    applyUser(updatedUser);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      console.log('Error updating user:', e);
    }
  };

  const guestLogin = () => {
    applyUser({ id: 'guest', full_name: 'Guest', role: 'guest' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isGuest: user?.role === 'guest',
        checkPhone,
        sendOTP,
        verifyOTP,
        register,
        login,
        updateProfile,
        updateUser,
        refreshUser,
        logout,
        deleteAccount,
        guestLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
