import { X, Loader2 } from 'lucide-react'

/** Modern modal shell with a sticky header/footer and a scrollable body. */
export function FormModal({ title, subtitle, onClose, onSave, saving, saveLabel = 'Save changes', children }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4">{children}</div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onSave} disabled={saving} className="btn-primary flex-[2]">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Two-column grid for pairing fields; falls back to single column on phones. */
export function FieldGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

export function TextField({ label, value, onChange, placeholder, type = 'text', hint, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="input resize-none"
      />
    </div>
  )
}

export function SelectField({ label, value, onChange, options, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="select w-full">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function ToggleField({ label, hint, checked, onChange }) {
  return (
    <div className="sm:col-span-2 flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-[13px] font-medium text-gray-700">{label}</p>
        {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
