import { useState } from 'react'
import { Search, Plus, Loader2, Tag, Pencil } from 'lucide-react'
import {
  useGetPromosQuery, useCreatePromoMutation, useUpdatePromoMutation,
} from '../services/api'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'
import { FormModal, FieldGrid, TextField, SelectField, ToggleField } from '../components/FormModal'
import { errMsg } from '../lib/errors'

const PER_PAGE = 20

const naira = (n) => '₦' + (Number(n) || 0).toLocaleString()
// A promo day is a plain calendar day: build the date from its parts so the
// browser's time zone cannot move it.
const day = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''))
  return m
    ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
}

const worth = (p) => {
  if (p.kind === 'percent') {
    return `${p.value}% off${p.max_discount ? `, up to ${naira(p.max_discount)}` : ''}`
  }
  return `${naira(p.value)} off`
}

const status = (p) => {
  if (!p.is_active) return { label: 'Off', badge: 'badge-gray' }
  if (p.expired) return { label: 'Expired', badge: 'badge-red' }
  if (p.usage_limit && p.used_count >= p.usage_limit) return { label: 'Used up', badge: 'badge-yellow' }
  return { label: 'Active', badge: 'badge-green' }
}

const EMPTY = {
  code: '', description: '', kind: 'percent', value: '', max_discount: '',
  min_order: '', usage_limit: '', per_user_limit: '1',
  first_order_only: false, starts_on: '', expires_on: '', is_active: true,
}

// '' means "no limit" for the optional numbers; the API takes null for that.
const toPayload = (f, creating) => {
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
  const body = {
    description: f.description,
    kind: f.kind,
    value: Number(f.value),
    max_discount: f.kind === 'percent' ? num(f.max_discount) : null,
    min_order: num(f.min_order) ?? 0,
    usage_limit: num(f.usage_limit),
    per_user_limit: num(f.per_user_limit) ?? 1,
    first_order_only: !!f.first_order_only,
    starts_on: f.starts_on || null,
    expires_on: f.expires_on || null,
    is_active: !!f.is_active,
  }
  if (creating) body.code = f.code
  return body
}

export default function PromosPage() {
  const [page, setPage] = useState(1)
  const search = useDebouncedSearch(() => setPage(1))
  const { data, isLoading, isFetching, isError, error, refetch } = useGetPromosQuery({
    search: search.query || undefined, page, per_page: PER_PAGE,
  })
  const [createPromo, { isLoading: creating }] = useCreatePromoMutation()
  const [updatePromo, { isLoading: updating }] = useUpdatePromoMutation()

  const [form, setForm] = useState(null) // null = closed; form.id set = editing
  const [formErr, setFormErr] = useState('')
  const [busyId, setBusyId] = useState(null)

  const rows = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  const openCreate = () => { setFormErr(''); setForm({ ...EMPTY }) }
  const openEdit = (p) => {
    setFormErr('')
    setForm({
      id: p.id, code: p.code, description: p.description || '', kind: p.kind,
      value: String(p.value), max_discount: p.max_discount ?? '', min_order: p.min_order || '',
      usage_limit: p.usage_limit ?? '', per_user_limit: String(p.per_user_limit),
      first_order_only: p.first_order_only, starts_on: p.starts_on || '', expires_on: p.expires_on || '',
      is_active: p.is_active, used_count: p.used_count,
    })
  }
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async () => {
    setFormErr('')
    try {
      if (form.id) await updatePromo({ id: form.id, ...toPayload(form, false) }).unwrap()
      else await createPromo(toPayload(form, true)).unwrap()
      setForm(null)
    } catch (e) {
      setFormErr(errMsg(e, 'Could not save this promo code'))
    }
  }

  const toggle = async (p) => {
    setBusyId(p.id)
    try {
      await updatePromo({ id: p.id, is_active: !p.is_active }).unwrap()
    } catch (e) {
      alert(errMsg(e, 'Could not change this promo code'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Promo codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Discounts on gift orders. QuickGift pays for the discount; sellers still receive the full price.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New promo code
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by code or description..."
          value={search.input}
          onChange={(e) => search.onChange(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Code</th>
                <th className="table-header">Discount</th>
                <th className="table-header">Rules</th>
                <th className="table-header">Valid</th>
                <th className="table-header">Used</th>
                <th className="table-header">Given away</th>
                <th className="table-header">Status</th>
                <th className="table-header w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading promo codes...</span>
                  </div>
                </td></tr>
              ) : isError ? (
                <ErrorRow colSpan={8} what="promo codes" error={error} onRetry={refetch} retrying={isFetching} />
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Tag className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      {search.query ? 'No promo codes match your search' : 'No promo codes yet'}
                    </p>
                    {!search.query && (
                      <p className="text-xs text-gray-400">Create one for a launch offer or a campaign</p>
                    )}
                  </div>
                </td></tr>
              ) : (
                rows.map((p) => {
                  const s = status(p)
                  const rules = [
                    p.min_order > 0 ? `Min. order ${naira(p.min_order)}` : '',
                    p.first_order_only ? 'First order only' : '',
                    `${p.per_user_limit} per customer`,
                  ].filter(Boolean).join(' · ')
                  const valid = p.starts_on || p.expires_on
                    ? `${p.starts_on ? day(p.starts_on) : 'Now'} to ${p.expires_on ? day(p.expires_on) : 'no end'}`
                    : 'No end date'
                  return (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-mono font-semibold text-gray-900 text-sm">{p.code}</div>
                        {p.description && <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>}
                      </td>
                      <td className="table-cell text-gray-700 text-sm">{worth(p)}</td>
                      <td className="table-cell text-gray-500 text-xs">{rules}</td>
                      <td className="table-cell text-gray-500 text-xs">{valid}</td>
                      <td className="table-cell text-gray-700 text-sm">
                        {p.used_count}{p.usage_limit ? ` of ${p.usage_limit}` : ''}
                      </td>
                      <td className="table-cell text-gray-700 text-sm">{naira(p.total_discount)}</td>
                      <td className="table-cell"><span className={`badge ${s.badge}`}>{s.label}</span></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            title="Edit"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-50"
                            disabled={busyId === p.id}
                            onClick={() => toggle(p)}
                          >
                            {busyId === p.id ? 'Saving...' : p.is_active ? 'Switch off' : 'Switch on'}
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

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          label="promo codes"
          isFetching={isFetching}
        />
      </div>

      {form && (
        <FormModal
          title={form.id ? `Edit ${form.code}` : 'New promo code'}
          subtitle={form.id
            ? `Used ${form.used_count || 0} time${form.used_count === 1 ? '' : 's'} so far. The code itself cannot be changed.`
            : 'Customers type this at checkout.'}
          onClose={() => setForm(null)}
          onSave={submit}
          saving={creating || updating}
          saveLabel={form.id ? 'Save changes' : 'Create code'}
        >
          {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{formErr}</div>}
          <FieldGrid>
            {!form.id && (
              <TextField
                label="Code"
                value={form.code}
                onChange={(v) => set({ code: v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32) })}
                placeholder="e.g. WELCOME10"
                hint="Letters and numbers only"
                full
              />
            )}
            <TextField label="Note for staff" value={form.description} onChange={(v) => set({ description: v })} placeholder="e.g. Launch week offer" full />
            <SelectField
              label="Type"
              value={form.kind}
              onChange={(v) => set({ kind: v })}
              options={[{ value: 'percent', label: 'Percentage off' }, { value: 'fixed', label: 'Fixed amount off (₦)' }]}
            />
            <TextField
              label={form.kind === 'percent' ? 'Percent off' : 'Amount off (₦)'}
              type="number"
              value={form.value}
              onChange={(v) => set({ value: v })}
              placeholder={form.kind === 'percent' ? '10' : '500'}
            />
            {form.kind === 'percent' && (
              <TextField label="Most it can take off (₦)" type="number" value={form.max_discount} onChange={(v) => set({ max_discount: v })} placeholder="No cap" hint="Leave empty for no cap" />
            )}
            <TextField label="Minimum order (₦)" type="number" value={form.min_order} onChange={(v) => set({ min_order: v })} placeholder="0" />
            <TextField label="Total uses allowed" type="number" value={form.usage_limit} onChange={(v) => set({ usage_limit: v })} placeholder="Unlimited" hint="Leave empty for unlimited" />
            <TextField label="Uses per customer" type="number" value={form.per_user_limit} onChange={(v) => set({ per_user_limit: v })} placeholder="1" />
            <TextField label="First day" type="date" value={form.starts_on} onChange={(v) => set({ starts_on: v })} hint="Empty = starts now" />
            <TextField label="Last day" type="date" value={form.expires_on} onChange={(v) => set({ expires_on: v })} hint="Empty = never expires" />
            <ToggleField
              label="First order only"
              hint="Only customers who have never paid for an order can use it."
              checked={!!form.first_order_only}
              onChange={(v) => set({ first_order_only: v })}
            />
            <ToggleField
              label="Active"
              hint="Switch off to stop the code being accepted."
              checked={!!form.is_active}
              onChange={(v) => set({ is_active: v })}
            />
          </FieldGrid>
          <p className="text-[11px] text-gray-400">
            Whatever the discount, the customer always pays at least ₦100.
          </p>
        </FormModal>
      )}
    </div>
  )
}
