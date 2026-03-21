import { useState } from 'react'
import { Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useGetAdminDisputesQuery, useResolveDisputeMutation } from '../services/api'

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
  { value: 'resolved_buyer', label: 'Resolved' },
]

export default function DisputesPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [resolveModal, setResolveModal] = useState(null)
  const [resolution, setResolution] = useState('favor_buyer')
  const [notes, setNotes] = useState('')

  const { data, isLoading, isFetching } = useGetAdminDisputesQuery({
    status: statusFilter || undefined,
    page,
    per_page: 20,
  })
  const [resolveDispute, { isLoading: isResolving }] = useResolveDisputeMutation()

  const disputes = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const truncateId = (id) => {
    if (!id) return '\u2014'
    const str = String(id)
    return str.length > 8 ? str.slice(0, 8) + '...' : str
  }

  const handleOpenResolve = (dispute) => {
    setResolveModal(dispute)
    setResolution('favor_buyer')
    setNotes('')
  }

  const handleResolve = async () => {
    if (!resolveModal) return
    try {
      await resolveDispute({
        id: resolveModal.id,
        resolution,
        notes: notes.trim(),
      }).unwrap()
      setResolveModal(null)
    } catch (err) {
      alert(err?.data?.detail || 'Failed to resolve dispute')
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
                <th className="table-header">ID</th>
                <th className="table-header">Buyer</th>
                <th className="table-header">Reason</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading disputes...</span>
                  </div>
                </td></tr>
              ) : disputes.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center">
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
                      <span className="font-mono text-xs text-gray-900">{truncateId(dispute.id)}</span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{dispute.buyer_name || '\u2014'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{dispute.buyer_phone || dispute.buyer_email || ''}</div>
                    </td>
                    <td className="table-cell text-gray-600 text-sm">
                      {REASON_LABELS[dispute.reason] || dispute.reason || '\u2014'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[dispute.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[dispute.status] || dispute.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {dispute.created_at ? new Date(dispute.created_at).toLocaleDateString() : '\u2014'}
                    </td>
                    <td className="table-cell">
                      {canResolve(dispute.status) ? (
                        <button
                          onClick={() => handleOpenResolve(dispute)}
                          className="px-3 py-1.5 text-xs font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                        >
                          Resolve
                        </button>
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
            {total} total disputes
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

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Resolve Dispute</h3>
              <button
                onClick={() => setResolveModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Resolution</p>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    resolution === 'favor_buyer' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="resolution"
                      value="favor_buyer"
                      checked={resolution === 'favor_buyer'}
                      onChange={(e) => setResolution(e.target.value)}
                      className="accent-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-900">Favor Buyer</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    resolution === 'favor_provider' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="resolution"
                      value="favor_provider"
                      checked={resolution === 'favor_provider'}
                      onChange={(e) => setResolution(e.target.value)}
                      className="accent-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-900">Favor Provider</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add resolution notes..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none resize-none transition-colors"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setResolveModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
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
