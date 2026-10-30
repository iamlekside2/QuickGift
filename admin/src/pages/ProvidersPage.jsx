import { useState } from 'react'
import { Search, Star, MapPin, Check, X, Shield, Loader2, Sparkles, UserCheck, Clock, Ban, RotateCcw, AlertTriangle, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useGetAdminProvidersQuery,
  useApproveProviderMutation,
  useRejectProviderMutation,
  useSuspendProviderMutation,
  useReactivateProviderMutation,
  useUpdateAdminProviderMutation,
} from '../services/api'
import { FormModal, FieldGrid, TextField, TextAreaField, SelectField, ToggleField } from '../components/FormModal'

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
  const [page, setPage] = useState(1)
  const [reasonModal, setReasonModal] = useState(null) // { action: 'reject'|'suspend', providerId, name }
  const [reason, setReason] = useState('')
  const PER_PAGE = 15

  const { data: providers = [], isLoading } = useGetAdminProvidersQuery(statusFilter || undefined)
  const [approveProvider, { isLoading: approving }] = useApproveProviderMutation()
  const [rejectProvider, { isLoading: rejecting }] = useRejectProviderMutation()
  const [suspendProvider, { isLoading: suspending }] = useSuspendProviderMutation()
  const [reactivateProvider, { isLoading: reactivating }] = useReactivateProviderMutation()
  const [updateProvider, { isLoading: savingEdit }] = useUpdateAdminProviderMutation()
  const [edit, setEdit] = useState(null)
  const updating = approving || rejecting || suspending || reactivating

  const openEdit = (p) => setEdit({
    id: p.id,
    business_name: p.business_name || '',
    service_type: p.service_type || '',
    city: p.city || '',
    location: p.location || '',
    bio: p.bio || '',
    experience_years: p.experience_years ?? 0,
    plan: p.plan || 'Free',
    is_available: p.is_available !== false,
    offers_home_service: !!p.offers_home_service,
    offers_salon_service: !!p.offers_salon_service,
  })

  const saveEdit = async () => {
    try {
      await updateProvider({ ...edit, experience_years: Number(edit.experience_years) || 0 }).unwrap()
      setEdit(null)
    } catch (e) {
      alert(e?.data?.message || 'Could not save changes.')
    }
  }

  const allProviders = Array.isArray(providers) ? providers : []
  const filtered = allProviders.filter(p => {
    if (search && !p.business_name?.toLowerCase().includes(search.toLowerCase()) && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const verifiedCount = allProviders.filter(p => p.status === 'verified').length
  const pendingCount = allProviders.filter(p => p.status === 'pending').length
  const suspendedCount = allProviders.filter(p => p.status === 'suspended' || p.status === 'rejected').length

  // Client-side pagination (the backend returns all providers; stats above need
  // the full list, so we page the filtered rows here rather than server-side).
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

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
          <input type="text" placeholder="Search providers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="select">
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
                  <th className="table-header w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((provider) => {
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(provider)}
                            title="Edit provider"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {getActions(provider)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'provider' : 'providers'}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-500 px-2">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
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

      {/* Edit Provider Modal */}
      {edit && (
        <FormModal
          title="Edit provider"
          subtitle={edit.business_name}
          onClose={() => setEdit(null)}
          onSave={saveEdit}
          saving={savingEdit}
        >
          <FieldGrid>
            <TextField label="Business name" value={edit.business_name} onChange={(v) => setEdit({ ...edit, business_name: v })} full />
            <TextField label="Service type" value={edit.service_type} onChange={(v) => setEdit({ ...edit, service_type: v })} />
            <SelectField
              label="Plan"
              value={edit.plan}
              onChange={(v) => setEdit({ ...edit, plan: v })}
              options={[
                { value: 'Free', label: 'Free' },
                { value: 'Pro', label: 'Pro' },
                { value: 'Elite', label: 'Elite' },
              ]}
            />
            <TextField label="City" value={edit.city} onChange={(v) => setEdit({ ...edit, city: v })} />
            <TextField label="Experience (years)" type="number" value={edit.experience_years} onChange={(v) => setEdit({ ...edit, experience_years: v })} />
            <TextField label="Location / address" value={edit.location} onChange={(v) => setEdit({ ...edit, location: v })} full />
            <TextAreaField label="Bio" value={edit.bio} onChange={(v) => setEdit({ ...edit, bio: v })} placeholder="Short description of the business" />
            <ToggleField label="Available for bookings" checked={edit.is_available} onChange={(v) => setEdit({ ...edit, is_available: v })} />
            <ToggleField label="Offers home service" checked={edit.offers_home_service} onChange={(v) => setEdit({ ...edit, offers_home_service: v })} />
            <ToggleField label="Offers salon service" checked={edit.offers_salon_service} onChange={(v) => setEdit({ ...edit, offers_salon_service: v })} />
          </FieldGrid>
        </FormModal>
      )}
    </div>
  )
}
