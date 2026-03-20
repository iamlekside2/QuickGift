import { Link } from 'react-router-dom'
import {
  ShoppingCart, Users, DollarSign,
  Sparkles, ArrowUpRight, ArrowDownRight, Loader2, Package,
  CalendarCheck, TrendingUp
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useGetDashboardStatsQuery, useGetAdminOrdersQuery } from '../services/api'

// Placeholder chart data (will come from analytics API later)
const REVENUE_DATA = [
  { name: 'Mon', gifts: 180000, beauty: 95000 },
  { name: 'Tue', gifts: 220000, beauty: 120000 },
  { name: 'Wed', gifts: 195000, beauty: 145000 },
  { name: 'Thu', gifts: 310000, beauty: 160000 },
  { name: 'Fri', gifts: 280000, beauty: 200000 },
  { name: 'Sat', gifts: 420000, beauty: 280000 },
  { name: 'Sun', gifts: 350000, beauty: 190000 },
]

const CATEGORY_DATA = [
  { name: 'Cakes', orders: 145 },
  { name: 'Flowers', orders: 98 },
  { name: 'Hampers', orders: 76 },
  { name: 'Nails', orders: 120 },
  { name: 'Hair', orders: 89 },
  { name: 'Makeup', orders: 65 },
]

const STATUS_STYLES = {
  delivered: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS = {
  delivered: 'Delivered', confirmed: 'Confirmed', in_transit: 'In Transit',
  pending: 'Pending', cancelled: 'Cancelled',
}

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '\u20A60'
  if (amount >= 1_000_000) return `\u20A6${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1000) return `\u20A6${(amount / 1000).toFixed(0)}k`
  return `\u20A6${amount.toLocaleString()}`
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery()
  const { data: ordersData, isLoading: ordersLoading } = useGetAdminOrdersQuery({ per_page: 5 })

  const recentOrders = ordersData?.items || []

  const STATS = [
    {
      label: 'Total Revenue',
      value: formatAmount(stats?.revenue?.total || 0),
      change: formatAmount(stats?.commission?.total || 0) + ' earned',
      up: true,
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Orders',
      value: String(stats?.counts?.orders || 0),
      change: `${stats?.pending?.orders || 0} pending`,
      up: true,
      icon: ShoppingCart,
      color: 'bg-teal-100 text-teal-500',
    },
    {
      label: 'Total Bookings',
      value: String(stats?.counts?.bookings || 0),
      change: `${stats?.pending?.bookings || 0} pending`,
      up: true,
      icon: CalendarCheck,
      color: 'bg-orange-100 text-orange-500',
    },
    {
      label: 'Total Users',
      value: String(stats?.counts?.users || 0),
      change: `${stats?.counts?.products || 0} products`,
      up: true,
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Providers',
      value: String(stats?.counts?.providers || 0),
      change: `${stats?.pending?.providers || 0} pending`,
      up: (stats?.pending?.providers || 0) === 0,
      icon: Sparkles,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Products',
      value: String(stats?.counts?.products || 0),
      change: 'Listed',
      up: true,
      icon: Package,
      color: 'bg-pink-100 text-pink-600',
    },
  ]

  // Commission breakdown
  const commissionGifts = stats?.commission?.gifts || 0
  const commissionBeauty = stats?.commission?.beauty || 0
  const commissionTotal = stats?.commission?.total || 0

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-0.5 text-sm font-medium ${stat.up ? 'text-green-600' : 'text-orange-500'}`}>
                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Commission Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Commission Earned</h3>
            <p className="text-sm text-gray-500">Breakdown by category</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-teal-50 rounded-xl p-4">
            <p className="text-sm text-teal-700 font-medium">Total Commission</p>
            <p className="text-2xl font-bold text-teal-800 mt-1">{formatAmount(commissionTotal)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-sm text-orange-700 font-medium">Gifts Commission</p>
            <p className="text-2xl font-bold text-orange-800 mt-1">{formatAmount(commissionGifts)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-700 font-medium">Beauty Commission</p>
            <p className="text-2xl font-bold text-purple-800 mt-1">{formatAmount(commissionBeauty)}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-500">This week&apos;s performance</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-teal-400" />
                <span className="text-gray-500">Gifts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-400" />
                <span className="text-gray-500">Beauty</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="giftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#35615D" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#35615D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="beautyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FD8950" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#FD8950" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20A6${v / 1000}k`} />
              <Tooltip formatter={(v) => `\u20A6${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="gifts" stroke="#35615D" fill="url(#giftGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="beauty" stroke="#FD8950" fill="url(#beautyGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Top Categories</h3>
          <p className="text-sm text-gray-500 mb-6">Orders by category</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CATEGORY_DATA} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip />
              <Bar dataKey="orders" fill="#35615D" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
          <Link to="/orders" className="text-sm text-teal-500 font-semibold hover:text-teal-600">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No orders yet</td></tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-mono font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${order.order_type === 'gift' ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-600'}`}>
                        {order.order_type === 'gift' ? 'Gift' : 'Beauty'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{'\u20A6'}{(order.total || 0).toLocaleString()}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
