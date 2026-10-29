import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Loader2, UserPlus, Trash2, Pencil, KeyRound, ShieldCheck, Mail, Phone, History,
} from 'lucide-react'
import {
  useGetStaffQuery,
  useGetStaffAuditQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useResetStaffPasswordMutation,
  useDeleteStaffMutation,
} from '../services/api'
import { selectCurrentUser } from '../features/authSlice'
import {
  FormModal, FieldGrid, TextField, SelectField, ToggleField,
} from '../components/FormModal'
import { ROLE_OPTIONS, OWNER_OPTION, roleLabel, ROLE_BADGE } from '../lib/permissions'

function errMsg(err, fallback) {
  return err?.data?.message || err?.data?.detail || fallback
}

export default function TeamPage() {
  const me = useSelector(selectCurrentUser)
  const { data, isLoading, isFetching } = useGetStaffQuery()
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation()
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation()
  const [resetPassword, { isLoading: resetting }] = useResetStaffPasswordMutation()
  const [deleteStaff] = useDeleteStaffMutation()

  const [tab, setTab] = useState('members')
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [pwdRow, setPwdRow] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [formErr, setFormErr] = useState('')

  const items = data?.items || []

  // Only an owner can create or assign the Owner role.
  const roleOptions = useMemo(
    () => (me?.role === 'owner' ? [OWNER_OPTION, ...ROLE_OPTIONS] : ROLE_OPTIONS),
    [me?.role],
  )

  // ---- create ----
  const emptyForm = { full_name: '', email: '', phone: '', role: 'support', password: '' }
  const [form, setForm] = useState(emptyForm)
  const openCreate = () => { setForm(emptyForm); setFormErr(''); setCreateOpen(true) }
  const submitCreate = async () => {
    setFormErr('')
    try {
      await createStaff(form).unwrap()
      setCreateOpen(false)
    } catch (err) {
      setFormErr(errMsg(err, 'Could not create the worker'))
    }
  }

  // ---- edit ----
  const openEdit = (row) => { setEditRow({ ...row }); setFormErr('') }
  const submitEdit = async () => {
    setFormErr('')
    try {
      await updateStaff({
        id: editRow.id,
        full_name: editRow.full_name,
        role: editRow.role,
        is_active: editRow.is_active,
      }).unwrap()
      setEditRow(null)
    } catch (err) {
      setFormErr(errMsg(err, 'Could not update the worker'))
    }
  }

  // ---- password ----
  const openPwd = (row) => { setPwdRow({ id: row.id, name: row.full_name, password: '' }); setFormErr('') }
  const submitPwd = async () => {
    setFormErr('')
    try {
      await resetPassword({ id: pwdRow.id, password: pwdRow.password }).unwrap()
      setPwdRow(null)
    } catch (err) {
      setFormErr(errMsg(err, 'Could not reset the password'))
    }
  }

  // ---- delete ----
  const handleDelete = async (row) => {
    if (!window.confirm(`Remove ${row.full_name} from the team? They will lose access immediately.`)) return
    setBusyId(row.id)
    try {
      await deleteStaff(row.id).unwrap()
    } catch (err) {
      alert(errMsg(err, 'Could not remove the worker'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            Workers who can sign into the admin console. Each role sees only what it needs.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary w-fit">
          <UserPlus className="w-4 h-4" />
          Add worker
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('members')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'members' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 ${
            tab === 'activity' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-4 h-4" />
          Activity
        </button>
      </div>

      {tab === 'activity' && <ActivityTab />}

      {tab === 'members' && (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Name</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Role</th>
                <th className="table-header">Status</th>
                <th className="table-header w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                      <span className="text-sm text-gray-400">Loading team...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No workers yet</p>
                      <p className="text-xs text-gray-400">Add your first team member to share the workload</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const isSelf = row.id === me?.id
                  return (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">
                              {row.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">
                            {row.full_name}
                            {isSelf && <span className="ml-2 text-[11px] text-teal-600 font-semibold">You</span>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />{row.email}
                        </div>
                        {row.phone && (
                          <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3" />{row.phone}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${ROLE_BADGE[row.role] || 'badge-gray'}`}>
                          {roleLabel(row.role)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${row.is_active ? 'badge-green' : 'badge-gray'}`}>
                          {row.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(row)}
                            title="Edit worker"
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPwd(row)}
                            title="Reset password"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={isSelf || busyId === row.id}
                            title={isSelf ? "You can't remove yourself" : 'Remove worker'}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center">
          <span className="text-xs text-gray-500">
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />}
            {items.length} team {items.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
      )}

      {/* Create */}
      {createOpen && (
        <FormModal
          title="Add a worker"
          subtitle="They'll sign in with this email and password."
          onClose={() => setCreateOpen(false)}
          onSave={submitCreate}
          saving={creating}
          saveLabel="Create worker"
        >
          {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{formErr}</div>}
          <FieldGrid>
            <TextField label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="e.g. Ada Obi" full />
            <TextField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="worker@quickgift.ng" />
            <TextField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="080..." />
            <SelectField label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={roleOptions} full />
            <TextField label="Temporary password" type="text" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="At least 6 characters" hint="Share it with them; they can change it later." full />
          </FieldGrid>
          <RoleHint role={form.role} options={roleOptions} />
        </FormModal>
      )}

      {/* Edit */}
      {editRow && (
        <FormModal
          title={`Edit ${editRow.full_name}`}
          subtitle={editRow.email}
          onClose={() => setEditRow(null)}
          onSave={submitEdit}
          saving={updating}
        >
          {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{formErr}</div>}
          <FieldGrid>
            <TextField label="Full name" value={editRow.full_name} onChange={(v) => setEditRow({ ...editRow, full_name: v })} full />
            <SelectField
              label="Role"
              value={editRow.role}
              onChange={(v) => setEditRow({ ...editRow, role: v })}
              options={editRow.role === 'owner' && me?.role !== 'owner' ? [{ value: 'owner', label: 'Owner' }] : roleOptions}
              full
            />
            <ToggleField
              label="Active"
              hint="Turn off to block sign-in without deleting the account."
              checked={!!editRow.is_active}
              onChange={(v) => setEditRow({ ...editRow, is_active: v })}
            />
          </FieldGrid>
          <RoleHint role={editRow.role} options={roleOptions} />
        </FormModal>
      )}

      {/* Reset password */}
      {pwdRow && (
        <FormModal
          title="Reset password"
          subtitle={`New sign-in password for ${pwdRow.name}`}
          onClose={() => setPwdRow(null)}
          onSave={submitPwd}
          saving={resetting}
          saveLabel="Set password"
        >
          {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{formErr}</div>}
          <FieldGrid>
            <TextField label="New password" type="text" value={pwdRow.password} onChange={(v) => setPwdRow({ ...pwdRow, password: v })} placeholder="At least 6 characters" full />
          </FieldGrid>
        </FormModal>
      )}
    </div>
  )
}

function RoleHint({ role, options }) {
  const opt = options.find((o) => o.value === role)
  if (!opt?.description) return null
  return (
    <p className="text-[12px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <span className="font-semibold text-gray-700">{opt.label}:</span> {opt.description}
    </p>
  )
}

const ACTION_META = {
  created: { label: 'Created', badge: 'badge-green' },
  updated: { label: 'Updated', badge: 'badge-blue' },
  password_reset: { label: 'Password reset', badge: 'badge-yellow' },
  deleted: { label: 'Removed', badge: 'badge-gray' },
}

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}

function ActivityTab() {
  const { data, isLoading } = useGetStaffAuditQuery()
  const items = data?.items || []

  if (isLoading) {
    return (
      <div className="card p-16 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        <span className="text-sm text-gray-400">Loading activity...</span>
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="card p-16 flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <History className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">No activity yet</p>
        <p className="text-xs text-gray-400">Team changes (added, edited, removed) will show up here</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <ol className="relative border-l border-gray-200 ml-2 space-y-5">
        {items.map((row) => {
          const meta = ACTION_META[row.action] || { label: row.action, badge: 'badge-gray' }
          return (
            <li key={row.id} className="ml-5">
              <span className="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-white border-2 border-teal-400" />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${meta.badge}`}>{meta.label}</span>
                <span className="text-sm font-medium text-gray-900">{row.target_name || '—'}</span>
                <span className="text-xs text-gray-400" title={row.created_at ? new Date(row.created_at).toLocaleString() : ''}>
                  {timeAgo(row.created_at)}
                </span>
              </div>
              {row.details && <p className="text-[13px] text-gray-600 mt-1">{row.details}</p>}
              <p className="text-[11px] text-gray-400 mt-1">
                by {row.actor_name || 'System'}{row.actor_email ? ` · ${row.actor_email}` : ''}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
