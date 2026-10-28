import { useState } from 'react'
import { Search, Download, MapPin, Loader2, Wallet, Users as UsersIcon, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import {
  useGetAdminUsersQuery,
  useDeleteAdminUserMutation,
  useBulkDeleteAdminUsersMutation,
} from '../services/api'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(() => new Set())

  const { data, isLoading, isFetching } = useGetAdminUsersQuery({
    search: searchQuery || undefined,
    page,
    per_page: 20,
  })
  const [deleteUser, { isLoading: deletingOne }] = useDeleteAdminUserMutation()
  const [bulkDelete, { isLoading: deletingBulk }] = useBulkDeleteAdminUsersMutation()
  const busy = deletingOne || deletingBulk

  const users = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  // Only non-admin users can be selected/deleted.
  const deletable = users.filter((u) => u.role !== 'admin')
  const allSelected = deletable.length > 0 && deletable.every((u) => selected.has(u.id))

  const goPage = (p) => {
    setSelected(new Set())
    setPage(p)
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    clearTimeout(window._userSearchTimer)
    window._userSearchTimer = setTimeout(() => {
      setSearchQuery(e.target.value)
      setSelected(new Set())
      setPage(1)
    }, 400)
  }

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      if (deletable.every((u) => prev.has(u.id))) return new Set()
      return new Set(deletable.map((u) => u.id))
    })
  }

  const handleDeleteOne = async (user) => {
    if (!window.confirm(`Delete ${user.full_name || user.phone || 'this user'} and all their data? This cannot be undone.`)) return
    try {
      await deleteUser(user.id).unwrap()
      setSelected((prev) => { const n = new Set(prev); n.delete(user.id); return n })
    } catch (e) {
      alert(e?.data?.message || 'Could not delete this user.')
    }
  }

  const handleBulkDelete = async () => {
    const ids = [...selected]
    if (!ids.length) return
    if (!window.confirm(`Permanently delete ${ids.length} user${ids.length > 1 ? 's' : ''} and all their data? This cannot be undone.`)) return
    try {
      const res = await bulkDelete(ids).unwrap()
      setSelected(new Set())
      if (res?.skipped?.length) {
        alert(`Deleted ${res.deleted}. Skipped ${res.skipped.length} (admins or linked records).`)
      }
    } catch (e) {
      alert(e?.data?.message || 'Bulk delete failed.')
    }
  }

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString()

  const ROLE_STYLES = {
    admin: 'badge-teal',
    provider: 'badge-purple',
    user: 'badge-gray',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage platform users and their accounts</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={handleSearch}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 animate-slide-up">
          <span className="text-sm font-medium text-red-700">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="btn-ghost text-gray-600"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={busy}
              className="btn-danger"
            >
              {deletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={deletable.length === 0}
                    className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500/30 cursor-pointer"
                  />
                </th>
                <th className="table-header">Name</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">City</th>
                <th className="table-header">Wallet</th>
                <th className="table-header">Joined</th>
                <th className="table-header w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading users...</span>
                  </div>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No users found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search</p>
                  </div>
                </td></tr>
              ) : (
                users.map((user) => {
                  const isAdmin = user.role === 'admin'
                  const checked = selected.has(user.id)
                  return (
                  <tr key={user.id} className={`table-row ${checked ? 'bg-red-50/40' : ''}`}>
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(user.id)}
                        disabled={isAdmin}
                        title={isAdmin ? 'Admin accounts cannot be deleted' : ''}
                        className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">{(user.full_name || 'U').charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-900">{user.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{user.phone || '—'}</td>
                    <td className="table-cell text-gray-500">{user.email || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${ROLE_STYLES[user.role] || 'badge-gray'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {user.city ? (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {user.city}
                        </div>
                      ) : (
                        <span className="text-gray-300">{'—'}</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 font-medium text-gray-900">
                        <Wallet className="w-3.5 h-3.5 text-gray-400" />
                        {formatPrice(user.wallet_balance || user.wallet || 0)}
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                    <td className="table-cell text-right">
                      {!isAdmin && (
                        <button
                          onClick={() => handleDeleteOne(user)}
                          disabled={busy}
                          title="Delete user"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />}
            {total} total users
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => goPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => goPage(p)}
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
                onClick={() => goPage(Math.min(totalPages, page + 1))}
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
