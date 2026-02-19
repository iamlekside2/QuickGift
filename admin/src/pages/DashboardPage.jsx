import {
  TrendingUp, ShoppingCart, Users, DollarSign,
  Package, Sparkles, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const STATS = [
  { label: 'Total Revenue', value: '₦2.4M', change: '+12.5%', up: true, icon: DollarSign, color: 'bg-green-100 text-green-600' },
  { label: 'Orders Today', value: '48', change: '+8.2%', up: true, icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
  { label: 'Active Users', value: '1,234', change: '+15.3%', up: true, icon: Users, color: 'bg-purple-100 text-purple-600' },
  { label: 'Active Providers', value: '89', change: '-2.1%', up: false, icon: Sparkles, color: 'bg-orange-100 text-orange-600' },
]

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

const RECENT_ORDERS = [
  { id: 'QG-1234', customer: 'Chioma Adebayo', item: 'Red Velvet Cake', amount: '₦15,000', status: 'Delivered', type: 'gift' },
  { id: 'QG-1235', customer: 'Fatima Ibrahim', item: 'Gel Nails (Full Set)', amount: '₦8,000', status: 'Confirmed', type: 'beauty' },
  { id: 'QG-1236', customer: 'Emeka Okonkwo', item: 'Rose Bouquet (24)', amount: '₦25,000', status: 'In Transit', type: 'gift' },
  { id: 'QG-1237', customer: 'Amina Yusuf', item: 'Bridal Makeup', amount: '₦35,000', status: 'Pending', type: 'beauty' },
  { id: 'QG-1238', customer: 'Tunde Bakare', item: 'Birthday Hamper', amount: '₦35,000', status: 'Delivered', type: 'gift' },
]

const STATUS_STYLES = {
  Delivered: 'bg-green-100 text-green-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  'In Transit': 'bg-yellow-100 text-yellow-700',
  Pending: 'bg-gray-100 text-gray-700',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-0.5 text-sm font-medium ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-500">This week's performance</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-gray-500">Gifts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-gray-500">Beauty</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="giftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="beautyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} />
              <Tooltip formatter={(v) => `₦${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="gifts" stroke="#f87171" fill="url(#giftGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="beauty" stroke="#a78bfa" fill="url(#beautyGrad)" strokeWidth={2} />
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
              <Bar dataKey="orders" fill="#f87171" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
          <button className="text-sm text-red-500 font-semibold hover:text-red-600">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-mono font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-700">{order.customer}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-700">{order.item}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${order.type === 'gift' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}`}>
                      {order.type === 'gift' ? '🎁 Gift' : '💅 Beauty'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{order.amount}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
