import { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard, ShoppingCart, Package, Sparkles,
  Users, Menu, X, LogOut, Gift, Bell, CalendarCheck,
  Settings, Search, ChevronRight, Wallet, Banknote, AlertTriangle, UserPlus,
  ShieldCheck
} from 'lucide-react'
import { logout, selectCurrentUser } from '../features/authSlice'
import { hasPerm, roleLabel } from '../lib/permissions'
import logo from '../assets/logo.png'

// `perm` gates visibility; items with no perm (Dashboard) show for all staff.
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingCart, perm: 'orders.view' },
  { path: '/bookings', label: 'Bookings', icon: CalendarCheck, perm: 'bookings.view' },
  { path: '/products', label: 'Products', icon: Package, perm: 'products.view' },
  { path: '/providers', label: 'Providers', icon: Sparkles, perm: 'providers.view' },
  { path: '/applications', label: 'Applications', icon: UserPlus, perm: 'applications.view' },
  { path: '/users', label: 'Users', icon: Users, perm: 'users.view' },
  { path: '/transactions', label: 'Transactions', icon: Wallet, perm: 'finance.view' },
  { path: '/payouts', label: 'Payouts', icon: Banknote, perm: 'finance.view' },
  { path: '/disputes', label: 'Disputes', icon: AlertTriangle, perm: 'disputes.view' },
  { path: '/team', label: 'Team', icon: ShieldCheck, perm: 'team.manage' },
]

const BOTTOM_NAV = [
  { path: '/settings', label: 'Settings', icon: Settings, perm: 'settings.manage' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)

  const navItems = NAV_ITEMS.filter((i) => !i.perm || hasPerm(user, i.perm))
  const bottomNav = BOTTOM_NAV.filter((i) => !i.perm || hasPerm(user, i.perm))

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
        ? 'bg-white/12 text-white shadow-sm'
        : 'text-white/55 hover:text-white hover:bg-white/8'
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
        w-[260px] bg-[#1F4A45] border-r border-black/20
        flex flex-col
        transform transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm shadow-black/20 shrink-0 p-1">
            <img src={logo} alt="QuickGift" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight">QuickGift</h1>
            <p className="text-[11px] text-white/45 font-medium">Admin Console</p>
          </div>
          <button
            className="lg:hidden p-1 text-white/60 hover:text-white rounded-md hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {navItems.map((item) => (
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
        <div className="px-3 pb-3 space-y-0.5 border-t border-white/10 pt-3 shrink-0">
          {bottomNav.map((item) => (
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
            className="group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-white/55 hover:text-white hover:bg-red-500/25 transition-all duration-150"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Log Out</span>
          </button>

          {/* User profile pill */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">{user?.full_name?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-[11px] text-white/45 truncate">
                {user?.role_label || (user?.role ? roleLabel(user.role) : user?.email || 'admin@quickgift.ng')}
              </p>
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
