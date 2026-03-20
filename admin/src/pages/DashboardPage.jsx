import { Link } from 'react-router-dom'
import {
  ShoppingCart, Users, DollarSign,
  Sparkles, ArrowUpRight, ArrowDownRight, Loader2, Package,
  CalendarCheck, TrendingUp, ArrowRight
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { useGetDashboardStatsQuery, useGetAdminOrdersQuery } from '../services/api'

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
  { name: 'Cakes', orders: 145, fill: '#35615D' },
  { name: 'Flowers', orders: 98, fill: '#51a399' },
  { name: 'Hampers', orders: 76, fill: '#7dbab3' },
  { name: 'Nails', orders: 120, fill: '#FD8950' },
  { name: 'Hair', orders: 89, fill: '#fdac72' },
  { name: 'Makeup', orders: 65, fill: '#ffc9a3' },
]

const STATUS_STYLES = {
  delivered: 'badge-green',
  confirmed: 'badge-blue',
  in_transit: 'badge-yellow',
  pending: 'badge-gray',
  cancelled: 'badge-red',
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs border border-gray-800">
        <p className="font-semibold mb-1.5">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-gray-400 capitalize">{entry.dataKey}:</span>
            <span className="font-semibold">{'\u20A6'}{entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery()
  const { data: ordersData, isLoading: ordersLoading } = useGetAdminOrdersQuery({ per_page: 5 })

  const recentOrders = ordersData?.items || []

  const STATS = [
    {
      label: 'Total Revenue',
      value: formatAmount(stats?.revenue?.total || 0),
      sub: formatAmount(stats?.commission?.total || 0) + ' earned',
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      trend: 'up',
    },
    {
      label: 'Total Orders',
      value: String(stats?.counts?.orders || 0),
      sub: `${stats?.pending?.orders || 0} pending`,
      icon: ShoppingCart,
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-600',
      trend: 'up',
    },
    {
      label: 'Total Bookings',
      value: String(stats?.counts?.bookings || 0),
      sub: `${stats?.pending?.bookings || 0} pending`,
      icon: CalendarCheck,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-600',
      trend: 'up',
    },
    {
      label: 'Total Users',
      value: String(stats?.counts?.users || 0),
      sub: `${stats?.counts?.products || 0} products`,
      icon: Users,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600',
      trend: 'up',
    },
    {
      label: 'Providers',
      value: String(stats?.counts?.providers || 0),
      sub: `${stats?.pending?.providers || 0} pending`,
      icon: Sparkles,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      trend: (stats?.pending?.providers || 0) === 0 ? 'up' : 'down',
    },
    {
      label: 'Products',
      value: String(stats?.counts?.products || 0),
      sub: 'Listed',
      icon: Package,
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-600',
      trend: 'up',
    },
  ]

  const commissionGifts = stats?.commission?.gifts || 0
  const commissionBeauty = stats?.commission?.beauty || 0
  const commissionTotal = stats?.commission?.total || 0

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your platform performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STATS.map((stat, i) => (
          <div key={stat.label} className="card p-5 hover:shadow-md transition-shadow duration-200 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-orange-500'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {stat.sub}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4 tracking-tight">{stat.value}</p>
            <p className="text-[13px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Commission Breakdown */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-teal-500/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Commission Earned</h3>
            <p className="text-xs text-gray-500">Breakdown by category</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-5 text-white">
            <p className="text-xs font-medium text-teal-200">Total Commission</p>
            <p className="text-2xl font-bold mt-1.5 tracking-tight">{formatAmount(commissionTotal)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-xs font-medium text-gray-500">Gifts Commission</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight">{formatAmount(commissionGifts)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-xs font-medium text-gray-500">Beauty Commission</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight">{formatAmount(commissionBeauty)}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Revenue Overview</h3>
              <p className="text-xs text-gray-500 mt-0.5">This week's performance</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-gray-500">Gifts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="text-gray-500">Beauty</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="giftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#35615D" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#35615D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="beautyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FD8950" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#FD8950" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20A6${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gifts" stroke="#35615D" fill="url(#giftGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#35615D', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="beauty" stroke="#FD8950" fill="url(#beautyGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#FD8950', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900">Top Categories</h3>
          <p className="text-xs text-gray-500 mt-0.5 mb-6">Orders by category</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl">
                        <span className="font-semibold">{payload[0]?.payload?.name}:</span> {payload[0]?.value} orders
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="orders" radius={[0, 6, 6, 0]} barSize={22}>
                {CATEGORY_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
            <p className="text-xs text-gray-500 mt-0.5">Latest transactions on the platform</p>
          </div>
          <Link to="/orders" className="btn-ghost text-xs text-teal-600 hover:text-teal-700">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Order ID</th>
                <th className="table-header">Type</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">No orders yet</td></tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell font-mono font-medium text-gray-900 text-xs">{order.order_number}</td>
                    <td className="table-cell">
                      <span className={`badge ${order.order_type === 'gift' ? 'badge-teal' : 'badge-orange'}`}>
                        {order.order_type === 'gift' ? 'Gift' : 'Beauty'}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-gray-900">{'\u20A6'}{(order.total || 0).toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[order.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
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
