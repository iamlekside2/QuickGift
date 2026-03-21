import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from './features/authSlice'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'

// Lazy-loaded pages — only loaded when navigated to
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const BookingsPage = lazy(() => import('./pages/BookingsPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProvidersPage = lazy(() => import('./pages/ProvidersPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const PayoutsPage = lazy(() => import('./pages/PayoutsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const DisputesPage = lazy(() => import('./pages/DisputesPage'))

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="orders" element={<Suspense fallback={<PageLoader />}><OrdersPage /></Suspense>} />
        <Route path="bookings" element={<Suspense fallback={<PageLoader />}><BookingsPage /></Suspense>} />
        <Route path="products" element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
        <Route path="providers" element={<Suspense fallback={<PageLoader />}><ProvidersPage /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
        <Route path="transactions" element={<Suspense fallback={<PageLoader />}><TransactionsPage /></Suspense>} />
        <Route path="payouts" element={<Suspense fallback={<PageLoader />}><PayoutsPage /></Suspense>} />
        <Route path="disputes" element={<Suspense fallback={<PageLoader />}><DisputesPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
