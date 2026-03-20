import { useState } from 'react'
import { Search, Loader2, CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetAdminBookingsQuery } from '../services/api'

const STATUS_STYLES = {
  completed: 'badge-green',
  confirmed: 'badge-blue',
  in_progress: 'badge-yellow',
  pending: 'badge-gray',
  cancelled: 'badge-red',
}

const STATUS_LABELS = {
  completed: 'Completed', confirmed: 'Confirmed', in_progress: 'In Progress',
  pending: 'Pending', cancelled: 'Cancelled',
}

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useGetAdminBookingsQuery({
    status: statusFilter || undefined,
    page,
    per_page: 20,
  })

  const bookings = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const formatPrice = (price) => '\u20A6' + (price || 0).toLocaleString()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Beauty service bookings and appointments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            className="input pl-10"
            disabled
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
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Booking #</th>
                <th className="table-header">Client</th>
                <th className="table-header">Provider</th>
                <th className="table-header">Service</th>
                <th className="table-header">Price</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading bookings...</span>
                  </div>
                </td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <CalendarCheck className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No bookings found</p>
                    <p className="text-xs text-gray-400">Try adjusting your filters</p>
                  </div>
                </td></tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono font-medium text-gray-900 text-xs">{booking.booking_number || `BK-${booking.id}`}</span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{booking.client_name || booking.user_name || '\u2014'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{booking.client_phone || ''}</div>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium text-gray-900">{booking.provider_name || booking.business_name || '\u2014'}</span>
                    </td>
                    <td className="table-cell text-gray-600">{booking.service_name || booking.service_type || '\u2014'}</td>
                    <td className="table-cell font-semibold text-gray-900">{formatPrice(booking.total || booking.price)}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[booking.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {booking.scheduled_at
                        ? new Date(booking.scheduled_at).toLocaleDateString()
                        : booking.created_at
                        ? new Date(booking.created_at).toLocaleDateString()
                        : '\u2014'}
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
            {total} total bookings
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
