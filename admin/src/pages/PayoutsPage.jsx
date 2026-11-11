import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Search, Download, Loader2, Banknote, Check, X, Clock, DollarSign, TrendingUp, ArrowUpFromLine } from 'lucide-react'
import {
  useGetAdminPayoutsQuery,
  useGetPayoutStatsQuery,
  useReleasePayoutMutation,
  useCancelPayoutMutation,
  useGetWithdrawalsQuery,
  useCompleteWithdrawalMutation,
  useFailWithdrawalMutation,
} from '../services/api'
import { selectCurrentUser } from '../features/authSlice'
import { hasPerm } from '../lib/permissions'
import { errMsg } from '../lib/errors'
import { downloadCsv, csvDate } from '../lib/csv'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'

const PER_PAGE = 20

// A payout is held, then either paid (released to the provider) or cancelled.
const PAYOUT_STATUS_STYLES = {
  held: 'badge-yellow',
  paid: 'badge-green',
  cancelled: 'badge-red',
}
const PAYOUT_STATUS_LABELS = {
  held: 'Held',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

const WITHDRAWAL_STATUS_STYLES = {
  pending: 'badge-yellow',
  completed: 'badge-green',
  failed: 'badge-red',
}
const WITHDRAWAL_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
}

const formatPrice = (price) => '₦' + (Number(price) || 0).toLocaleString()

const shortId = (id) => {
  const text = String(id || '')
  return text.length > 8 ? `${text.slice(0, 8)}...` : text
}

export default function PayoutsPage() {
  const user = useSelector(selectCurrentUser)
  const canManage = hasPerm(user, 'finance.manage')
  const [tab, setTab] = useState('payouts')
  const { data: stats } = useGetPayoutStatsQuery()

  const statCards = [
    { label: 'Held', value: formatPrice(stats?.held), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Paid', value: formatPrice(stats?.paid), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Commission Earned', value: formatPrice(stats?.total_commission), icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
  ]

  const tabClass = (name) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === name ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payouts</h1>
        <p className="text-sm text-gray-500 mt-1">Provider payouts, wallet withdrawals and commission earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button onClick={() => setTab('payouts')} className={tabClass('payouts')}>Payouts</button>
        <button onClick={() => setTab('withdrawals')} className={tabClass('withdrawals')}>Withdrawals</button>
      </div>

      {tab === 'payouts' ? <PayoutsTab canManage={canManage} /> : <WithdrawalsTab canManage={canManage} />}
    </div>
  )
}

function PayoutsTab({ canManage }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)
  const search = useDebouncedSearch(() => setPage(1))

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminPayoutsQuery({
    status: statusFilter || undefined,
    search: search.query || undefined,
    page,
    per_page: PER_PAGE,
  })
  const [releasePayout] = useReleasePayoutMutation()
  const [cancelPayout] = useCancelPayoutMutation()

  const payouts = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  const providerLabel = (payout) => payout.provider_name || 'this provider'

  const handleRelease = async (payout) => {
    if (!window.confirm(`Release ${formatPrice(payout.amount)} to ${providerLabel(payout)}? It is credited to their wallet straight away.`)) return
    setBusyId(payout.id)
    try {
      await releasePayout(payout.id).unwrap()
    } catch (err) {
      alert(errMsg(err, 'Failed to release payout'))
    } finally {
      setBusyId(null)
    }
  }

  const handleCancel = async (payout) => {
    if (!window.confirm(`Cancel the ${formatPrice(payout.amount)} payout to ${providerLabel(payout)}? They will not be paid and this cannot be undone.`)) return
    setBusyId(payout.id)
    try {
      await cancelPayout(payout.id).unwrap()
    } catch (err) {
      alert(errMsg(err, 'Failed to cancel payout'))
    } finally {
      setBusyId(null)
    }
  }

  const handleExport = () => {
    if (!payouts.length) return
    downloadCsv(
      'quickgift-payouts',
      ['Provider', 'Order ID', 'Booking ID', 'Amount', 'Commission', 'Status', 'Hold until', 'Paid at'],
      payouts.map((p) => [
        p.provider_name, p.order_number || p.order_id, p.booking_number || p.booking_id,
        Number(p.amount) || 0, Number(p.commission) || 0, p.status,
        csvDate(p.hold_until), csvDate(p.paid_at),
      ]),
    )
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search payouts..."
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
          <option value="held">Held</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExport}
          disabled={!payouts.length}
          title="Downloads the rows on this page as a CSV file"
        >
          <Download className="w-4 h-4" />
          Export page
        </button>
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
              ) : isError ? (
                <ErrorRow colSpan={7} what="payouts" error={error} onRetry={refetch} retrying={isFetching} />
              ) : payouts.length === 0 ? (
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
                payouts.map((payout) => {
                  const rowBusy = busyId === payout.id
                  return (
                    <tr key={payout.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-medium text-gray-900 text-sm">{payout.provider_name || '—'}</span>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-xs text-gray-600">
                          {payout.order_id ? `Order: ${payout.order_number || shortId(payout.order_id)}` : ''}
                          {payout.booking_id ? `Booking: ${payout.booking_number || shortId(payout.booking_id)}` : ''}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-emerald-600">{formatPrice(payout.amount)}</td>
                      <td className="table-cell text-gray-600">{formatPrice(payout.commission)}</td>
                      <td className="table-cell">
                        <span className={`badge ${PAYOUT_STATUS_STYLES[payout.status] || 'badge-gray'}`}>
                          {PAYOUT_STATUS_LABELS[payout.status] || payout.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500 text-sm">
                        {payout.hold_until ? new Date(payout.hold_until).toLocaleString() : '—'}
                      </td>
                      <td className="table-cell">
                        {payout.status === 'held' && canManage ? (
                          rowBusy ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                              <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                              Working...
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRelease(payout)}
                                disabled={busyId !== null}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Release payout"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(payout)}
                                disabled={busyId !== null}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Cancel payout"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        ) : payout.status === 'paid' ? (
                          <span className="text-xs text-gray-400">
                            {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : 'Paid'}
                          </span>
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
          label="total payouts"
          isFetching={isFetching}
        />
      </div>
    </>
  )
}

function WithdrawalsTab({ canManage }) {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)

  const { data, isLoading, isFetching, isError, error, refetch } = useGetWithdrawalsQuery({
    status: statusFilter || undefined,
    page,
    per_page: PER_PAGE,
  })
  const [completeWithdrawal] = useCompleteWithdrawalMutation()
  const [failWithdrawal] = useFailWithdrawalMutation()

  const withdrawals = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  const userLabel = (w) => w.user_name || w.user_phone || 'this user'

  const run = async (withdrawal, action, confirmText, fallback) => {
    if (!window.confirm(confirmText)) return
    setBusyId(withdrawal.id)
    try {
      await action(withdrawal.id).unwrap()
    } catch (err) {
      alert(errMsg(err, fallback))
    } finally {
      setBusyId(null)
    }
  }

  const handleComplete = (w) => run(
    w,
    completeWithdrawal,
    `Mark the ${formatPrice(w.amount)} withdrawal for ${userLabel(w)} as completed? Only do this once the money has been sent to them.`,
    'Failed to complete withdrawal',
  )

  const handleFail = (w) => run(
    w,
    failWithdrawal,
    `Mark the ${formatPrice(w.amount)} withdrawal for ${userLabel(w)} as failed? ${formatPrice(w.amount)} will be refunded to their wallet.`,
    'Failed to mark withdrawal as failed',
  )

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">User</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Description</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading withdrawals...</span>
                  </div>
                </td></tr>
              ) : isError ? (
                <ErrorRow colSpan={6} what="withdrawals" error={error} onRetry={refetch} retrying={isFetching} />
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <ArrowUpFromLine className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No withdrawals found</p>
                    <p className="text-xs text-gray-400">
                      {statusFilter === 'pending' ? 'Nothing is waiting to be processed' : 'Try a different status'}
                    </p>
                  </div>
                </td></tr>
              ) : (
                withdrawals.map((w) => {
                  const rowBusy = busyId === w.id
                  return (
                    <tr key={w.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{w.user_name || '—'}</div>
                        {w.user_phone && <div className="text-xs text-gray-400 mt-0.5">{w.user_phone}</div>}
                      </td>
                      <td className="table-cell font-semibold text-gray-900">{formatPrice(w.amount)}</td>
                      <td className="table-cell text-sm text-gray-600 max-w-[320px]">
                        <div>{w.description || '—'}</div>
                        {w.reference && <div className="font-mono text-xs text-gray-400 mt-0.5">{w.reference}</div>}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${WITHDRAWAL_STATUS_STYLES[w.status] || 'badge-gray'}`}>
                          {WITHDRAWAL_STATUS_LABELS[w.status] || w.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500 text-sm whitespace-nowrap">
                        {w.created_at ? new Date(w.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="table-cell">
                        {w.status === 'pending' && canManage ? (
                          rowBusy ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                              <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                              Working...
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleComplete(w)}
                                disabled={busyId !== null}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Complete
                              </button>
                              <button
                                onClick={() => handleFail(w)}
                                disabled={busyId !== null}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <X className="w-3.5 h-3.5" />
                                Fail
                              </button>
                            </div>
                          )
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
          label="total withdrawals"
          isFetching={isFetching}
        />
      </div>
    </>
  )
}
