import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Search, Loader2, Users, X, AlertTriangle } from 'lucide-react'
import {
  useGetPoolsQuery, useGetPoolQuery, useCancelPoolMutation, useRetryPoolRefundMutation,
} from '../services/api'
import { selectCurrentUser } from '../features/authSlice'
import { hasPerm } from '../lib/permissions'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import Pagination from '../components/Pagination'
import { ErrorRow, QueryError } from '../components/QueryError'
import { errMsg } from '../lib/errors'

const PER_PAGE = 20

const naira = (n) => '₦' + (Number(n) || 0).toLocaleString()
const date = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

const STATUS = {
  open: { label: 'Collecting', badge: 'badge-blue' },
  funding: { label: 'Paying order', badge: 'badge-yellow' },
  funded: { label: 'Fully paid', badge: 'badge-green' },
  expired: { label: 'Expired, refunded', badge: 'badge-gray' },
  cancelled: { label: 'Cancelled, refunded', badge: 'badge-gray' },
}

// How a contribution's refund stands.
const refundLabel = (c) => {
  if (c.refund_state === 'done') {
    return { text: `${naira(c.refund_sent)} refunded`, badge: 'badge-gray' }
  }
  if (c.refund_state === 'failed') return { text: `Refund of ${naira(c.refund_amount - c.refund_sent)} failed`, badge: 'badge-red' }
  if (c.refund_state === 'due' || c.refund_state === 'processing') {
    return { text: `Refunding ${naira(c.refund_amount - c.refund_sent)}`, badge: 'badge-yellow' }
  }
  return null
}

export default function GroupGiftsPage() {
  const me = useSelector(selectCurrentUser)
  const canManage = hasPerm(me, 'finance.manage')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState(null)
  const search = useDebouncedSearch(() => setPage(1))

  const { data, isLoading, isFetching, isError, error, refetch } = useGetPoolsQuery({
    status: status || undefined, search: search.query || undefined, page, per_page: PER_PAGE,
  })
  const rows = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Group gifts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gifts that several people pay for by card. Refunds go back to each person's card, never to a wallet.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, link code, organiser or order number..."
            value={search.input}
            onChange={(e) => search.onChange(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="select">
          <option value="">All statuses</option>
          <option value="open">Collecting</option>
          <option value="funded">Fully paid</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Group gift</th>
                <th className="table-header">Organiser</th>
                <th className="table-header">Raised</th>
                <th className="table-header">People</th>
                <th className="table-header">Closes</th>
                <th className="table-header">Status</th>
                <th className="table-header w-[90px]">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading group gifts...</span>
                  </div>
                </td></tr>
              ) : isError ? (
                <ErrorRow colSpan={7} what="group gifts" error={error} onRetry={refetch} retrying={isFetching} />
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No group gifts found</p>
                    <p className="text-xs text-gray-400">
                      {status || search.query ? 'Try adjusting your search or filters' : 'They show up here when a customer starts one'}
                    </p>
                  </div>
                </td></tr>
              ) : (
                rows.map((p) => {
                  const s = STATUS[p.status] || { label: p.status, badge: 'badge-gray' }
                  return (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{p.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono">
                          {p.code}{p.order_number ? ` · ${p.order_number}` : ''}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900">{p.organiser_name || '—'}</div>
                        <div className="text-xs text-gray-400">{p.organiser_phone || ''}</div>
                      </td>
                      <td className="table-cell text-gray-700 text-sm">{naira(p.raised)} of {naira(p.target)}</td>
                      <td className="table-cell text-gray-700 text-sm">{p.contributors}</td>
                      <td className="table-cell text-gray-500 text-sm">{date(p.deadline)}</td>
                      <td className="table-cell">
                        <span className={`badge ${s.badge}`}>{s.label}</span>
                        {p.refunds_failed > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-red-600 font-medium mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            {p.refunds_failed} refund{p.refunds_failed === 1 ? '' : 's'} failed
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <button className="text-xs font-semibold text-teal-600 hover:text-teal-700" onClick={() => setOpenId(p.id)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} label="group gifts" isFetching={isFetching} />
      </div>

      {openId && <PoolModal id={openId} canManage={canManage} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function PoolModal({ id, canManage, onClose }) {
  const { data: pool, isLoading, isFetching, isError, error, refetch } = useGetPoolQuery(id)
  const [cancelPool, { isLoading: cancelling }] = useCancelPoolMutation()
  const [retryRefund] = useRetryPoolRefundMutation()
  const [busyId, setBusyId] = useState(null)
  const [actionErr, setActionErr] = useState('')

  const s = pool ? (STATUS[pool.status] || { label: pool.status, badge: 'badge-gray' }) : null
  const cancellable = pool && ['open', 'funding', 'funded'].includes(pool.status)

  const handleCancel = async () => {
    const paid = (pool.contributions || []).filter((c) => c.status === 'paid').length
    const warn = pool.status === 'funded'
      ? `Cancel "${pool.title}"? Its order will be cancelled and all ${paid} contributor(s) refunded to their cards. This cannot be undone.`
      : `Cancel "${pool.title}"? ${paid} contributor(s) will be refunded to their cards. This cannot be undone.`
    if (!window.confirm(warn)) return
    setActionErr('')
    try {
      await cancelPool(id).unwrap()
    } catch (e) {
      setActionErr(errMsg(e, 'Could not cancel this group gift'))
    }
  }

  const handleRetry = async (c) => {
    setBusyId(c.id)
    setActionErr('')
    try {
      await retryRefund(c.id).unwrap()
    } catch (e) {
      setActionErr(errMsg(e, 'Could not retry this refund'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{pool?.title || 'Group gift'}</h3>
            {pool && (
              <p className="text-sm text-gray-500 mt-0.5">
                Started by {pool.organiser_name || 'a customer'} · link code {pool.code}
                {pool.order_number ? ` · order ${pool.order_number}` : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>
          ) : isError ? (
            <QueryError what="this group gift" error={error} onRetry={refetch} retrying={isFetching} />
          ) : (
            <>
              {actionErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{actionErr}</div>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Status" value={<span className={`badge ${s.badge}`}>{s.label}</span>} />
                <Stat label="Raised" value={naira(pool.raised)} />
                <Stat label="Target" value={naira(pool.target)} />
                <Stat label="Closes" value={date(pool.deadline)} />
              </div>

              <div>
                <h4 className="text-[13px] font-semibold text-gray-700 mb-2">Contributions</h4>
                {pool.contributions.length === 0 ? (
                  <p className="text-sm text-gray-400">Nobody has paid in yet.</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    {pool.contributions.map((c) => {
                      const r = refundLabel(c)
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                            <p className="text-xs text-gray-400 truncate">{c.email} · {c.reference}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {c.status === 'paid' ? naira(c.amount) : <span className="text-gray-400 font-normal">Payment failed</span>}
                            </p>
                            {r && <span className={`badge ${r.badge} mt-1`}>{r.text}</span>}
                            {c.refund_state === 'failed' && canManage && (
                              <button
                                className="block ml-auto mt-1 text-xs font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-50"
                                disabled={busyId === c.id}
                                onClick={() => handleRetry(c)}
                              >
                                {busyId === c.id ? 'Retrying...' : 'Retry refund'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Close</button>
          {cancellable && canManage && (
            <button onClick={handleCancel} disabled={cancelling} className="flex-[2] btn-primary !bg-red-600 hover:!bg-red-700">
              {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
              Cancel and refund everyone
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3.5 py-3">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  )
}
