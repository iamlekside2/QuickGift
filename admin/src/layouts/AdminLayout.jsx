import { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard, ShoppingCart, Package, Sparkles,
  Users, Menu, X, LogOut, Gift, Bell, CalendarCheck,
  Settings, Search, ChevronRight, Wallet, Banknote, AlertTriangle
} from 'lucide-react'
import { logout, selectCurrentUser } from '../features/authSlice'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/providers', label: 'Providers', icon: Sparkles },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/transactions', label: 'Transactions', icon: Wallet },
  { path: '/payouts', label: 'Payouts', icon: Banknote },
  { path: '/disputes', label: 'Disputes', icon: AlertTriangle },
]

const BOTTOM_NAV = [
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const getPageTitle = () => {
    const allItems = [...NAV_ITEMS, ...BOTTOM_NAV]
    const item = allItems.find(n => n.path === location.pathname)
    return item?.label || 'Dashboard'
  }

  const getBreadcrumb = () => {
    if (location.pathname === '/') return null
    const item = [...NAV_ITEMS, ...BOTTOM_NAV].find(n => n.path === location.pathname)
    return item?.label
  }

  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
      isActive
        ? 'bg-teal-500/10 text-teal-600'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
    }`

  const breadcrumb = getBreadcrumb()

  return (
    <div className="flex h-screen bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] bg-white border-r border-gray-100
        flex flex-col
        transform transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-sm shadow-teal-500/20">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 tracking-tight">QuickGift</h1>
            <p className="text-[11px] text-gray-400 font-medium">Admin Console</p>
          </div>
          <button
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-3 space-y-0.5 border-t border-gray-100 pt-3 shrink-0">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Log Out</span>
          </button>

          {/* User profile pill */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-gray-50/80">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">{user?.full_name?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email || 'admin@quickgift.ng'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 h-14 flex items-center gap-4 sticky top-0 z-30 shrink-0">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400 font-medium">QuickGift</span>
            {breadcrumb && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-gray-900 font-semibold">{breadcrumb}</span>
              </>
            )}
            {!breadcrumb && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-gray-900 font-semibold">Dashboard</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-400 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
