import { createSlice } from '@reduxjs/toolkit'
import { api } from '../services/api'

const initialState = {
  user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  token: localStorage.getItem('admin_token') || null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      api.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.user
        state.token = payload.access_token
        localStorage.setItem('admin_token', payload.access_token)
        localStorage.setItem('admin_user', JSON.stringify(payload.user))
      }
    )
    builder.addMatcher(
      api.endpoints.getMe.matchFulfilled,
      (state, { payload }) => {
        state.user = payload
        localStorage.setItem('admin_user', JSON.stringify(payload))
      }
    )
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer

// Selectors
export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => !!state.auth.token
