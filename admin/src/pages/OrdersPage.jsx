import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Search, Download, ChevronDown, Loader2, ShoppingCart } from 'lucide-react'
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '../services/api'
import { selectCurrentUser } from '../features/authSlice'
import { hasPerm } from '../lib/permissions'
import { errMsg } from '../lib/errors'
import { downloadCsv, csvDate } from '../lib/csv'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'

const PER_PAGE = 20

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

// Both of these are final and notify the customer, so they are confirmed first.
const CONFIRM_BEFORE = {
  cancelled: (order) => `Cancel order ${order.order_number}? This cannot be undone and the customer will be notified.`,
  delivered: (order) => `Mark order ${order.order_number} as delivered? This cannot be undone and the customer will be notified.`,
}

const itemCount = (order) => order.item_count ?? order.items?.length ?? null

export default function OrdersPage() {
  const user = useSelector(selectCurrentUser)
  const canManage = hasPerm(user, 'orders.manage')

  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)
  const search = useDebouncedSearch(() => setPage(1))

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminOrdersQuery({
    status: statusFilter || undefined,
    order_type: typeFilter || undefined,
    search: search.query || undefined,
    page,
    per_page: PER_PAGE,
  })
  const [updateOrderStatus] = useUpdateOrderStatusMutation()

  const orders = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString()

  const handleStatusChange = async (order, newStatus) => {
    const confirmText = CONFIRM_BEFORE[newStatus]
    if (confirmText && !window.confirm(confirmText(order))) return
    setBusyId(order.id)
    try {
      await updateOrderStatus({ id: order.id, status: newStatus }).unwrap()
    } catch (err) {
      alert(errMsg(err, 'Failed to update status'))
    } finally {
      setBusyId(null)
    }
  }

  const handleExport = () => {
    if (!orders.length) return
    downloadCsv(
      'quickgift-orders',
      ['Order', 'Type', 'Customer', 'Recipient', 'Recipient phone', 'Items', 'Total', 'Status', 'Date'],
      orders.map((o) => [
        o.order_number, o.order_type, o.customer_name, o.recipient_name, o.recipient_phone,
        itemCount(o) ?? '', Number(o.total) || 0, o.status, csvDate(o.created_at),
      ]),
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all platform orders</p>
        </div>
        <button
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExport}
          disabled={!orders.length}
          title="Downloads the rows on this page as a CSV file"
        >
          <Download className="w-4 h-4" />
          Export page
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search.input}
            onChange={(e) => search.onChange(e.target.value)}
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
              ) : isError ? (
                <ErrorRow colSpan={7} what="orders" error={error} onRetry={refetch} retrying={isFetching} />
              ) : orders.length === 0 ? (
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
                orders.map((order) => {
                  const count = itemCount(order)
                  const rowBusy = busyId === order.id
                  // The buyer; the person the gift is going to is shown underneath.
                  const recipientLine = [
                    order.customer_name && order.recipient_name ? `For ${order.recipient_name}` : '',
                    order.recipient_phone || '',
                  ].filter(Boolean).join(' · ')
                  // A scheduled day is a plain calendar day: read it from the
                  // string so the browser's time zone cannot move it.
                  const day = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(order.scheduled_date || ''))
                  const giftNotes = [
                    day ? `Deliver on ${new Date(+day[1], +day[2] - 1, +day[3]).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : '',
                    order.is_anonymous ? 'Anonymous gift' : '',
                  ].filter(Boolean).join(' · ')
                  return (
                    <tr key={order.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-mono font-medium text-gray-900 text-xs">{order.order_number}</div>
                        <div className={`text-[11px] mt-0.5 font-medium ${order.order_type === 'gift' ? 'text-teal-600' : 'text-orange-500'}`}>
                          {order.order_type === 'gift' ? 'Gift' : 'Beauty'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{order.customer_name || order.recipient_name || '—'}</div>
                        {recipientLine && <div className="text-xs text-gray-400 mt-0.5">{recipientLine}</div>}
                        {giftNotes && <div className="text-[11px] text-amber-600 font-medium mt-0.5">{giftNotes}</div>}
                      </td>
                      <td className="table-cell text-gray-600">
                        {count === null ? '—' : `${count} item${count === 1 ? '' : 's'}`}
                      </td>
                      <td className="table-cell font-semibold text-gray-900">{formatPrice(order.total)}</td>
                      <td className="table-cell">
                        <span className={`badge ${STATUS_STYLES[order.status] || 'badge-gray'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="table-cell">
                        {canManage && NEXT_STATUS[order.status] ? (
                          <div className="relative inline-block">
                            <select
                              value=""
                              disabled={rowBusy}
                              onChange={(e) => { if (e.target.value) handleStatusChange(order, e.target.value) }}
                              className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer focus:border-teal-400 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="" disabled>{rowBusy ? 'Saving...' : 'Update'}</option>
                              {NEXT_STATUS[order.status].map(s => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                            {rowBusy ? (
                              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-teal-500 animate-spin pointer-events-none" />
                            ) : (
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">{'—'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          label="total orders"
          isFetching={isFetching}
        />
      </div>
    </div>
  )
}
