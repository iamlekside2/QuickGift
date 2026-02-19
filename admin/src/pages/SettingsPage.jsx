import { useState } from 'react'
import { Save, Globe, DollarSign, Truck, Bell, Shield, Percent } from 'lucide-react'

export default function SettingsPage() {
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

  return (
    <div className="max-w-3xl space-y-6">
      {/* General */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">General</h3>
            <p className="text-sm text-gray-500">Platform information</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform Name</label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => updateSetting('platformName', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => updateSetting('supportEmail', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
          </div>
        </div>
      </section>

      {/* Commission & Fees */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
            <Percent className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Commission & Fees</h3>
            <p className="text-sm text-gray-500">Revenue settings</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gift Commission (%)</label>
            <input
              type="number"
              value={settings.giftCommission}
              onChange={(e) => updateSetting('giftCommission', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">20-35% recommended</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Beauty Commission (%)</label>
            <input
              type="number"
              value={settings.beautyCommission}
              onChange={(e) => updateSetting('beautyCommission', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">15-25% recommended</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Min. Order Amount (₦)</label>
            <input
              type="number"
              value={settings.minOrderAmount}
              onChange={(e) => updateSetting('minOrderAmount', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Gift Fee (%)</label>
            <input
              type="number"
              value={settings.groupGiftFee}
              onChange={(e) => updateSetting('groupGiftFee', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Delivery</h3>
            <p className="text-sm text-gray-500">Delivery fee configuration</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Fee (₦)</label>
            <input
              type="number"
              value={settings.deliveryFeeBase}
              onChange={(e) => updateSetting('deliveryFeeBase', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Per Km (₦)</label>
            <input
              type="number"
              value={settings.deliveryFeePerKm}
              onChange={(e) => updateSetting('deliveryFeePerKm', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Express Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={settings.expressMultiplier}
              onChange={(e) => updateSetting('expressMultiplier', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500">Notification channels</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { key: 'enableWhatsApp', label: 'WhatsApp Notifications', desc: 'Send order updates via WhatsApp' },
            { key: 'enablePush', label: 'Push Notifications', desc: 'Mobile push notifications' },
            { key: 'enableSMS', label: 'SMS Notifications', desc: 'SMS fallback for non-WhatsApp users' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => updateSetting(item.key, !settings[item.key])}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings[item.key] ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[item.key] ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <button className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
        <Save className="w-4 h-4" />
        Save Settings
      </button>
    </div>
  )
}
