import { useState } from 'react'
import { Search, Star, MapPin, Check, X, Shield, Loader2, Sparkles, UserCheck, Clock, Ban, RotateCcw, AlertTriangle } from 'lucide-react'
import {
  useGetAdminProvidersQuery,
  useApproveProviderMutation,
  useRejectProviderMutation,
  useSuspendProviderMutation,
  useReactivateProviderMutation,
} from '../services/api'

const STATUS_STYLES = {
  verified: 'badge-green',
  pending: 'badge-yellow',
  suspended: 'badge-red',
  rejected: 'badge-red',
}

const STATUS_LABELS = {
  verified: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  rejected: 'Rejected',
}

const PLAN_STYLES = {
  Free: 'badge-gray',
  Pro: 'badge-blue',
  Elite: 'badge-purple',
}

export default function ProvidersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [reasonModal, setReasonModal] = useState(null) // { action: 'reject'|'suspend', providerId, name }
  const [reason, setReason] = useState('')

  const { data: providers = [], isLoading } = useGetAdminProvidersQuery(statusFilter || undefined)
  const [approveProvider, { isLoading: approving }] = useApproveProviderMutation()
  const [rejectProvider, { isLoading: rejecting }] = useRejectProviderMutation()
  const [suspendProvider, { isLoading: suspending }] = useSuspendProviderMutation()
  const [reactivateProvider, { isLoading: reactivating }] = useReactivateProviderMutation()
  const updating = approving || rejecting || suspending || reactivating

  const allProviders = Array.isArray(providers) ? providers : []
  const filtered = allProviders.filter(p => {
    if (search && !p.business_name?.toLowerCase().includes(search.toLowerCase()) && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const verifiedCount = allProviders.filter(p => p.status === 'verified').length
  const pendingCount = allProviders.filter(p => p.status === 'pending').length
  const suspendedCount = allProviders.filter(p => p.status === 'suspended' || p.status === 'rejected').length

  const handleApprove = async (id, name) => {
    if (!confirm(`Approve "${name}"? They will gain full access to the platform.`)) return
    try {
      await approveProvider(id).unwrap()
    } catch (err) {
      alert(err?.data?.detail || 'Failed to approve provider')
    }
  }

  const handleReactivate = async (id, name) => {
    if (!confirm(`Reactivate "${name}"? They will regain full access.`)) return
    try {
      await reactivateProvider(id).unwrap()
    } catch (err) {
      alert(err?.data?.detail || 'Failed to reactivate provider')
    }
  }

  const openReasonModal = (action, providerId, name) => {
    setReason('')
    setReasonModal({ action, providerId, name })
  }

  const handleReasonSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason')
      return
    }
    try {
      if (reasonModal.action === 'reject') {
        await rejectProvider({ id: reasonModal.providerId, reason }).unwrap()
      } else if (reasonModal.action === 'suspend') {
        await suspendProvider({ id: reasonModal.providerId, reason }).unwrap()
      }
      setReasonModal(null)
      setReason('')
    } catch (err) {
      alert(err?.data?.detail || `Failed to ${reasonModal.action} provider`)
    }
  }

  const getActions = (provider) => {
    const name = provider.business_name || provider.name || 'Provider'
    const s = provider.status

    if (s === 'pending') {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleApprove(provider.id, name)}
            disabled={updating}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            onClick={() => openReasonModal('reject', provider.id, name)}
            disabled={updating}
            className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }

    if (s === 'verified') {
      return (
        <button
          onClick={() => openReasonModal('suspend', provider.id, name)}
          disabled={updating}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <Ban className="w-3 h-3" />
          Suspend
        </button>
      )
    }

    if (s === 'suspended' || s === 'rejected') {
      return (
        <button
          onClick={() => handleReactivate(provider.id, name)}
          disabled={updating}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3 h-3" />
          Reactivate
        </button>
      )
    }

    return <span className="text-xs text-gray-300">{'\u2014'}</span>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Providers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and verify service providers & sellers</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{allProviders.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-600">{verifiedCount}</p>
            <p className="text-xs text-gray-500">Active</p>
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
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <Ban className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-red-500">{suspendedCount}</p>
            <p className="text-xs text-gray-500">Suspended</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search providers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
          <option value="">All Status</option>
          <option value="verified">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
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
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="table-header">Business</th>
                  <th className="table-header">Service</th>
                  <th className="table-header">City</th>
                  <th className="table-header">Rating</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Registered</th>
                  <th className="table-header w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((provider) => {
                  const providerStatus = provider.status || 'pending'
                  return (
                    <tr key={provider.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{(provider.business_name || 'P').charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-900 truncate">{provider.business_name || provider.name}</span>
                              {providerStatus === 'verified' && <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                            </div>
                            {provider.status_reason && (providerStatus === 'suspended' || providerStatus === 'rejected') && (
                              <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[200px]" title={provider.status_reason}>
                                Reason: {provider.status_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-gray-600">{provider.service_type || '\u2014'}</td>
                      <td className="table-cell">
                        {provider.city ? (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {provider.city}
                          </div>
                        ) : '\u2014'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{provider.rating || '\u2014'}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${STATUS_STYLES[providerStatus] || 'badge-gray'}`}>
                          {STATUS_LABELS[providerStatus] || providerStatus}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500 text-sm">
                        {provider.created_at ? new Date(provider.created_at).toLocaleDateString() : '\u2014'}
                      </td>
                      <td className="table-cell">
                        {getActions(provider)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {reasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reasonModal.action === 'reject' ? 'bg-red-50' : 'bg-amber-50'}`}>
                <AlertTriangle className={`w-5 h-5 ${reasonModal.action === 'reject' ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {reasonModal.action === 'reject' ? 'Reject' : 'Suspend'} Provider
                </h3>
                <p className="text-sm text-gray-500">{reasonModal.name}</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Why are you ${reasonModal.action === 'reject' ? 'rejecting' : 'suspending'} this provider?`}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none resize-none"
              autoFocus
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setReasonModal(null)}
                className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReasonSubmit}
                disabled={!reason.trim() || updating}
                className={`flex-[2] py-2.5 px-4 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50 ${
                  reasonModal.action === 'reject'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {updating ? 'Processing...' : `${reasonModal.action === 'reject' ? 'Reject' : 'Suspend'} Provider`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
