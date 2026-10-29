import { useState } from 'react'
import {
  Loader2, ScrollText, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useGetAuditLogQuery } from '../services/api'

const ACTION_META = {
  created: { label: 'Created', badge: 'badge-green' },
  updated: { label: 'Updated', badge: 'badge-blue' },
  password_reset: { label: 'Password reset', badge: 'badge-yellow' },
  deleted: { label: 'Removed', badge: 'badge-gray' },
  bulk_deleted: { label: 'Bulk removed', badge: 'badge-gray' },
  cleared: { label: 'Cleared', badge: 'badge-gray' },
  released: { label: 'Released', badge: 'badge-green' },
  cancelled: { label: 'Cancelled', badge: 'badge-gray' },
  completed: { label: 'Completed', badge: 'badge-green' },
  failed: { label: 'Failed', badge: 'badge-gray' },
  approved: { label: 'Approved', badge: 'badge-green' },
  rejected: { label: 'Rejected', badge: 'badge-gray' },
  suspended: { label: 'Suspended', badge: 'badge-gray' },
  reactivated: { label: 'Reactivated', badge: 'badge-blue' },
}

const ENTITY_META = {
  staff: { label: 'Team', color: 'text-teal-700 bg-teal-50' },
  user: { label: 'User', color: 'text-blue-700 bg-blue-50' },
  product: { label: 'Product', color: 'text-amber-700 bg-amber-50' },
  payout: { label: 'Payout', color: 'text-green-700 bg-green-50' },
  withdrawal: { label: 'Withdrawal', color: 'text-rose-700 bg-rose-50' },
  provider: { label: 'Provider', color: 'text-purple-700 bg-purple-50' },
}

const FILTERS = [
  { value: '', label: 'All activity' },
  { value: 'staff', label: 'Team' },
  { value: 'provider', label: 'Providers' },
  { value: 'payout', label: 'Payouts' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'user', label: 'Users' },
  { value: 'product', label: 'Products' },
]

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}

export default function AuditLogPage() {
  const [entity, setEntity] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useGetAuditLogQuery({ entity: entity || undefined, page, per_page: 40 })

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 40)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit log</h1>
          <p className="text-sm text-gray-500 mt-1">
            A record of sensitive actions: team changes, payouts, withdrawals, and deletions.
          </p>
        </div>
        <select
          value={entity}
          onChange={(e) => { setEntity(e.target.value); setPage(1) }}
          className="select w-fit"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Action</th>
                <th className="table-header">Target</th>
                <th className="table-header">Details</th>
                <th className="table-header">By</th>
                <th className="table-header">When</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                      <span className="text-sm text-gray-400">Loading activity...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <ScrollText className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No activity recorded</p>
                      <p className="text-xs text-gray-400">Sensitive admin actions will appear here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const a = ACTION_META[row.action] || { label: row.action, badge: 'badge-gray' }
                  const e = ENTITY_META[row.entity] || { label: row.entity, color: 'text-gray-600 bg-gray-50' }
                  return (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${e.color}`}>{e.label}</span>
                          <span className={`badge ${a.badge}`}>{a.label}</span>
                        </div>
                      </td>
                      <td className="table-cell text-sm font-medium text-gray-900">{row.target_name || '—'}</td>
                      <td className="table-cell text-sm text-gray-600 max-w-[320px]">{row.details || '—'}</td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-700">{row.actor_name || 'System'}</div>
                        {row.actor_email && <div className="text-xs text-gray-400">{row.actor_email}</div>}
                      </td>
                      <td className="table-cell text-gray-500 text-sm whitespace-nowrap" title={row.created_at ? new Date(row.created_at).toLocaleString() : ''}>
                        {fmtTime(row.created_at)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />}
            {total} {total === 1 ? 'entry' : 'entries'}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
