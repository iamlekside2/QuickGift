import { useState } from 'react'
import { Search, Plus, Star, MapPin, Check, X, MoreHorizontal, Shield } from 'lucide-react'

const PROVIDERS = [
  { id: 1, name: 'Amara Nails', service: 'Nail Technician', location: 'Lekki, Lagos', rating: 4.9, reviews: 230, bookings: 312, revenue: 1560000, status: 'verified', plan: 'Pro', available: true },
  { id: 2, name: 'Bimpe Hair Studio', service: 'Hair Stylist', location: 'VI, Lagos', rating: 4.8, reviews: 189, bookings: 245, revenue: 1960000, status: 'verified', plan: 'Elite', available: true },
  { id: 3, name: 'Tolu MUA', service: 'Makeup Artist', location: 'Ikeja, Lagos', rating: 4.9, reviews: 310, bookings: 198, revenue: 2970000, status: 'verified', plan: 'Pro', available: false },
  { id: 4, name: 'Fresh Cuts Abuja', service: 'Barber', location: 'Wuse, Abuja', rating: 4.7, reviews: 156, bookings: 420, revenue: 1260000, status: 'verified', plan: 'Free', available: true },
  { id: 5, name: 'Nkechi Beauty', service: 'Waxing Specialist', location: 'Surulere, Lagos', rating: 4.6, reviews: 78, bookings: 89, revenue: 445000, status: 'pending', plan: 'Free', available: true },
  { id: 6, name: 'Ada Glow', service: 'Massage Therapist', location: 'Garki, Abuja', rating: 4.5, reviews: 45, bookings: 56, revenue: 280000, status: 'pending', plan: 'Free', available: false },
]

const PLAN_STYLES = {
  Free: 'bg-gray-100 text-gray-600',
  Pro: 'bg-blue-100 text-blue-600',
  Elite: 'bg-purple-100 text-purple-600',
}

export default function ProvidersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = PROVIDERS.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const formatRevenue = (amount) => '₦' + (amount / 1000000).toFixed(1) + 'M'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{PROVIDERS.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{PROVIDERS.filter(p => p.status === 'verified').length}</p>
            <p className="text-xs text-gray-500">Verified</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{PROVIDERS.filter(p => p.status === 'pending').length}</p>
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
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Approval</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((provider) => (
          <div key={provider.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600">{provider.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{provider.name}</h3>
                    {provider.status === 'verified' && <Shield className="w-4 h-4 text-blue-500" />}
                  </div>
                  <p className="text-xs text-gray-500">{provider.service}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_STYLES[provider.plan]}`}>
                {provider.plan}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {provider.location}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {provider.rating} ({provider.reviews})
              </div>
              <div className={`flex items-center gap-1 ${provider.available ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${provider.available ? 'bg-green-500' : 'bg-gray-300'}`} />
                {provider.available ? 'Online' : 'Offline'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">Bookings</p>
                <p className="text-sm font-bold text-gray-900">{provider.bookings}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-sm font-bold text-gray-900">{formatRevenue(provider.revenue)}</p>
              </div>
            </div>

            {provider.status === 'pending' ? (
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
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
        ))}
      </div>
    </div>
  )
}
