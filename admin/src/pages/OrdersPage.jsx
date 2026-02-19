import { useState } from 'react'
import { Search, Download, MoreHorizontal, Loader2 } from 'lucide-react'
import { useGetAdminOrdersQuery } from '../services/api'

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

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useGetAdminOrdersQuery({
    status: statusFilter || undefined,
    order_type: typeFilter || undefined,
    page,
    per_page: 20,
  })

  const orders = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  // Client-side search filter (server handles status/type)
  const filtered = orders.filter(o => {
    if (search && !o.order_number?.toLowerCase().includes(search.toLowerCase()) && !o.recipient_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString()

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:border-red-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:border-red-500 outline-none"
        >
          <option value="">All Types</option>
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">No orders found</td></tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-mono font-medium text-gray-900">{order.order_number}</div>
                      <div className="text-xs text-gray-400">{order.order_type === 'gift' ? '🎁 Gift' : '💅 Beauty'}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{order.recipient_name || '—'}</div>
                      <div className="text-xs text-gray-400">{order.recipient_phone || ''}</div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{order.delivery_city || '—'}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{formatPrice(order.total)}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
            Showing {filtered.length} of {total} orders
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg ${page === p ? 'bg-red-50 text-red-600 font-medium' : 'hover:bg-gray-100'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
