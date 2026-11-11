import { useState } from 'react'
import { Search, Download, Loader2, Gift } from 'lucide-react'
import { useGetAdminReferralsQuery } from '../services/api'
import { downloadCsv, csvDate } from '../lib/csv'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'

const PER_PAGE = 20

// pending  = friend signed up, no qualifying delivered order yet
// rewarded = both wallets were credited
// capped   = the referrer had already reached the per-person limit
const STATUS = {
  pending: { label: 'Awaiting first order', badge: 'badge-yellow' },
  rewarded: { label: 'Rewarded', badge: 'badge-green' },
  capped: { label: 'Over limit', badge: 'badge-gray' },
}

const naira = (n) => '₦' + (Number(n) || 0).toLocaleString()
const date = (d) => (d ? new Date(d).toLocaleDateString() : '—')

export default function ReferralsPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const search = useDebouncedSearch(() => setPage(1))

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminReferralsQuery({
    status: status || undefined,
    search: search.query || undefined,
    page,
    per_page: PER_PAGE,
  })

  const rows = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  const handleExport = () => {
    if (!rows.length) return
    downloadCsv(
      'quickgift-referrals',
      ['Referrer', 'Referrer phone', 'Friend', 'Friend phone', 'Code', 'Status', 'Reward each', 'Joined', 'Rewarded'],
      rows.map((r) => [
        r.referrer_name, r.referrer_phone, r.friend_name, r.friend_phone, r.code,
        STATUS[r.status]?.label || r.status, Number(r.reward_amount) || 0,
        csvDate(r.created_at), r.rewarded_at ? csvDate(r.rewarded_at) : '',
      ]),
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Referrals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Who invited whom. Both people are paid when the friend's first qualifying order is delivered.
          </p>
        </div>
        <button
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExport}
          disabled={!rows.length}
          title="Downloads the rows on this page as a CSV file"
        >
          <Download className="w-4 h-4" />
          Export page
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone or code..."
            value={search.input}
            onChange={(e) => search.onChange(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="select"
        >
          <option value="">All statuses</option>
          <option value="pending">Awaiting first order</option>
          <option value="rewarded">Rewarded</option>
          <option value="capped">Over limit</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Referrer</th>
                <th className="table-header">Friend who joined</th>
                <th className="table-header">Code</th>
                <th className="table-header">Status</th>
                <th className="table-header">Reward (each)</th>
                <th className="table-header">Joined</th>
                <th className="table-header">Rewarded</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading referrals...</span>
                  </div>
                </td></tr>
              ) : isError ? (
                <ErrorRow colSpan={7} what="referrals" error={error} onRetry={refetch} retrying={isFetching} />
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No referrals found</p>
                    <p className="text-xs text-gray-400">
                      {status || search.query
                        ? 'Try adjusting your search or filters'
                        : 'They show up here when someone signs up with a friend\'s code'}
                    </p>
                  </div>
                </td></tr>
              ) : (
                rows.map((r) => {
                  const s = STATUS[r.status] || { label: r.status, badge: 'badge-gray' }
                  return (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-gray-900">{r.referrer_name || '—'}</p>
                        <p className="text-xs text-gray-500">{r.referrer_phone || ''}</p>
                      </td>
                      <td className="table-cell">
                        <p className="font-medium text-gray-900">{r.friend_name || '—'}</p>
                        <p className="text-xs text-gray-500">{r.friend_phone || ''}</p>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-xs text-gray-600">{r.code}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${s.badge}`}>{s.label}</span>
                      </td>
                      <td className="table-cell text-gray-700">
                        {r.status === 'rewarded' ? naira(r.reward_amount) : '—'}
                      </td>
                      <td className="table-cell text-gray-500 text-sm">{date(r.created_at)}</td>
                      <td className="table-cell text-gray-500 text-sm">{date(r.rewarded_at)}</td>
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
          label="total referrals"
          isFetching={isFetching}
        />
      </div>
    </div>
  )
}
