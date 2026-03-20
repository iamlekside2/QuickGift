import { useState } from 'react'
import { Save, Globe, Truck, Bell, Percent, CheckCircle2, Shield } from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    platformName: 'QuickGift',
    supportEmail: 'support@quickgift.ng',
    supportPhone: '+234 800 GIFT',
    giftCommission: 25,
    beautyCommission: 20,
    deliveryFeeBase: 1000,
    deliveryFeePerKm: 200,
    expressMultiplier: 2.5,
    minOrderAmount: 3000,
    groupGiftFee: 3,
    enableWhatsApp: true,
    enablePush: true,
    enableSMS: false,
    maintenanceMode: false,
  })

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your platform preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-slide-up">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved
            </div>
          )}
          <button onClick={handleSave} className="btn-primary">
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* General */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Globe className="w-[18px] h-[18px] text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">General</h3>
              <p className="text-xs text-gray-500">Platform information and branding</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateSetting('platformName', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </section>

        {/* Commission & Fees */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Percent className="w-[18px] h-[18px] text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Commission & Fees</h3>
              <p className="text-xs text-gray-500">Revenue and pricing configuration</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Gift Commission (%)</label>
              <input
                type="number"
                value={settings.giftCommission}
                onChange={(e) => updateSetting('giftCommission', Number(e.target.value))}
                className="input"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">20-35% recommended</p>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Beauty Commission (%)</label>
              <input
                type="number"
                value={settings.beautyCommission}
                onChange={(e) => updateSetting('beautyCommission', Number(e.target.value))}
                className="input"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">15-25% recommended</p>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Min. Order Amount ({'\u20A6'})</label>
              <input
                type="number"
                value={settings.minOrderAmount}
                onChange={(e) => updateSetting('minOrderAmount', Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Group Gift Fee (%)</label>
              <input
                type="number"
                value={settings.groupGiftFee}
                onChange={(e) => updateSetting('groupGiftFee', Number(e.target.value))}
                className="input"
              />
            </div>
          </div>
        </section>

        {/* Delivery */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Truck className="w-[18px] h-[18px] text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Delivery</h3>
              <p className="text-xs text-gray-500">Delivery fee configuration</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Base Fee ({'\u20A6'})</label>
              <input
                type="number"
                value={settings.deliveryFeeBase}
                onChange={(e) => updateSetting('deliveryFeeBase', Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Per Km ({'\u20A6'})</label>
              <input
                type="number"
                value={settings.deliveryFeePerKm}
                onChange={(e) => updateSetting('deliveryFeePerKm', Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Express Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={settings.expressMultiplier}
                onChange={(e) => updateSetting('expressMultiplier', Number(e.target.value))}
                className="input"
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <Bell className="w-[18px] h-[18px] text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">Configure notification channels</p>
            </div>
          </div>
          <div className="space-y-1">
            {[
              { key: 'enableWhatsApp', label: 'WhatsApp Notifications', desc: 'Send order updates via WhatsApp' },
              { key: 'enablePush', label: 'Push Notifications', desc: 'Mobile push notifications' },
              { key: 'enableSMS', label: 'SMS Notifications', desc: 'SMS fallback for non-WhatsApp users' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => updateSetting(item.key, !settings[item.key])}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings[item.key] ? 'bg-teal-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings[item.key] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Maintenance Mode */}
        <section className="card p-6 border-red-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <Shield className="w-[18px] h-[18px] text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Danger Zone</h3>
              <p className="text-xs text-gray-500">Critical platform settings</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 px-1">
            <div>
              <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
              <p className="text-xs text-gray-500 mt-0.5">Temporarily disable the platform for maintenance</p>
            </div>
            <button
              onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.maintenanceMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
