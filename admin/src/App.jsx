import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectCurrentUser } from './features/authSlice'
import { hasPerm } from './lib/permissions'
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
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

// Gates a route by permission; a worker without it is bounced to the dashboard.
function PermRoute({ perm, children }) {
  const user = useSelector(selectCurrentUser)
  if (perm && !hasPerm(user, perm)) return <Navigate to="/" replace />
  return children
}

const page = (perm, El) => (
  <PermRoute perm={perm}>
    <Suspense fallback={<PageLoader />}><El /></Suspense>
  </PermRoute>
)

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
        <Route path="orders" element={page('orders.view', OrdersPage)} />
        <Route path="bookings" element={page('bookings.view', BookingsPage)} />
        <Route path="products" element={page('products.view', ProductsPage)} />
        <Route path="providers" element={page('providers.view', ProvidersPage)} />
        <Route path="users" element={page('users.view', UsersPage)} />
        <Route path="transactions" element={page('finance.view', TransactionsPage)} />
        <Route path="payouts" element={page('finance.view', PayoutsPage)} />
        <Route path="disputes" element={page('disputes.view', DisputesPage)} />
        <Route path="applications" element={page('applications.view', ApplicationsPage)} />
        <Route path="team" element={page('team.manage', TeamPage)} />
        <Route path="settings" element={page('settings.manage', SettingsPage)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
