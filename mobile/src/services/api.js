import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api/v1'
  : 'https://api.quickgift.ng/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────
export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, code) => api.post('/auth/verify-otp', { phone, code }),
  register: (data) => api.post('/auth/register', data),
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
};

// ─── Products ───────────────────────────────────────
export const productsAPI = {
  list: (params = {}) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  categories: () => api.get('/products/categories'),
  occasions: () => api.get('/products/occasions'),
};

// ─── Providers ──────────────────────────────────────
export const providersAPI = {
  list: (params = {}) => api.get('/providers', { params }),
  get: (id) => api.get(`/providers/${id}`),
  services: (id) => api.get(`/providers/${id}/services`),
  register: (data) => api.post('/providers', data),
};

// ─── Orders ─────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  list: (params = {}) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
};

// ─── Bookings ───────────────────────────────────────
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  list: (params = {}) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
};

// ─── Payments ───────────────────────────────────────
export const paymentsAPI = {
  initialize: (data) => api.post('/payments/initialize', data),
  verify: (reference) => api.post(`/payments/verify/${reference}`),
};

// ─── Reviews ────────────────────────────────────────
export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  list: (targetType, targetId) => api.get(`/reviews/${targetType}/${targetId}`),
};

export default api;
