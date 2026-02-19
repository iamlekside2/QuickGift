import { useState } from 'react'
import { Search, Filter, Download, Eye, MoreHorizontal } from 'lucide-react'

const ORDERS = [
  { id: 'QG-1234', customer: 'Chioma Adebayo', phone: '+234 801 234 5678', item: 'Red Velvet Cake', vendor: 'Sweet Treats Lagos', amount: 15000, status: 'delivered', type: 'gift', date: '2026-02-19', city: 'Lagos' },
  { id: 'QG-1235', customer: 'Fatima Ibrahim', phone: '+234 802 345 6789', item: 'Gel Nails (Full Set)', vendor: 'Amara Nails', amount: 8000, status: 'confirmed', type: 'beauty', date: '2026-02-19', city: 'Lagos' },
  { id: 'QG-1236', customer: 'Emeka Okonkwo', phone: '+234 803 456 7890', item: 'Rose Bouquet (24 stems)', vendor: 'Bloom Nigeria', amount: 25000, status: 'in_transit', type: 'gift', date: '2026-02-18', city: 'Abuja' },
  { id: 'QG-1237', customer: 'Amina Yusuf', phone: '+234 804 567 8901', item: 'Bridal Makeup', vendor: 'Tolu MUA', amount: 35000, status: 'pending', type: 'beauty', date: '2026-02-18', city: 'Lagos' },
  { id: 'QG-1238', customer: 'Tunde Bakare', phone: '+234 805 678 9012', item: 'Birthday Hamper Deluxe', vendor: 'GiftBox NG', amount: 35000, status: 'delivered', type: 'gift', date: '2026-02-17', city: 'Lagos' },
  { id: 'QG-1239', customer: 'Grace Eze', phone: '+234 806 789 0123', item: 'Hair Styling (Braids)', vendor: 'Bimpe Hair Studio', amount: 12000, status: 'confirmed', type: 'beauty', date: '2026-02-17', city: 'Abuja' },
  { id: 'QG-1240', customer: 'Daniel Adegoke', phone: '+234 807 890 1234', item: 'Chocolate Gift Box', vendor: 'ChocoLux', amount: 12000, status: 'delivered', type: 'gift', date: '2026-02-16', city: 'Lagos' },
  { id: 'QG-1241', customer: 'Hauwa Bello', phone: '+234 808 901 2345', item: 'Manicure & Pedicure', vendor: 'Amara Nails', amount: 5000, status: 'cancelled', type: 'beauty', date: '2026-02-16', city: 'Abuja' },
]

const STATUS_STYLES = {
  delivered: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS = {
  delivered: 'Delivered',
  confirmed: 'Confirmed',
  in_transit: 'In Transit',
  pending: 'Pending',
  cancelled: 'Cancelled',
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = ORDERS.filter(o => {
    if (search && !o.customer.toLowerCase().includes(search.toLowerCase()) && !o.id.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (typeFilter !== 'all' && o.type !== typeFilter) return false
    return true
  })

  const formatPrice = (price) => '₦' + price.toLocaleString()

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:border-red-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:border-red-500 outline-none"
        >
          <option value="all">All Types</option>
          <option value="gift">Gifts</option>
          <option value="beauty">Beauty</option>
        </select>
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="text-sm font-mono font-medium text-gray-900">{order.id}</div>
                    <div className="text-xs text-gray-400">{order.type === 'gift' ? '🎁 Gift' : '💅 Beauty'}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                    <div className="text-xs text-gray-400">{order.city}</div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-700">{order.item}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">{order.vendor}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{formatPrice(order.amount)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">{order.date}</td>
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
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {ORDERS.length} orders</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded-lg hover:bg-gray-100">Previous</button>
            <button className="px-3 py-1 rounded-lg bg-red-50 text-red-600 font-medium">1</button>
            <button className="px-3 py-1 rounded-lg hover:bg-gray-100">2</button>
            <button className="px-3 py-1 rounded-lg hover:bg-gray-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
