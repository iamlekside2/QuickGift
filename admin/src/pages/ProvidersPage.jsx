import { useState } from 'react'
import { Search, Star, MapPin, Check, X, Shield, Loader2 } from 'lucide-react'
import { useGetAdminProvidersQuery, useApproveProviderMutation, useRejectProviderMutation } from '../services/api'

const STATUS_STYLES = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
}

const PLAN_STYLES = {
  Free: 'bg-gray-100 text-gray-600',
  Pro: 'bg-blue-100 text-blue-600',
  Elite: 'bg-purple-100 text-purple-600',
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
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{allProviders.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
            <p className="text-xs text-gray-500">Verified</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:border-teal-500 outline-none"
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
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-1">No providers found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((provider) => {
                  const isVerified = provider.status === 'verified' || provider.is_verified
                  const isPending = provider.status === 'pending'
                  const providerStatus = isVerified ? 'verified' : provider.status || 'pending'
                  return (
                    <tr key={provider.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-teal-600">{(provider.business_name || provider.name || 'P').charAt(0)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{provider.business_name || provider.name}</span>
                            {isVerified && <Shield className="w-4 h-4 text-blue-500" />}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{provider.owner_name || provider.full_name || '\u2014'}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{provider.service_type || '\u2014'}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {provider.city || 'Lagos'}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {provider.rating || '\u2014'} ({provider.review_count || 0})
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[providerStatus] || 'bg-gray-100 text-gray-700'}`}>
                          {providerStatus.charAt(0).toUpperCase() + providerStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_STYLES[provider.plan || 'Free']}`}>
                          {provider.plan || 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {isPending ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleApprove(provider.id)}
                              disabled={updating}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(provider.id)}
                              disabled={updating}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">\u2014</span>
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
