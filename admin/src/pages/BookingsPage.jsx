import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useGetAdminBookingsQuery } from '../services/api'

const STATUS_STYLES = {
  completed: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
            disabled
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:border-teal-500 outline-none"
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
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto" /></td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No bookings found</td></tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-mono font-medium text-gray-900">{booking.booking_number || `BK-${booking.id}`}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{booking.client_name || booking.user_name || '\u2014'}</div>
                      <div className="text-xs text-gray-400">{booking.client_phone || ''}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{booking.provider_name || booking.business_name || '\u2014'}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-sm text-gray-600">{booking.service_name || booking.service_type || '\u2014'}</div>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{formatPrice(booking.total || booking.price)}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
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
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
            Showing {bookings.length} of {total} bookings
          </span>
          {totalPages > 1 && (
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
                  className={`px-3 py-1 rounded-lg ${page === p ? 'bg-teal-50 text-teal-600 font-medium' : 'hover:bg-gray-100'}`}
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
          )}
        </div>
      </div>
    </div>
  )
}
