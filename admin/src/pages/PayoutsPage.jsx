import { useState } from 'react'
import { Search, Download, Loader2, Banknote, ChevronLeft, ChevronRight, Check, X, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { useGetAdminPayoutsQuery, useGetPayoutStatsQuery, useReleasePayoutMutation, useCancelPayoutMutation } from '../services/api'

const STATUS_STYLES = {
  held: 'badge-yellow',
  released: 'badge-blue',
  paid: 'badge-green',
  cancelled: 'badge-red',
  pending: 'badge-gray',
}

export default function PayoutsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useGetAdminPayoutsQuery({
    status: statusFilter || undefined,
    page,
    per_page: 20,
  })
  const { data: stats } = useGetPayoutStatsQuery()
  const [releasePayout] = useReleasePayoutMutation()
  const [cancelPayout] = useCancelPayoutMutation()

  const payouts = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const filtered = payouts.filter(p => {
    if (search && !p.provider_id?.toLowerCase().includes(search.toLowerCase()) && !p.order_id?.toLowerCase().includes(search.toLowerCase()) && !p.booking_id?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatPrice = (price) => '\u20A6' + (price || 0).toLocaleString()

  const handleRelease = async (id) => {
    if (!confirm('Release this payout to the provider\'s wallet?')) return
    try {
      await releasePayout(id).unwrap()
    } catch (err) {
      alert(err?.data?.detail || 'Failed to release payout')
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this payout? This cannot be undone.')) return
    try {
      await cancelPayout(id).unwrap()
    } catch (err) {
      alert(err?.data?.detail || 'Failed to cancel payout')
    }
  }

  const statCards = [
    { label: 'Held', value: formatPrice(stats?.held), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Ready to Pay', value: formatPrice(stats?.released), icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Paid', value: formatPrice(stats?.paid), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Commission Earned', value: formatPrice(stats?.total_commission), icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage provider payouts and commission earnings</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by provider or order..."
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
          <option value="held">Held</option>
          <option value="released">Released</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Provider</th>
                <th className="table-header">Order/Booking</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Commission</th>
                <th className="table-header">Status</th>
                <th className="table-header">Hold Until</th>
                <th className="table-header w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading payouts...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No payouts found</p>
                    <p className="text-xs text-gray-400">Payouts appear after orders are paid</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((payout) => (
                  <tr key={payout.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-medium text-gray-900 text-sm">{payout.provider_id?.substring(0, 8)}...</span>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-gray-600">
                        {payout.order_id ? `Order: ${payout.order_id.substring(0, 8)}...` : ''}
                        {payout.booking_id ? `Booking: ${payout.booking_id.substring(0, 8)}...` : ''}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-emerald-600">{formatPrice(payout.amount)}</td>
                    <td className="table-cell text-gray-600">{formatPrice(payout.commission)}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[payout.status] || 'badge-gray'}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 text-sm">
                      {payout.hold_until ? new Date(payout.hold_until).toLocaleString() : '\u2014'}
                    </td>
                    <td className="table-cell">
                      {(payout.status === 'held' || payout.status === 'released') ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRelease(payout.id)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Release payout"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(payout.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Cancel payout"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : payout.status === 'paid' ? (
                        <span className="text-xs text-gray-400">
                          {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : 'Paid'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">{'\u2014'}</span>
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
            {total} total payouts
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
