import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Loader2, AlertTriangle, X } from 'lucide-react'
import { useGetAdminDisputesQuery, useResolveDisputeMutation } from '../services/api'
import { selectCurrentUser } from '../features/authSlice'
import { hasPerm } from '../lib/permissions'
import { errMsg } from '../lib/errors'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'

const PER_PAGE = 20

const STATUS_STYLES = {
  open: 'badge-yellow',
  provider_responded: 'badge-blue',
  resolved_buyer: 'badge-green',
  resolved_provider: 'badge-green',
  closed: 'badge-gray',
}

const STATUS_LABELS = {
  open: 'Open',
  provider_responded: 'Provider Responded',
  resolved_buyer: 'Resolved (Buyer)',
  resolved_provider: 'Resolved (Provider)',
  closed: 'Closed',
}

const REASON_LABELS = {
  not_received: 'Item not received',
  wrong_item: 'Wrong item delivered',
  poor_quality: 'Poor quality',
  unresponsive: 'Provider unresponsive',
}

const FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'provider_responded', label: 'Provider Responded' },
  { value: 'resolved_buyer', label: 'Resolved (Buyer)' },
  { value: 'resolved_provider', label: 'Resolved (Provider)' },
]

// The backend accepts exactly these two values.
const RESOLUTIONS = [
  { value: 'buyer', label: 'Favor Buyer', hint: 'The refund is credited to the buyer’s wallet.' },
  { value: 'provider', label: 'Favor Provider', hint: 'No refund is made.' },
]

const hasAmount = (value) => value !== null && value !== undefined && value !== ''
const formatPrice = (price) => '₦' + (Number(price) || 0).toLocaleString()

/** "Order QG-123" / "Booking BK-45", or a dash when the dispute has neither number. */
const targetLabel = (dispute) => {
  if (dispute.order_number) return `Order ${dispute.order_number}`
  if (dispute.booking_number) return `Booking ${dispute.booking_number}`
  return '—'
}

export default function DisputesPage() {
  const user = useSelector(selectCurrentUser)
  const canManage = hasPerm(user, 'disputes.manage')

  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [resolveModal, setResolveModal] = useState(null)
  const [resolution, setResolution] = useState('buyer')
  const [refundAmount, setRefundAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [formErr, setFormErr] = useState('')

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminDisputesQuery({
    status: statusFilter || undefined,
    page,
    per_page: PER_PAGE,
  })
  const [resolveDispute, { isLoading: isResolving }] = useResolveDisputeMutation()

  const disputes = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  const handleOpenResolve = (dispute) => {
    setResolveModal(dispute)
    setResolution('buyer')
    setRefundAmount('')
    setNotes('')
    setFormErr('')
  }

  const closeResolve = () => {
    if (!isResolving) setResolveModal(null)
  }

  const handleResolve = async () => {
    if (!resolveModal) return
    setFormErr('')

    const payload = { id: resolveModal.id, resolution, notes: notes.trim() }
    // A blank refund means "the full amount", which the server works out itself.
    if (resolution === 'buyer' && refundAmount !== '') {
      const amount = Number(refundAmount)
      if (!Number.isFinite(amount) || amount <= 0) {
        setFormErr('Enter a refund amount greater than zero, or leave it blank to refund the full amount.')
        return
      }
      if (hasAmount(resolveModal.target_amount) && amount > Number(resolveModal.target_amount)) {
        setFormErr(`The refund cannot be more than ${formatPrice(resolveModal.target_amount)}.`)
        return
      }
      payload.refund_amount = amount
    }

    try {
      await resolveDispute(payload).unwrap()
      setResolveModal(null)
    } catch (err) {
      setFormErr(errMsg(err, 'Failed to resolve dispute'))
    }
  }

  const canResolve = (status) => status === 'open' || status === 'provider_responded'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Disputes</h1>
          <p className="text-sm text-gray-500 mt-1">Review and resolve buyer disputes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="select"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Order/Booking</th>
                <th className="table-header">Buyer</th>
                <th className="table-header">Provider</th>
                <th className="table-header">Complaint</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading disputes...</span>
                  </div>
                </td></tr>
              ) : isError ? (
                <ErrorRow colSpan={8} what="disputes" error={error} onRetry={refetch} retrying={isFetching} />
              ) : disputes.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No disputes found</p>
                    <p className="text-xs text-gray-400">Try adjusting your filters</p>
                  </div>
                </td></tr>
              ) : (
                disputes.map((dispute) => (
                  <tr key={dispute.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono text-xs text-gray-900 whitespace-nowrap">{targetLabel(dispute)}</span>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium text-gray-900">{dispute.buyer_name || '—'}</span>
                    </td>
                    <td className="table-cell text-gray-600">{dispute.provider_name || '—'}</td>
                    <td className="table-cell text-sm max-w-[280px]">
                      <div className="text-gray-700">{REASON_LABELS[dispute.reason] || dispute.reason || '—'}</div>
                      {dispute.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate" title={dispute.description}>
                          {dispute.description}
                        </p>
                      )}
                    </td>
                    <td className="table-cell font-semibold text-gray-900 whitespace-nowrap">
                      {hasAmount(dispute.target_amount) ? formatPrice(dispute.target_amount) : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[dispute.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[dispute.status] || dispute.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {dispute.created_at ? new Date(dispute.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-cell">
                      {canManage && canResolve(dispute.status) ? (
                        <button
                          onClick={() => handleOpenResolve(dispute)}
                          className="px-3 py-1.5 text-xs font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">{'—'}</span>
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
          label="total disputes"
          isFetching={isFetching}
        />
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-fade-in">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Resolve Dispute</h3>
              <button
                onClick={closeResolve}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              {formErr && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{formErr}</div>
              )}

              {/* What is being decided */}
              <dl className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Buyer</dt>
                  <dd className="font-medium text-gray-900 text-right">{resolveModal.buyer_name || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Provider</dt>
                  <dd className="font-medium text-gray-900 text-right">{resolveModal.provider_name || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Order/Booking</dt>
                  <dd className="font-mono text-xs text-gray-900 text-right">{targetLabel(resolveModal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Amount</dt>
                  <dd className="font-semibold text-gray-900 text-right">
                    {hasAmount(resolveModal.target_amount) ? formatPrice(resolveModal.target_amount) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Reason</dt>
                  <dd className="text-gray-900 text-right">{REASON_LABELS[resolveModal.reason] || resolveModal.reason || '—'}</dd>
                </div>
                <div className="pt-2 border-t border-gray-200/70">
                  <dt className="text-gray-500 mb-1">Buyer&apos;s description</dt>
                  <dd className="text-gray-800 whitespace-pre-wrap break-words">
                    {resolveModal.description || 'No description given.'}
                  </dd>
                </div>
              </dl>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Resolution</p>
                <div className="space-y-2">
                  {RESOLUTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        resolution === opt.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={opt.value}
                        checked={resolution === opt.value}
                        onChange={(e) => setResolution(e.target.value)}
                        className="accent-teal-500 mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{opt.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {resolution === 'buyer' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Refund amount ({'₦'})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={hasAmount(resolveModal.target_amount) ? `Full amount: ${formatPrice(resolveModal.target_amount)}` : 'Full amount'}
                    className="input"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Leave blank to refund the full amount.</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add resolution notes..."
                  rows={3}
                  className="input resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={closeResolve}
                disabled={isResolving}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isResolving}
                className="px-4 py-2 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isResolving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
