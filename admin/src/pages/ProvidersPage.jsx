import { useState } from 'react'
import { Search, Plus, Star, MapPin, Check, X, Shield, Loader2 } from 'lucide-react'
import { useGetAdminProvidersQuery, useApproveProviderMutation, useRejectProviderMutation } from '../services/api'

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

  const filtered = (Array.isArray(providers) ? providers : []).filter(p => {
    if (search && !p.business_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const verifiedCount = filtered.filter(p => p.status === 'verified' || p.is_verified).length
  const pendingCount = filtered.filter(p => p.status === 'pending').length

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
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
        <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 focus:border-red-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Approval</option>
        </select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">💈</p>
          <p>No providers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((provider) => {
            const isVerified = provider.status === 'verified' || provider.is_verified
            const isPending = provider.status === 'pending'
            return (
              <div key={provider.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-red-600">{(provider.business_name || provider.name || 'P').charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{provider.business_name || provider.name}</h3>
                        {isVerified && <Shield className="w-4 h-4 text-blue-500" />}
                      </div>
                      <p className="text-xs text-gray-500">{provider.service_type}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_STYLES[provider.plan || 'Free']}`}>
                    {provider.plan || 'Free'}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {provider.city || 'Lagos'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {provider.rating || '—'} ({provider.review_count || 0})
                  </div>
                  <div className={`flex items-center gap-1 ${provider.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${provider.is_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {provider.is_available ? 'Online' : 'Offline'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-bold text-gray-900">{provider.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-bold text-gray-900">{provider.created_at ? new Date(provider.created_at).toLocaleDateString() : '—'}</p>
                  </div>
                </div>

                {isPending ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(provider.id)}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(provider.id)}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                ) : (
                  <button className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
                    View Details
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
