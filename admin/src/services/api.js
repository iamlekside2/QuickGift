import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout } from '../features/authSlice'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://quickgift-node-api.onrender.com/api/v1'

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
  // A 401 means the stored session is no longer valid: drop it and go back to
  // the sign-in screen. A wrong password on the login request itself is also a
  // 401, and so is any request made with no session at all; neither has a
  // session to expire, so the caller is left to show the error in place.
  if (
    result?.error?.status === 401 &&
    api.endpoint !== 'login' &&
    localStorage.getItem('admin_token')
  ) {
    api.dispatch(logout())
    window.location.href = '/login'
  }
  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Dashboard', 'Orders', 'Products', 'Providers', 'Users', 'Bookings', 'Payments', 'Transactions', 'Payouts', 'Withdrawals', 'Disputes', 'Applications', 'Waitlist', 'Team', 'TeamAudit', 'Settings', 'Referrals', 'Promos'],
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
      query: ({ status, order_type, search, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        if (order_type) params.append('order_type', order_type)
        if (search) params.append('search', search)
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
    // The admin list, not the public /products: it returns every status
    // (active / inactive / draft) so hidden products stay visible and editable.
    getAdminProducts: builder.query({
      query: ({ search, status, category_id, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (status) params.append('status', status)
        if (category_id) params.append('category_id', category_id)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/products?${params.toString()}`
      },
      providesTags: ['Products'],
    }),
    getCategories: builder.query({
      query: () => '/products/categories',
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products', 'Dashboard', 'TeamAudit'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/products/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products', 'Dashboard', 'TeamAudit'],
    }),
    clearProducts: builder.mutation({
      query: () => ({
        url: '/admin/products/clear',
        method: 'POST',
      }),
      invalidatesTags: ['Products', 'Dashboard', 'TeamAudit'],
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
      invalidatesTags: ['Providers', 'Dashboard', 'TeamAudit'],
    }),
    rejectProvider: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/providers/${id}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Providers', 'Dashboard', 'TeamAudit'],
    }),
    suspendProvider: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/providers/${id}/suspend`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Providers', 'Dashboard', 'TeamAudit'],
    }),
    reactivateProvider: builder.mutation({
      query: (id) => ({
        url: `/providers/${id}/reactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Providers', 'Dashboard', 'TeamAudit'],
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
    updateAdminUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Users'],
    }),
    deleteAdminUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users', 'Dashboard', 'TeamAudit'],
    }),
    updateAdminProvider: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/providers/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Providers'],
    }),
    bulkDeleteAdminUsers: builder.mutation({
      query: (ids) => ({
        url: '/admin/users/bulk-delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: ['Users', 'Dashboard', 'TeamAudit'],
    }),

    // ── Reviews ──────────────────────────────────────
    getReviews: builder.query({
      query: ({ targetType, targetId }) => `/reviews/${targetType}/${targetId}`,
    }),

    // ── Settings (Admin) ────────────────────────────
    getAdminSettings: builder.query({
      query: () => '/admin/settings',
      providesTags: ['Settings'],
    }),
    updateAdminSettings: builder.mutation({
      query: (body) => ({
        url: '/admin/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),

    // ── Analytics (Admin) ───────────────────────────
    getRevenueAnalytics: builder.query({
      query: () => '/admin/analytics/revenue',
      providesTags: ['Dashboard'],
    }),
    getExtendedAnalytics: builder.query({
      query: () => '/admin/analytics/extended',
      providesTags: ['Dashboard'],
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
      query: ({ type, search, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (type) params.append('type', type)
        if (search) params.append('search', search)
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
    // `resolution` is exactly 'buyer' or 'provider'. `refund_amount` is optional;
    // when it is left out the server refunds the full order/booking amount.
    resolveDispute: builder.mutation({
      query: ({ id, resolution, notes, refund_amount }) => ({
        url: `/disputes/admin/${id}/resolve`,
        method: 'PATCH',
        body: refund_amount === undefined
          ? { resolution, notes }
          : { resolution, notes, refund_amount },
      }),
      invalidatesTags: ['Disputes', 'Dashboard', 'Transactions', 'Payouts'],
    }),

    // ── Payouts (Admin) ─────────────────────────────
    getAdminPayouts: builder.query({
      query: ({ status, search, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        if (search) params.append('search', search)
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
      invalidatesTags: ['Payouts', 'Transactions', 'Dashboard', 'TeamAudit'],
    }),
    cancelPayout: builder.mutation({
      query: (id) => ({
        url: `/admin/payouts/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Payouts', 'Dashboard', 'TeamAudit'],
    }),

    // ── Withdrawals (Admin) ─────────────────────────
    getWithdrawals: builder.query({
      query: ({ status, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/withdrawals?${params.toString()}`
      },
      providesTags: ['Withdrawals'],
    }),
    completeWithdrawal: builder.mutation({
      query: (id) => ({
        url: `/admin/withdrawals/${id}/complete`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Withdrawals', 'Transactions', 'Dashboard', 'TeamAudit'],
    }),
    // Failing a withdrawal refunds the amount to the user's wallet.
    failWithdrawal: builder.mutation({
      query: (id) => ({
        url: `/admin/withdrawals/${id}/fail`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Withdrawals', 'Transactions', 'Dashboard', 'TeamAudit'],
    }),

    // ── Provider Applications (from the landing page) ───────────
    getProviderApplications: builder.query({
      query: ({ status, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/provider-applications?${params.toString()}`
      },
      providesTags: ['Applications'],
    }),
    updateApplicationStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/provider-applications/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Applications'],
    }),
    deleteApplication: builder.mutation({
      query: (id) => ({
        url: `/admin/provider-applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Applications'],
    }),

    // ── Team / workers (admin accounts) ─────────────────────────
    getStaff: builder.query({
      query: () => '/admin/team',
      providesTags: ['Team'],
    }),
    getStaffRoles: builder.query({
      query: () => '/admin/team/roles',
    }),
    getStaffAudit: builder.query({
      query: ({ page = 1, per_page = 30 } = {}) =>
        `/admin/team/audit?page=${page}&per_page=${per_page}`,
      providesTags: ['TeamAudit'],
    }),
    getAuditLog: builder.query({
      query: ({ entity, page = 1, per_page = 40 } = {}) => {
        const params = new URLSearchParams()
        if (entity) params.append('entity', entity)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/audit?${params.toString()}`
      },
      providesTags: ['TeamAudit'],
    }),
    createStaff: builder.mutation({
      query: (body) => ({
        url: '/admin/team',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Team', 'TeamAudit'],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/team/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Team', 'TeamAudit'],
    }),
    resetStaffPassword: builder.mutation({
      query: ({ id, password }) => ({
        url: `/admin/team/${id}/password`,
        method: 'POST',
        body: { password },
      }),
      invalidatesTags: ['TeamAudit'],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `/admin/team/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Team', 'TeamAudit'],
    }),

    // ── Waitlist signups (from the landing page) ────────────────
    getWaitlist: builder.query({
      query: ({ role, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (role) params.append('role', role)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/waitlist?${params.toString()}`
      },
      providesTags: ['Waitlist'],
    }),
    deleteWaitlistSignup: builder.mutation({
      query: (id) => ({
        url: `/admin/waitlist/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Waitlist'],
    }),

    // ── Refer a friend: who invited whom, and whether it paid out ──
    getAdminReferrals: builder.query({
      query: ({ status, search, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        if (search) params.append('search', search)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/admin/referrals?${params.toString()}`
      },
      providesTags: ['Referrals'],
    }),

    // ── Promo codes ─────────────────────────────────────────────
    getPromos: builder.query({
      query: ({ search, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('page', page)
        params.append('per_page', per_page)
        return `/promos/admin?${params.toString()}`
      },
      providesTags: ['Promos'],
    }),
    createPromo: builder.mutation({
      query: (body) => ({ url: '/promos/admin', method: 'POST', body }),
      invalidatesTags: ['Promos'],
    }),
    updatePromo: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/promos/admin/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Promos'],
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
  useGetAdminProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useClearProductsMutation,
  useGetAdminProvidersQuery,
  useApproveProviderMutation,
  useRejectProviderMutation,
  useSuspendProviderMutation,
  useReactivateProviderMutation,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useBulkDeleteAdminUsersMutation,
  useUpdateAdminProviderMutation,
  useGetReviewsQuery,
  useGetAdminPaymentsQuery,
  useGetAdminTransactionsQuery,
  useGetAdminPayoutsQuery,
  useGetPayoutStatsQuery,
  useReleasePayoutMutation,
  useCancelPayoutMutation,
  useGetWithdrawalsQuery,
  useCompleteWithdrawalMutation,
  useFailWithdrawalMutation,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useGetRevenueAnalyticsQuery,
  useGetExtendedAnalyticsQuery,
  useGetAdminDisputesQuery,
  useResolveDisputeMutation,
  useGetProviderApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useDeleteApplicationMutation,
  useGetWaitlistQuery,
  useGetAdminReferralsQuery,
  useGetPromosQuery,
  useCreatePromoMutation,
  useUpdatePromoMutation,
  useDeleteWaitlistSignupMutation,
  useGetStaffQuery,
  useGetStaffRolesQuery,
  useGetStaffAuditQuery,
  useGetAuditLogQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useResetStaffPasswordMutation,
  useDeleteStaffMutation,
} = api
