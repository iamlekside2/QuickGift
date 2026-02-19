import { useState } from 'react'
import { Search, Download, MoreHorizontal, MapPin, ShoppingCart } from 'lucide-react'

const USERS = [
  { id: 1, name: 'Chioma Adebayo', email: 'chioma@gmail.com', phone: '+234 801 234 5678', city: 'Lagos', orders: 12, spent: 185000, joined: '2026-01-15', lastActive: '2 hours ago' },
  { id: 2, name: 'Fatima Ibrahim', email: 'fatima.i@yahoo.com', phone: '+234 802 345 6789', city: 'Lagos', orders: 8, spent: 95000, joined: '2026-01-20', lastActive: '1 day ago' },
  { id: 3, name: 'Emeka Okonkwo', email: 'emeka.ok@gmail.com', phone: '+234 803 456 7890', city: 'Abuja', orders: 15, spent: 320000, joined: '2025-12-10', lastActive: '3 hours ago' },
  { id: 4, name: 'Amina Yusuf', email: 'amina.y@hotmail.com', phone: '+234 804 567 8901', city: 'Lagos', orders: 3, spent: 45000, joined: '2026-02-01', lastActive: '5 days ago' },
  { id: 5, name: 'Tunde Bakare', email: 'tunde.b@gmail.com', phone: '+234 805 678 9012', city: 'Lagos', orders: 22, spent: 480000, joined: '2025-11-20', lastActive: '1 hour ago' },
  { id: 6, name: 'Grace Eze', email: 'grace.e@gmail.com', phone: '+234 806 789 0123', city: 'Abuja', orders: 6, spent: 72000, joined: '2026-01-28', lastActive: '12 hours ago' },
  { id: 7, name: 'Daniel Adegoke', email: 'daniel.a@outlook.com', phone: '+234 807 890 1234', city: 'Lagos', orders: 9, spent: 135000, joined: '2025-12-25', lastActive: '30 min ago' },
  { id: 8, name: 'Hauwa Bello', email: 'hauwa.b@gmail.com', phone: '+234 808 901 2345', city: 'Abuja', orders: 1, spent: 15000, joined: '2026-02-10', lastActive: '3 days ago' },
]

export default function UsersPage() {
  const [search, setSearch] = useState('')

  const filtered = USERS.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatPrice = (price) => '₦' + price.toLocaleString()

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{USERS.length}</p>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{USERS.filter(u => u.lastActive.includes('hour') || u.lastActive.includes('min')).length}</p>
          <p className="text-xs text-gray-500">Active Today</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{USERS.filter(u => u.joined.startsWith('2026-02')).length}</p>
          <p className="text-xs text-gray-500">New This Month</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">₦{(USERS.reduce((s, u) => s + u.spent, 0) / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Total Spent</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-red-600">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-400">Joined {user.joined}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="text-sm text-gray-700">{user.email}</div>
                    <div className="text-xs text-gray-400">{user.phone}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {user.city}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{user.orders}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{formatPrice(user.spent)}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">{user.lastActive}</td>
                  <td className="px-6 py-3.5">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
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
