// ══════════════════════════════════════════════════════
// QuickGift API client (NestJS backend)
// ══════════════════════════════════════════════════════
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, clearToken } from '../utils/tokenStore';

// Auto-switch: the local backend while running `expo start` (__DEV__ === true),
// the Render deployment in any release build (preview APK / production).
// NOTE: update the Render host if your service name differs from render.yaml
// (service `quickgift-node-api` → https://quickgift-node-api.onrender.com).
// For local testing on a PHYSICAL device, swap 127.0.0.1 for this machine's LAN IP.
// EXPO_PUBLIC_API_URL overrides both, e.g. to test a development session on a
// real phone against the live backend (the phone cannot reach 127.0.0.1).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  || (__DEV__
    ? 'http://127.0.0.1:8001/api/v1'
    : 'https://quickgift-node-api.onrender.com/api/v1');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s — Render free tier can be slow on cold start
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Logout callback — set by AuthContext to sync React state on 401
let _onUnauthorized = null;
export const setOnUnauthorized = (callback) => { _onUnauthorized = callback; };

const sentAuthHeader = (config) => {
  const h = config?.headers;
  if (!h) return null;
  const value = typeof h.get === 'function' ? h.get('Authorization') : h.Authorization;
  return value ? String(value) : null;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // A 401 only means "your session ended" when a session token was actually
    // sent. A guest (no token) hitting a signed-in-only endpoint must NOT be
    // thrown out of the app; the screen shows a sign-in prompt instead.
    if (error.response?.status === 401) {
      const sent = sentAuthHeader(error.config);
      if (sent) {
        const current = await getToken();
        // Ignore a late 401 from a request made with an older token (for
        // example one that was in flight while the user signed in again).
        if (current && sent === `Bearer ${current}`) {
          await clearToken();
          AsyncStorage.removeItem('user').catch(() => {});
          if (_onUnauthorized) _onUnauthorized();
        }
      }
    }
    return Promise.reject(error);
  }
);

const realAuthAPI = {
  checkPhone: (phone) => api.post('/auth/check-phone', { phone }),
  sendOTP: (phone, email) => api.post('/auth/send-otp', email ? { phone, email } : { phone }),
  verifyOTP: (phone, code) => api.post('/auth/verify-otp', { phone, code }),
  register: (data) => api.post('/auth/register', {
    full_name: data.full_name,
    phone: data.phone,
    otp: data.otp,
    role: data.role || 'user',
    email: data.email || undefined,
    password: data.password || undefined,
    city: data.city || undefined,
    referral_code: data.referral_code || undefined,
  }),
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  getProfile: () => api.get('/auth/me'),
  deleteAccount: () => api.delete('/auth/me'),
  // Set a password (code-only account) or change it (needs current_password).
  setPassword: (newPassword, currentPassword) => api.post('/auth/password', {
    new_password: newPassword,
    current_password: currentPassword || undefined,
  }),
  updateProfile: (data) => api.patch('/auth/me', data),
  registerPushToken: (token) => api.post('/auth/push-token', { token }),
};

const realProductsAPI = {
  list: (params = {}) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  categories: () => api.get('/products/categories'),
  occasions: () => api.get('/products/occasions'),
  // A seller's own listings
  mine: () => api.get('/products/my-products'),
  createMine: (data) => api.post('/products/my-products', data),
  updateMine: (id, data) => api.patch(`/products/my-products/${id}`, data),
  deleteMine: (id) => api.delete(`/products/my-products/${id}`),
};

const realProvidersAPI = {
  list: (params = {}) => api.get('/providers', { params }),
  get: (id) => api.get(`/providers/${id}`),
  me: () => api.get('/providers/me'),
  updateMe: (data) => api.patch('/providers/me', data),
  services: (id) => api.get(`/providers/${id}/services`),
  register: (data) => api.post('/providers', data),
  addService: (providerId, data) => api.post(`/providers/${providerId}/services`, data),
  addMyService: (data) => api.post('/providers/me/services', data),
  updateMyService: (serviceId, data) => api.patch(`/providers/me/services/${serviceId}`, data),
  deleteMyService: (serviceId) => api.delete(`/providers/me/services/${serviceId}`),
  // Public: a provider's working hours, used to build booking time slots
  availability: (id) => api.get(`/providers/${id}/availability`),
  getAvailability: () => api.get('/providers/me/availability'),
  saveAvailability: (data) => api.put('/providers/me/availability', data),
};

const realOrdersAPI = {
  create: (data) => api.post('/orders', data),
  list: (params = {}) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  // For a gift ordered without an address: the buyer supplies it themselves.
  setAddress: (id, data) => api.post(`/orders/${id}/address`, data),
  vendorOrders: (params = {}) => api.get('/orders/my-vendor-orders', { params }),
  providerUpdateStatus: (id, status) => api.patch(`/orders/${id}/provider-status`, { status }),
};

const realBookingsAPI = {
  create: (data) => api.post('/bookings', data),
  list: (params = {}) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
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

const realNotificationsAPI = {
  list: (params = {}) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

const realChatsAPI = {
  listConversations: () => api.get('/chats'),
  getMessages: (conversationId) => api.get(`/chats/${conversationId}/messages`),
  // The server works out who is speaking from the session, so no role is sent.
  sendMessage: (conversationId, text) => api.post(`/chats/${conversationId}/messages`, { text }),
  // provider_id may be the provider PROFILE id or their user id. The server
  // finds the existing thread for this buyer/provider pair or creates one.
  createConversation: (providerId, initialMessage) =>
    api.post('/chats', initialMessage ? { provider_id: providerId, initial_message: initialMessage } : { provider_id: providerId }),
};

const realUploadAPI = {
  image: (uri) => {
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' });
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

const realWalletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params = {}) => api.get('/wallet/transactions', { params }),
  fund: (amount, reference) => api.post('/wallet/fund', { amount, reference }),
  // Send an empty object, never null: axios serialises null as the text "null",
  // which the server's JSON parser rejects with a 400.
  fundInitialize: (amount) => api.post('/wallet/fund/initialize', {}, { params: { amount } }),
  fundVerify: (reference) => api.post(`/wallet/fund/verify/${reference}`),
  transfer: (recipientPhone, amount) => api.post('/wallet/transfer', { recipient_phone: recipientPhone, amount }),
  // Bank accounts
  getBanks: () => api.get('/wallet/banks'),
  resolveAccount: (accountNumber, bankCode) => api.get('/wallet/resolve-account', { params: { account_number: accountNumber, bank_code: bankCode } }),
  getBankAccounts: () => api.get('/wallet/bank-accounts'),
  addBankAccount: (data) => api.post('/wallet/bank-accounts', data),
  deleteBankAccount: (id) => api.delete(`/wallet/bank-accounts/${id}`),
  setDefaultBank: (id) => api.patch(`/wallet/bank-accounts/${id}/default`),
  // Withdraw
  withdraw: (amount, bankAccountId) => api.post('/wallet/withdraw', { amount, bank_account_id: bankAccountId }),
};

const realDeliveryAPI = {
  getQuote: (data) => api.post('/delivery/quote', data),
  create: (data) => api.post('/delivery/create', data),
  track: (orderId) => api.get(`/delivery/track/${orderId}`),
  cancel: (orderId) => api.post(`/delivery/cancel/${orderId}`),
};

// ─── Exports ─────────────────────────────────────────
export const authAPI = realAuthAPI;
export const productsAPI = realProductsAPI;
export const providersAPI = realProvidersAPI;
export const ordersAPI = realOrdersAPI;
export const bookingsAPI = realBookingsAPI;
export const paymentsAPI = realPaymentsAPI;
export const reviewsAPI = realReviewsAPI;
export const chatsAPI = realChatsAPI;
export const notificationsAPI = realNotificationsAPI;
export const walletAPI = realWalletAPI;
export const uploadAPI = realUploadAPI;
export const deliveryAPI = realDeliveryAPI;

const realDisputesAPI = {
  raise: (data) => api.post('/disputes', data),
  list: (params = {}) => api.get('/disputes', { params }),
  respond: (id, data) => api.patch(`/disputes/${id}/respond`, data),
};
export const disputesAPI = realDisputesAPI;

const realFeedbackAPI = {
  // { message, category?, rating?, app_version? }
  submit: (data) => api.post('/feedback', data),
};
export const feedbackAPI = realFeedbackAPI;

const realReferralAPI = {
  // My code, the current reward and the friends who joined with it.
  mine: () => api.get('/referrals/me'),
  // Public: is this code usable? -> { valid, referrer_name?, reward_amount? }
  check: (code) => api.post('/referrals/check', { code }),
};
export const referralAPI = realReferralAPI;

const realRemindersAPI = {
  // Yearly occasion reminders: { occasion, person_name, month, day, days_before, is_active }
  list: () => api.get('/reminders'),
  create: (data) => api.post('/reminders', data),
  update: (id, data) => api.patch(`/reminders/${id}`, data),
  remove: (id) => api.delete(`/reminders/${id}`),
};
export const remindersAPI = realRemindersAPI;

const realPromosAPI = {
  // Preview only (does not spend the code): { valid, code?, discount?, message? }
  validate: (code, subtotal) => api.post('/promos/validate', { code, subtotal }),
};
export const promosAPI = realPromosAPI;

const realPoolsAPI = {
  // Group gifts: the same body as an order, plus { days } the pool stays open.
  create: (data) => api.post('/pools', data),
  mine: () => api.get('/pools/mine'),
  get: (id) => api.get(`/pools/${id}`),
  cancel: (id) => api.post(`/pools/${id}/cancel`),
};
export const poolsAPI = realPoolsAPI;

export default api;
