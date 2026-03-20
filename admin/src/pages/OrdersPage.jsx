import { useState } from 'react'
import { Search, Download, ChevronDown, Loader2, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '../services/api'

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

const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_transit', 'cancelled'],
  in_transit: ['delivered'],
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
  const [updateOrderStatus] = useUpdateOrderStatusMutation()

  const orders = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const filtered = orders.filter(o => {
    if (search && !o.order_number?.toLowerCase().includes(search.toLowerCase()) && !o.recipient_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatPrice = (price) => '\u20A6' + (price || 0).toLocaleString()

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({ id: orderId, status: newStatus }).unwrap()
    } catch (err) {
      alert(err?.data?.detail || 'Failed to update status')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all platform orders</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="select"
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
          className="select"
        >
          <option value="">All Types</option>
          <option value="gift">Gifts</option>
          <option value="beauty">Beauty</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Order</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Items</th>
                <th className="table-header">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading orders...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No orders found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-mono font-medium text-gray-900 text-xs">{order.order_number}</div>
                      <div className={`text-[11px] mt-0.5 font-medium ${order.order_type === 'gift' ? 'text-teal-600' : 'text-orange-500'}`}>
                        {order.order_type === 'gift' ? 'Gift' : 'Beauty'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{order.recipient_name || order.user_name || '\u2014'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{order.recipient_phone || ''}</div>
                    </td>
                    <td className="table-cell text-gray-600">
                      {order.items?.length || order.item_count || '\u2014'} item{(order.items?.length || order.item_count || 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="table-cell font-semibold text-gray-900">{formatPrice(order.total)}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[order.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                      {NEXT_STATUS[order.status] ? (
                        <div className="relative inline-block">
                          <select
                            onChange={(e) => { if (e.target.value) handleStatusChange(order.id, e.target.value); e.target.value = '' }}
                            defaultValue=""
                            className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer focus:border-teal-400 outline-none transition-colors"
                          >
                            <option value="" disabled>Update</option>
                            {NEXT_STATUS[order.status].map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">\u2014</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />}
            {total} total orders
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === p
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
