import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Loader2, UserPlus, Mail, ExternalLink, Trash2 } from 'lucide-react'
import {
  useGetProviderApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useDeleteApplicationMutation,
  useGetWaitlistQuery,
  useDeleteWaitlistSignupMutation,
} from '../services/api'
import { selectCurrentUser } from '../features/authSlice'
import { hasPerm } from '../lib/permissions'
import { errMsg } from '../lib/errors'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'

const PER_PAGE = 20

const STATUS_STYLES = {
  new: 'badge-yellow',
  contacted: 'badge-blue',
  approved: 'badge-green',
  rejected: 'badge-gray',
}
const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  approved: 'Approved',
  rejected: 'Rejected',
}
const NEXT_ACTIONS = {
  new: [
    { status: 'contacted', label: 'Mark contacted' },
    { status: 'rejected', label: 'Reject' },
  ],
  contacted: [
    { status: 'approved', label: 'Approve' },
    { status: 'rejected', label: 'Reject' },
  ],
  approved: [],
  rejected: [{ status: 'new', label: 'Reopen' }],
}

const APP_FILTERS = [
  { value: '', label: 'All status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function ApplicationsTab({ canManage }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, isError, error, refetch } = useGetProviderApplicationsQuery({
    status: statusFilter || undefined,
    page,
    per_page: PER_PAGE,
  })
  const [updateStatus] = useUpdateApplicationStatusMutation()
  const [deleteApplication] = useDeleteApplicationMutation()
  const [busyId, setBusyId] = useState(null)

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)
  const colSpan = canManage ? 8 : 7

  const handleAction = async (id, status) => {
    setBusyId(id)
    try {
      await updateStatus({ id, status }).unwrap()
    } catch (err) {
      alert(errMsg(err, 'Failed to update application'))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (app) => {
    if (!window.confirm(`Remove the application from ${app.full_name || 'this applicant'}? This cannot be undone.`)) return
    setBusyId(app.id)
    try {
      await deleteApplication(app.id).unwrap()
    } catch (err) {
      alert(errMsg(err, 'Failed to remove application'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="select"
        >
          {APP_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Applicant</th>
                <th className="table-header">Business</th>
                <th className="table-header">Service</th>
                <th className="table-header">City</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                {canManage && <th className="table-header w-[180px]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                      <span className="text-sm text-gray-400">Loading applications...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <ErrorRow colSpan={colSpan} what="applications" error={error} onRetry={refetch} retrying={isFetching} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No applications yet</p>
                      <p className="text-xs text-gray-400">Provider signups from quickgift.ng show up here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((app) => (
                  <tr key={app.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{app.full_name || '—'}</div>
                      {app.portfolio_url && (
                        <a
                          href={app.portfolio_url.startsWith('http') ? app.portfolio_url : `https://instagram.com/${app.portfolio_url.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-teal-600 mt-0.5 inline-flex items-center gap-1 hover:underline"
                        >
                          {app.portfolio_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="table-cell text-gray-600 text-sm">{app.business_name || '—'}</td>
                    <td className="table-cell text-gray-600 text-sm capitalize">{app.service_type || '—'}</td>
                    <td className="table-cell text-gray-600 text-sm">{app.city || '—'}</td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{app.phone || '—'}</div>
                      {app.email && <div className="text-xs text-gray-400 mt-0.5">{app.email}</div>}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[app.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                    </td>
                    {canManage && (
                      <td className="table-cell">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(NEXT_ACTIONS[app.status] || []).map((a) => (
                            <button
                              key={a.status}
                              onClick={() => handleAction(app.id, a.status)}
                              disabled={busyId === app.id}
                              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                                a.status === 'rejected'
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-teal-500 text-white hover:bg-teal-600'
                              }`}
                            >
                              {a.label}
                            </button>
                          ))}
                          <button
                            onClick={() => handleDelete(app)}
                            disabled={busyId === app.id}
                            title="Remove application"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
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
          label="applications"
          isFetching={isFetching}
        />
      </div>
    </>
  )
}

function WaitlistTab({ canManage }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, isError, error, refetch } = useGetWaitlistQuery({ page, per_page: PER_PAGE })
  const [deleteSignup] = useDeleteWaitlistSignupMutation()
  const [busyId, setBusyId] = useState(null)
  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)
  const colSpan = canManage ? 6 : 5

  const handleDelete = async (row) => {
    if (!window.confirm(`Remove ${row.email || row.phone} from the waitlist? This cannot be undone.`)) return
    setBusyId(row.id)
    try {
      await deleteSignup(row.id).unwrap()
    } catch (err) {
      alert(errMsg(err, 'Failed to remove signup'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="table-header">Email</th>
              <th className="table-header">Interested as</th>
              <th className="table-header">Skill</th>
              <th className="table-header">Source</th>
              <th className="table-header">Date</th>
              {canManage && <th className="table-header w-[80px]">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading waitlist...</span>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <ErrorRow colSpan={colSpan} what="the waitlist" error={error} onRetry={refetch} retrying={isFetching} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No signups yet</p>
                    <p className="text-xs text-gray-400">Waitlist signups from quickgift.ng show up here</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell font-medium text-gray-900">
                    {row.email || row.phone || '—'}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${row.role === 'provider' ? 'badge-blue' : 'badge-gray'}`}>
                      {row.role === 'provider' ? 'Provider' : 'Customer'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-600 text-sm">{row.skill || '—'}</td>
                  <td className="table-cell text-gray-500 text-sm">{row.source || '—'}</td>
                  <td className="table-cell text-gray-500">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                  </td>
                  {canManage && (
                    <td className="table-cell">
                      <button
                        onClick={() => handleDelete(row)}
                        disabled={busyId === row.id}
                        title="Remove signup"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
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
        label="signups"
        isFetching={isFetching}
      />
    </div>
  )
}

export default function ApplicationsPage() {
  const user = useSelector(selectCurrentUser)
  const canManage = hasPerm(user, 'applications.manage')
  const [tab, setTab] = useState('applications')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Provider applications and waitlist signups from the landing page</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('applications')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'applications' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Provider applications
        </button>
        <button
          onClick={() => setTab('waitlist')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'waitlist' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Waitlist
        </button>
      </div>

      {tab === 'applications' ? <ApplicationsTab canManage={canManage} /> : <WaitlistTab canManage={canManage} />}
    </div>
  )
}
