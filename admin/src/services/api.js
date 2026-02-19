import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('admin_token')
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Dashboard', 'Orders', 'Products', 'Providers', 'Users', 'Bookings'],
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
      query: (id) => ({
        url: `/providers/${id}/reject`,
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
  useGetAdminUsersQuery,
  useGetReviewsQuery,
} = api
