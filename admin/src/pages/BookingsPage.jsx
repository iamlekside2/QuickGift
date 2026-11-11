import { useState } from 'react'
import { Loader2, CalendarCheck } from 'lucide-react'
import { useGetAdminBookingsQuery } from '../services/api'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'

const PER_PAGE = 20

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

// The appointment is stored as a date plus a separate "HH:MM" time.
const formatBookingDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
}

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminBookingsQuery({
    status: statusFilter || undefined,
    page,
    per_page: PER_PAGE,
  })

  const bookings = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Beauty service bookings and appointments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
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
                <th className="table-header">Appointment</th>
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
              ) : isError ? (
                <ErrorRow colSpan={7} what="bookings" error={error} onRetry={refetch} retrying={isFetching} />
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
                      <span className="font-medium text-gray-900">{booking.client_name || '—'}</span>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium text-gray-900">{booking.provider_name || '—'}</span>
                    </td>
                    <td className="table-cell text-gray-600">{booking.service_name || booking.service_type || '—'}</td>
                    <td className="table-cell font-semibold text-gray-900">{formatPrice(booking.total || booking.price)}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[booking.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 whitespace-nowrap">
                      <div>{formatBookingDate(booking.booking_date)}</div>
                      {booking.booking_time && (
                        <div className="text-xs text-gray-400 mt-0.5">{booking.booking_time}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          label="total bookings"
          isFetching={isFetching}
        />
      </div>
    </div>
  )
}
