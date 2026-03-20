import { useState } from 'react'
import { Search, Star, MapPin, Check, X, Shield, Loader2, Sparkles, UserCheck, Clock } from 'lucide-react'
import { useGetAdminProvidersQuery, useApproveProviderMutation, useRejectProviderMutation } from '../services/api'

const STATUS_STYLES = {
  verified: 'badge-green',
  pending: 'badge-yellow',
  suspended: 'badge-red',
}

const PLAN_STYLES = {
  Free: 'badge-gray',
  Pro: 'badge-blue',
  Elite: 'badge-purple',
}

export default function ProvidersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: providers = [], isLoading } = useGetAdminProvidersQuery(statusFilter || undefined)
  const [approveProvider, { isLoading: approving }] = useApproveProviderMutation()
  const [rejectProvider, { isLoading: rejecting }] = useRejectProviderMutation()
  const updating = approving || rejecting

  const allProviders = Array.isArray(providers) ? providers : []
  const filtered = allProviders.filter(p => {
    if (search && !p.business_name?.toLowerCase().includes(search.toLowerCase()) && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const verifiedCount = allProviders.filter(p => p.status === 'verified' || p.is_verified).length
  const pendingCount = allProviders.filter(p => p.status === 'pending').length

  const handleApprove = async (id) => {
    try {
      await approveProvider(id).unwrap()
    } catch (err) {
      alert(err?.data?.detail || 'Failed to approve provider')
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Reject this provider?')) return
    try {
      await rejectProvider(id).unwrap()
    } catch (err) {
      alert(err?.data?.detail || 'Failed to reject provider')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Providers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and verify service providers</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{allProviders.length}</p>
            <p className="text-xs text-gray-500">Total Providers</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-600">{verifiedCount}</p>
            <p className="text-xs text-gray-500">Verified</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select"
        >
          <option value="">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Approval</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            <span className="text-sm text-gray-400">Loading providers...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No providers found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="table-header">Business</th>
                  <th className="table-header">Owner</th>
                  <th className="table-header">Service</th>
                  <th className="table-header">City</th>
                  <th className="table-header">Rating</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Plan</th>
                  <th className="table-header w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((provider) => {
                  const isVerified = provider.status === 'verified' || provider.is_verified
                  const isPending = provider.status === 'pending'
                  const providerStatus = isVerified ? 'verified' : provider.status || 'pending'
                  return (
                    <tr key={provider.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{(provider.business_name || provider.name || 'P').charAt(0)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-gray-900 truncate">{provider.business_name || provider.name}</span>
                            {isVerified && <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-gray-600">{provider.owner_name || provider.full_name || '\u2014'}</td>
                      <td className="table-cell text-gray-600">{provider.service_type || '\u2014'}</td>
                      <td className="table-cell">
                        {provider.city ? (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {provider.city}
                          </div>
                        ) : (
                          <span className="text-gray-300">\u2014</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{provider.rating || '\u2014'}</span>
                          <span className="text-gray-400 text-xs">({provider.review_count || 0})</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${STATUS_STYLES[providerStatus] || 'badge-gray'}`}>
                          {providerStatus.charAt(0).toUpperCase() + providerStatus.slice(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${PLAN_STYLES[provider.plan || 'Free']}`}>
                          {provider.plan || 'Free'}
                        </span>
                      </td>
                      <td className="table-cell">
                        {isPending ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleApprove(provider.id)}
                              disabled={updating}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(provider.id)}
                              disabled={updating}
                              className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">\u2014</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
