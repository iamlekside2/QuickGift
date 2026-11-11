import { createSlice } from '@reduxjs/toolkit'
import { api } from '../services/api'

// A corrupt or hand-edited value here used to throw at import time and leave a
// blank page. Treat anything unreadable as "no stored user".
function readStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem('admin_user') || 'null')
    return user && typeof user === 'object' ? user : null
  } catch {
    localStorage.removeItem('admin_user')
    return null
  }
}

const initialState = {
  user: readStoredUser(),
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
        // Ignore a response that lands after sign-out, or one with no user in it.
        if (!state.token || !payload || typeof payload !== 'object') return
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
