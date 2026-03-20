import { useState } from 'react'
import { Search, Download, MapPin, Loader2, Wallet, Users as UsersIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetAdminUsersQuery } from '../services/api'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useGetAdminUsersQuery({
    search: searchQuery || undefined,
    page,
    per_page: 20,
  })

  const users = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const handleSearch = (e) => {
    setSearch(e.target.value)
    clearTimeout(window._userSearchTimer)
    window._userSearchTimer = setTimeout(() => {
      setSearchQuery(e.target.value)
      setPage(1)
    }, 400)
  }

  const formatPrice = (price) => '\u20A6' + (price || 0).toLocaleString()

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

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Name</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">City</th>
                <th className="table-header">Wallet</th>
                <th className="table-header">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading users...</span>
                  </div>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No users found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search</p>
                  </div>
                </td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">{(user.full_name || 'U').charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-900">{user.full_name || '\u2014'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{user.phone || '\u2014'}</td>
                    <td className="table-cell text-gray-500">{user.email || '\u2014'}</td>
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
                        <span className="text-gray-300">\u2014</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 font-medium text-gray-900">
                        <Wallet className="w-3.5 h-3.5 text-gray-400" />
                        {formatPrice(user.wallet_balance || user.wallet || 0)}
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '\u2014'}</td>
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
            {total} total users
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
