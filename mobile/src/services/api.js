// ══════════════════════════════════════════════════════
// Set to true to use dummy data (no backend needed)
// Set to false to use real API (Render backend)
// ══════════════════════════════════════════════════════
const USE_MOCK_API = true;

// ─── Mock API (dummy data) ───────────────────────────
import {
  authAPI as mockAuthAPI,
  productsAPI as mockProductsAPI,
  providersAPI as mockProvidersAPI,
  ordersAPI as mockOrdersAPI,
  bookingsAPI as mockBookingsAPI,
  paymentsAPI as mockPaymentsAPI,
  reviewsAPI as mockReviewsAPI,
} from './mockApi';

// ─── Real API (Render backend) ───────────────────────
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://quickgift-api.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

const realAuthAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, code) => api.post('/auth/verify-otp', { phone, code }),
  register: (data) => api.post('/auth/register', data),
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
};

const realProductsAPI = {
  list: (params = {}) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  categories: () => api.get('/products/categories'),
  occasions: () => api.get('/products/occasions'),
};

const realProvidersAPI = {
  list: (params = {}) => api.get('/providers', { params }),
  get: (id) => api.get(`/providers/${id}`),
  services: (id) => api.get(`/providers/${id}/services`),
  register: (data) => api.post('/providers', data),
};

const realOrdersAPI = {
  create: (data) => api.post('/orders', data),
  list: (params = {}) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
};

const realBookingsAPI = {
  create: (data) => api.post('/bookings', data),
  list: (params = {}) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
};

const realPaymentsAPI = {
  initialize: (data) => api.post('/payments/initialize', data),
  verify: (reference) => api.post(`/payments/verify/${reference}`),
};

const realReviewsAPI = {
  create: (data) => api.post('/reviews', data),
  list: (targetType, targetId) => api.get(`/reviews/${targetType}/${targetId}`),
};

// ─── Export based on toggle ──────────────────────────
export const authAPI = USE_MOCK_API ? mockAuthAPI : realAuthAPI;
export const productsAPI = USE_MOCK_API ? mockProductsAPI : realProductsAPI;
export const providersAPI = USE_MOCK_API ? mockProvidersAPI : realProvidersAPI;
export const ordersAPI = USE_MOCK_API ? mockOrdersAPI : realOrdersAPI;
export const bookingsAPI = USE_MOCK_API ? mockBookingsAPI : realBookingsAPI;
export const paymentsAPI = USE_MOCK_API ? mockPaymentsAPI : realPaymentsAPI;
export const reviewsAPI = USE_MOCK_API ? mockReviewsAPI : realReviewsAPI;

export default api;
