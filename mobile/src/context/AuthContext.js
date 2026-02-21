import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Error loading auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = async (tokenValue, userData) => {
    try {
      await AsyncStorage.setItem('token', tokenValue);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.log('Error saving auth:', e);
    }
    setToken(tokenValue);
    setUser(userData);
  };

  const sendOTP = async (phone) => {
    const res = await authAPI.sendOTP(phone);
    return res.data;
  };

  const verifyOTP = async (phone, code) => {
    const res = await authAPI.verifyOTP(phone, code);
    const data = res.data;
    if (data?.access_token && data?.user) {
      await saveAuth(data.access_token, data.user);
    } else if (data?.user) {
      setUser(data.user);
    }
    return data;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    await saveAuth(res.data.access_token, res.data.user);
    return res.data;
  };

  const login = async (phone, password) => {
    const res = await authAPI.login(phone, password);
    await saveAuth(res.data.access_token, res.data.user);
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    const updatedUser = res.data;
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const guestLogin = () => {
    setUser({ id: 'guest', full_name: 'Guest', role: 'guest' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isGuest: user?.role === 'guest',
        sendOTP,
        verifyOTP,
        register,
        login,
        updateProfile,
        logout,
        guestLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
