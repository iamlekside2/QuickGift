import { useState, useEffect } from 'react'
import {
  Save, Globe, Percent, CheckCircle2, Shield, Loader2, Banknote, Plug, Check, X,
} from 'lucide-react'
import { useGetAdminSettingsQuery, useUpdateAdminSettingsMutation } from '../services/api'

const EDITABLE = [
  'platform_name', 'support_email', 'support_phone',
  'gift_commission', 'beauty_commission', 'min_order_amount',
  'payout_hold_hours', 'maintenance_mode',
]

export default function SettingsPage() {
  const { data, isLoading } = useGetAdminSettingsQuery()
  const [save, { isLoading: saving }] = useUpdateAdminSettingsMutation()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (data?.settings) setForm(data.settings)
  }, [data])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    setError('')
    try {
      const payload = {}
      for (const k of EDITABLE) if (form[k] !== undefined) payload[k] = form[k]
      await save(payload).unwrap()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e?.data?.message || 'Could not save settings')
    }
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    )
  }

  const integrations = data?.integrations || {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Platform configuration. Changes take effect immediately.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-slide-up">
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </div>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-3xl p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>
      )}

      <div className="max-w-3xl space-y-6">
        {/* General */}
        <Section icon={Globe} tint="gray" title="General" subtitle="Platform information shown to customers">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Platform name">
              <input type="text" value={form.platform_name ?? ''} onChange={(e) => set('platform_name', e.target.value)} className="input" />
            </Field>
            <Field label="Support email">
              <input type="email" value={form.support_email ?? ''} onChange={(e) => set('support_email', e.target.value)} placeholder="support@quickgift.ng" className="input" />
            </Field>
            <Field label="Support phone">
              <input type="text" value={form.support_phone ?? ''} onChange={(e) => set('support_phone', e.target.value)} placeholder="+234..." className="input" />
            </Field>
          </div>
        </Section>

        {/* Commission & orders */}
        <Section icon={Percent} tint="emerald" title="Commission & orders" subtitle="What QuickGift earns and the order floor">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gift commission (%)" hint="Taken from each paid gift order">
              <input type="number" min="0" max="100" step="0.5" value={form.gift_commission ?? 0} onChange={(e) => set('gift_commission', Number(e.target.value))} className="input" />
            </Field>
            <Field label="Services commission (%)" hint="Taken from each paid booking">
              <input type="number" min="0" max="100" step="0.5" value={form.beauty_commission ?? 0} onChange={(e) => set('beauty_commission', Number(e.target.value))} className="input" />
            </Field>
            <Field label={'Minimum order amount (₦)'} hint="0 = no minimum">
              <input type="number" min="0" step="100" value={form.min_order_amount ?? 0} onChange={(e) => set('min_order_amount', Number(e.target.value))} className="input" />
            </Field>
          </div>
        </Section>

        {/* Payouts */}
        <Section icon={Banknote} tint="blue" title="Payouts" subtitle="How long provider earnings are held before release">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Payout hold (hours)" hint="Held after an order completes before it can be released">
              <input type="number" min="0" max="720" step="1" value={form.payout_hold_hours ?? 0} onChange={(e) => set('payout_hold_hours', Number(e.target.value))} className="input" />
            </Field>
          </div>
        </Section>

        {/* Integrations (read-only) */}
        <Section icon={Plug} tint="purple" title="Integrations" subtitle="Managed in the Render environment (read-only here)">
          <div className="space-y-1">
            <IntegrationRow
              name="Payments — Paystack"
              status={integrations.payments?.configured}
              note={integrations.payments ? `${integrations.payments.mode} mode` : ''}
            />
            <IntegrationRow name="Email — Brevo" status={integrations.email?.configured} note={integrations.email?.from || ''} />
            <IntegrationRow name="SMS — Termii" status={integrations.sms?.configured} note={integrations.sms?.configured ? '' : 'not funded yet'} />
            <IntegrationRow name="Media — Cloudinary" status={integrations.media?.configured} />
            <IntegrationRow
              name="Delivery — Kwik"
              status={integrations.delivery?.configured}
              note={integrations.delivery ? `${integrations.delivery.mode} mode` : ''}
            />
          </div>
          {integrations.admin_notify_email && (
            <p className="text-[11px] text-gray-400 mt-3">Admin alerts are sent to {integrations.admin_notify_email}</p>
          )}
        </Section>

        {/* Danger zone */}
        <Section icon={Shield} tint="red" title="Danger zone" subtitle="Critical platform controls" danger>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-900">Maintenance mode</p>
              <p className="text-xs text-gray-500 mt-0.5">Flags the platform as under maintenance for the app to check.</p>
            </div>
            <Toggle checked={!!form.maintenance_mode} danger onChange={(v) => set('maintenance_mode', v)} />
          </div>
        </Section>
      </div>
    </div>
  )
}

const TINTS = {
  gray: 'bg-gray-100 text-gray-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  red: 'bg-red-50 text-red-600',
}

function Section({ icon: Icon, tint, title, subtitle, children, danger }) {
  return (
    <section className={`card p-6 ${danger ? 'border-red-100' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${TINTS[tint]}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}

function IntegrationRow({ name, status, note }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${status ? 'bg-emerald-50' : 'bg-gray-100'}`}>
          {status ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
        </span>
        <span className="text-sm text-gray-800">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        {note && <span className="text-[11px] text-gray-400 capitalize">{note}</span>}
        <span className={`badge ${status ? 'badge-green' : 'badge-gray'}`}>{status ? 'Connected' : 'Not set'}</span>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, danger }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? (danger ? 'bg-red-500' : 'bg-teal-500') : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}
