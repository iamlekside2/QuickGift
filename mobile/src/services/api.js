// ══════════════════════════════════════════════════════
// API Toggle — switch between mock and real per service
// Set to true = use dummy data, false = use real backend
// ══════════════════════════════════════════════════════
const USE_MOCK_AUTH = false;       // ← Real backend auth
const USE_MOCK_PRODUCTS = true;
const USE_MOCK_PROVIDERS = true;
const USE_MOCK_ORDERS = true;
const USE_MOCK_BOOKINGS = true;
const USE_MOCK_PAYMENTS = true;
const USE_MOCK_REVIEWS = true;
const USE_MOCK_CHATS = true;

// ─── Mock API (dummy data) ───────────────────────────
import {
  authAPI as mockAuthAPI,
  productsAPI as mockProductsAPI,
  providersAPI as mockProvidersAPI,
  ordersAPI as mockOrdersAPI,
  bookingsAPI as mockBookingsAPI,
  paymentsAPI as mockPaymentsAPI,
  reviewsAPI as mockReviewsAPI,
  chatsAPI as mockChatsAPI,
} from './mockApi';

// ─── Real API (Render backend) ───────────────────────
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://quickgift-api.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s — Render free tier can be slow on cold start
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
  checkPhone: (phone) => api.post('/auth/check-phone', { phone }),
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, code) => api.post('/auth/verify-otp', { phone, code }),
  register: (data) => api.post('/auth/register', {
    full_name: data.full_name,
    phone: data.phone,
    otp: data.otp,
    role: data.role || 'user',
    email: data.email || undefined,
    city: data.city || undefined,
  }),
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

const realChatsAPI = {
  listConversations: () => api.get('/chats'),
  getMessages: (conversationId) => api.get(`/chats/${conversationId}/messages`),
  sendMessage: (conversationId, text, senderRole) => api.post(`/chats/${conversationId}/messages`, { text, sender_role: senderRole }),
  createConversation: (providerId, providerName, initialMessage) =>
    api.post('/chats', { provider_id: providerId, provider_name: providerName, initial_message: initialMessage }),
};

// ─── Export based on per-service toggles ─────────────
export const authAPI = USE_MOCK_AUTH ? mockAuthAPI : realAuthAPI;
export const productsAPI = USE_MOCK_PRODUCTS ? mockProductsAPI : realProductsAPI;
export const providersAPI = USE_MOCK_PROVIDERS ? mockProvidersAPI : realProvidersAPI;
export const ordersAPI = USE_MOCK_ORDERS ? mockOrdersAPI : realOrdersAPI;
export const bookingsAPI = USE_MOCK_BOOKINGS ? mockBookingsAPI : realBookingsAPI;
export const paymentsAPI = USE_MOCK_PAYMENTS ? mockPaymentsAPI : realPaymentsAPI;
export const reviewsAPI = USE_MOCK_REVIEWS ? mockReviewsAPI : realReviewsAPI;
export const chatsAPI = USE_MOCK_CHATS ? mockChatsAPI : realChatsAPI;

export default api;
