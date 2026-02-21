/**
 * Mock API layer — returns dummy data in the same format as the real API.
 * Replace `import ... from './api'` with `import ... from './mockApi'` to use.
 * Or toggle USE_MOCK_API in api.js.
 */

import {
  OCCASIONS, GIFT_CATEGORIES, FEATURED_GIFTS, FEATURED_PROVIDERS,
} from '../constants/data';

// Simulate network delay
const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

// ─── Occasions (API format) ──────────────────────────
const occasions = OCCASIONS.map((o) => ({
  id: o.id,
  name: o.label,
  icon: o.icon,
  color: o.color,
  is_active: true,
}));

// ─── Categories (API format) ─────────────────────────
const categories = GIFT_CATEGORIES.map((c, i) => ({
  id: c.id,
  name: c.label,
  icon: c.icon,
  description: '',
  is_active: true,
  sort_order: i + 1,
}));

// ─── Products (API format) ───────────────────────────
const products = [
  ...FEATURED_GIFTS,
  { id: '7', name: 'Vanilla Birthday Cake', price: 12000, rating: 4.6, reviews: 95, category: 'cakes', vendor: 'Sweet Treats Lagos', vendor_name: 'Sweet Treats Lagos', category_name: 'Cakes', is_featured: false },
  { id: '8', name: 'Mixed Flower Bouquet', price: 18000, rating: 4.7, reviews: 67, category: 'flowers', vendor: 'Bloom Nigeria', vendor_name: 'Bloom Nigeria', category_name: 'Flowers', is_featured: false },
  { id: '9', name: 'Anniversary Hamper', price: 42000, rating: 4.9, reviews: 150, category: 'hampers', vendor: 'GiftBox NG', vendor_name: 'GiftBox NG', category_name: 'Hampers', is_featured: false },
  { id: '10', name: 'Assorted Truffles Box', price: 8500, rating: 4.5, reviews: 45, category: 'chocolates', vendor: 'ChocoLux', vendor_name: 'ChocoLux', category_name: 'Chocolates', is_featured: false },
  { id: '11', name: 'Helium Balloon Set (12)', price: 10000, rating: 4.4, reviews: 38, category: 'balloons', vendor: 'Party Central', vendor_name: 'Party Central', category_name: 'Balloons', is_featured: false },
  { id: '12', name: 'Engraved Wooden Frame', price: 7500, rating: 4.6, reviews: 62, category: 'personalized', vendor: 'PrintHub', vendor_name: 'PrintHub', category_name: 'Personalized', is_featured: false },
].map((p) => ({
  ...p,
  vendor_name: p.vendor_name || p.vendor,
  category_name: p.category_name || p.category,
  is_featured: p.is_featured !== undefined ? p.is_featured : true,
  status: 'active',
  city: 'Lagos',
  image_url: null,
  description: null,
  compare_price: null,
  review_count: p.reviews || 0,
  order_count: 0,
}));

// ─── Providers (API format) ──────────────────────────
const providers = [
  ...FEATURED_PROVIDERS,
  { id: '5', name: 'GlowUp Studio', service: 'Waxing', rating: 4.6, reviews: 98, price: 4000, location: 'Ajah, Lagos', available: true },
  { id: '6', name: 'Zen Spa Lagos', service: 'Massage', rating: 4.8, reviews: 215, price: 12000, location: 'Ikoyi, Lagos', available: true },
  { id: '7', name: 'Chioma Braids', service: 'Hair Styling', rating: 4.7, reviews: 178, price: 6000, location: 'Surulere, Lagos', available: false },
  { id: '8', name: 'King Cuts', service: 'Barber', rating: 4.5, reviews: 120, price: 2500, location: 'Ikeja, Lagos', available: true },
].map((p) => ({
  id: p.id,
  user_id: `user-${p.id}`,
  business_name: p.name,
  service_type: p.service,
  bio: `Professional ${p.service.toLowerCase()} with years of experience`,
  location: p.location,
  city: p.location.split(', ')[1] || 'Lagos',
  rating: p.rating,
  review_count: p.reviews,
  booking_count: Math.floor(p.reviews * 1.3),
  experience_years: Math.floor(Math.random() * 5) + 2,
  status: 'verified',
  plan: 'Pro',
  is_available: p.available,
  is_verified: true,
  offers_home_service: true,
  offers_salon_service: true,
  avatar_url: null,
  price: p.price,
}));

// ─── Services per provider ───────────────────────────
const providerServices = {
  '1': [
    { id: 's1', name: 'Gel Manicure', price: 5000, duration_minutes: 45 },
    { id: 's2', name: 'Gel Pedicure', price: 6000, duration_minutes: 60 },
    { id: 's3', name: 'Full Set Acrylic', price: 12000, duration_minutes: 90 },
    { id: 's4', name: 'Nail Art (per nail)', price: 1500, duration_minutes: 15 },
  ],
  '2': [
    { id: 's5', name: 'Wash & Blow Dry', price: 5000, duration_minutes: 45 },
    { id: 's6', name: 'Braiding', price: 8000, duration_minutes: 120 },
    { id: 's7', name: 'Silk Press', price: 10000, duration_minutes: 90 },
    { id: 's8', name: 'Wig Install', price: 15000, duration_minutes: 60 },
  ],
  '3': [
    { id: 's9', name: 'Natural Glam Makeup', price: 15000, duration_minutes: 60 },
    { id: 's10', name: 'Bridal Makeup', price: 50000, duration_minutes: 120 },
    { id: 's11', name: 'Party Makeup', price: 20000, duration_minutes: 75 },
  ],
  '4': [
    { id: 's12', name: 'Regular Haircut', price: 3000, duration_minutes: 30 },
    { id: 's13', name: 'Haircut + Beard Trim', price: 4500, duration_minutes: 45 },
    { id: 's14', name: 'Kids Haircut', price: 2000, duration_minutes: 20 },
  ],
};

// ─── Reviews ─────────────────────────────────────────
const dummyReviews = [
  { id: 'r1', user_name: 'Adaeze O.', rating: 5, comment: 'Absolutely amazing work! Will definitely book again.' },
  { id: 'r2', user_name: 'Tunde A.', rating: 4, comment: 'Great service, very professional. Arrived on time.' },
  { id: 'r3', user_name: 'Fatima B.', rating: 5, comment: 'Best in Lagos! Highly recommend to everyone.' },
  { id: 'r4', user_name: 'Chidi N.', rating: 4, comment: 'Good experience overall. Friendly and skilled.' },
];

// ─── Orders ──────────────────────────────────────────
const dummyOrders = [
  {
    id: 'ord-1', order_number: 'QG-20260001', status: 'delivered',
    total: 15000, items: [{ product_id: '1', quantity: 1 }],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ord-2', order_number: 'QG-20260002', status: 'confirmed',
    total: 37000, items: [{ product_id: '2', quantity: 1 }, { product_id: '3', quantity: 1 }],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ─── Bookings ────────────────────────────────────────
const dummyBookings = [
  {
    id: 'bk-1', provider_name: 'Amara Nails', service_name: 'Gel Manicure',
    status: 'completed', price: 5000,
    booking_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'bk-2', provider_name: 'Tolu MUA', service_name: 'Party Makeup',
    status: 'confirmed', price: 20000,
    booking_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ═══════════════════════════════════════════════════════
// Mock API exports — same shape as real api.js exports
// ═══════════════════════════════════════════════════════

export const authAPI = {
  sendOTP: async (phone) => {
    await delay(500);
    const code = '123456';
    return { data: { message: 'OTP sent successfully', otp_dev: code } };
  },
  verifyOTP: async (phone, code) => {
    await delay(500);
    return {
      data: {
        access_token: 'mock-token-12345',
        user: { id: 'user-1', full_name: 'Test User', phone, role: 'customer', city: 'Lagos' },
      },
    };
  },
  register: async (data) => {
    await delay(500);
    return {
      data: {
        access_token: 'mock-token-12345',
        user: { id: 'user-1', full_name: data.full_name, phone: data.phone, role: 'customer', city: 'Lagos' },
      },
    };
  },
  login: async (phone, password) => {
    await delay(500);
    return {
      data: {
        access_token: 'mock-token-12345',
        user: { id: 'user-1', full_name: 'Test User', phone, role: 'customer', city: 'Lagos' },
      },
    };
  },
  getProfile: async () => {
    await delay(200);
    return { data: { id: 'user-1', full_name: 'Test User', phone: '+2348012345678', role: 'customer', city: 'Lagos' } };
  },
  updateProfile: async (data) => {
    await delay(300);
    return { data: { ...data, id: 'user-1' } };
  },
};

export const productsAPI = {
  list: async (params = {}) => {
    await delay(300);
    let filtered = [...products];
    if (params.category_id) filtered = filtered.filter((p) => p.category === params.category_id);
    if (params.featured) filtered = filtered.filter((p) => p.is_featured);
    if (params.sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    if (params.sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
    if (params.sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    const limit = params.per_page || 20;
    return { data: { items: filtered.slice(0, limit), total: filtered.length, page: 1, per_page: limit } };
  },
  get: async (id) => {
    await delay(200);
    return { data: products.find((p) => p.id === id) || products[0] };
  },
  categories: async () => {
    await delay(200);
    return { data: categories };
  },
  occasions: async () => {
    await delay(200);
    return { data: occasions };
  },
};

export const providersAPI = {
  list: async (params = {}) => {
    await delay(300);
    let filtered = [...providers];
    if (params.service_type) {
      filtered = filtered.filter((p) =>
        p.service_type.toLowerCase().includes(params.service_type.toLowerCase())
      );
    }
    if (params.sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    return { data: filtered };
  },
  get: async (id) => {
    await delay(200);
    return { data: providers.find((p) => p.id === id) || providers[0] };
  },
  services: async (id) => {
    await delay(200);
    return { data: providerServices[id] || providerServices['1'] };
  },
};

export const ordersAPI = {
  create: async (data) => {
    await delay(500);
    const newOrder = {
      id: 'ord-' + Date.now(),
      order_number: 'QG-' + Date.now().toString().slice(-7),
      status: 'pending',
      total: data.items?.reduce((sum, i) => {
        const product = products.find((p) => p.id === i.product_id);
        return sum + (product?.price || 0) * (i.quantity || 1);
      }, 0) || 0,
      items: data.items,
      created_at: new Date().toISOString(),
    };
    dummyOrders.unshift(newOrder);
    return { data: newOrder };
  },
  list: async () => {
    await delay(300);
    return { data: { items: dummyOrders } };
  },
  get: async (id) => {
    await delay(200);
    return { data: dummyOrders.find((o) => o.id === id) || dummyOrders[0] };
  },
};

export const bookingsAPI = {
  create: async (data) => {
    await delay(500);
    const newBooking = {
      id: 'bk-' + Date.now(),
      provider_name: data.provider_name || 'Provider',
      service_name: data.service_name || 'Beauty Service',
      status: 'confirmed',
      price: data.price || 5000,
      booking_date: data.booking_date,
      created_at: new Date().toISOString(),
    };
    dummyBookings.unshift(newBooking);
    return { data: newBooking };
  },
  list: async () => {
    await delay(300);
    return { data: { items: dummyBookings } };
  },
  get: async (id) => {
    await delay(200);
    return { data: dummyBookings.find((b) => b.id === id) || dummyBookings[0] };
  },
  updateStatus: async (id, status) => {
    await delay(300);
    const booking = dummyBookings.find((b) => b.id === id);
    if (booking) booking.status = status;
    return { data: booking };
  },
};

export const paymentsAPI = {
  initialize: async (data) => {
    await delay(300);
    return { data: { authorization_url: 'https://example.com/pay', reference: 'ref-' + Date.now() } };
  },
  verify: async (reference) => {
    await delay(300);
    return { data: { status: 'success', reference } };
  },
};

export const reviewsAPI = {
  create: async (data) => {
    await delay(300);
    return { data: { id: 'r-' + Date.now(), ...data } };
  },
  list: async (targetType, targetId) => {
    await delay(200);
    return { data: dummyReviews };
  },
};

// Default export for interceptor compatibility
export default { interceptors: { request: { use: () => {} }, response: { use: () => {} } } };
