import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout } from '../features/authSlice'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://quickgift-api.onrender.com/api/v1'

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)
  if (result?.error?.status === 401) {
    api.dispatch(logout())
    window.location.href = '/login'
  }
  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Dashboard', 'Orders', 'Products', 'Providers', 'Users', 'Bookings', 'Payments', 'Transactions', 'Payouts', 'Disputes'],
  endpoints: (builder) => ({
    // ── Auth ─────────────────────────────────────────
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
    }),

    // ── Dashboard ────────────────────────────────────
    getDashboardStats: builder.query({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard'],
    }),

    // ── Orders (Admin) ──────────────────────────────
    getAdminOrders: builder.query({
      query: ({ status, order_type, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        if (order_type) params.append('order_type', order_type)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/orders?${params.toString()}`
      },
      providesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Orders', 'Dashboard'],
    }),

    // ── Bookings (Admin) ─────────────────────────────
    getAdminBookings: builder.query({
      query: ({ status, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/bookings?${params.toString()}`
      },
      providesTags: ['Bookings'],
    }),

    // ── Products ─────────────────────────────────────
    getProducts: builder.query({
      query: ({ category_id, sort, page = 1, per_page = 50 } = {}) => {
        const params = new URLSearchParams()
        if (category_id) params.append('category_id', category_id)
        if (sort) params.append('sort', sort)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/products?${params.toString()}`
      },
      providesTags: ['Products'],
    }),
    getCategories: builder.query({
      query: () => '/products/categories',
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products', 'Dashboard'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products', 'Dashboard'],
    }),

    // ── Providers (Admin) ────────────────────────────
    getAdminProviders: builder.query({
      query: (status) => {
        const params = status ? `?status=${status}` : ''
        return `/admin/providers${params}`
      },
      providesTags: ['Providers'],
    }),
    approveProvider: builder.mutation({
      query: (id) => ({
        url: `/providers/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Providers', 'Dashboard'],
    }),
    rejectProvider: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/providers/${id}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Providers', 'Dashboard'],
    }),
    suspendProvider: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/providers/${id}/suspend`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Providers', 'Dashboard'],
    }),
    reactivateProvider: builder.mutation({
      query: (id) => ({
        url: `/providers/${id}/reactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Providers', 'Dashboard'],
    }),

    // ── Users (Admin) ────────────────────────────────
    getAdminUsers: builder.query({
      query: ({ search, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/users?${params.toString()}`
      },
      providesTags: ['Users'],
    }),

    // ── Reviews ──────────────────────────────────────
    getReviews: builder.query({
      query: ({ targetType, targetId }) => `/reviews/${targetType}/${targetId}`,
    }),

    // ── Settings (Admin) ────────────────────────────
    getAdminSettings: builder.query({
      query: () => '/admin/settings',
    }),

    // ── Analytics (Admin) ───────────────────────────
    getRevenueAnalytics: builder.query({
      query: () => '/admin/analytics/revenue',
    }),
    getExtendedAnalytics: builder.query({
      query: () => '/admin/analytics/extended',
    }),

    // ── Payments (Admin) ────────────────────────────
    getAdminPayments: builder.query({
      query: ({ status, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/payments?${params.toString()}`
      },
      providesTags: ['Payments'],
    }),

    // ── Transactions (Admin) ────────────────────────
    getAdminTransactions: builder.query({
      query: ({ type, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (type) params.append('type', type)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/transactions?${params.toString()}`
      },
      providesTags: ['Transactions'],
    }),

    // ── Disputes (Admin) ───────────────────────────
    getAdminDisputes: builder.query({
      query: ({ status, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/disputes/admin/all?${params.toString()}`
      },
      providesTags: ['Disputes'],
    }),
    resolveDispute: builder.mutation({
      query: ({ id, resolution, notes }) => ({
        url: `/disputes/admin/${id}/resolve`,
        method: 'PATCH',
        body: { resolution, notes },
      }),
      invalidatesTags: ['Disputes', 'Dashboard'],
    }),

    // ── Payouts (Admin) ─────────────────────────────
    getAdminPayouts: builder.query({
      query: ({ status, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/payouts?${params.toString()}`
      },
      providesTags: ['Payouts'],
    }),
    getPayoutStats: builder.query({
      query: () => '/admin/payouts/stats',
      providesTags: ['Payouts'],
    }),
    releasePayout: builder.mutation({
      query: (id) => ({
        url: `/admin/payouts/${id}/release`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Payouts', 'Dashboard'],
    }),
    cancelPayout: builder.mutation({
      query: (id) => ({
        url: `/admin/payouts/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Payouts', 'Dashboard'],
    }),
  }),
})

export const {
  useLoginMutation,
  useGetMeQuery,
  useGetDashboardStatsQuery,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetAdminBookingsQuery,
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetAdminProvidersQuery,
  useApproveProviderMutation,
  useRejectProviderMutation,
  useSuspendProviderMutation,
  useReactivateProviderMutation,
  useGetAdminUsersQuery,
  useGetReviewsQuery,
  useGetAdminPaymentsQuery,
  useGetAdminTransactionsQuery,
  useGetAdminPayoutsQuery,
  useGetPayoutStatsQuery,
  useReleasePayoutMutation,
  useCancelPayoutMutation,
  useGetAdminSettingsQuery,
  useGetRevenueAnalyticsQuery,
  useGetExtendedAnalyticsQuery,
  useGetAdminDisputesQuery,
  useResolveDisputeMutation,
} = api
