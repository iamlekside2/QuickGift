import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, MoreHorizontal, Star } from 'lucide-react'

const PRODUCTS = [
  { id: 1, name: 'Red Velvet Cake', category: 'Cakes', vendor: 'Sweet Treats Lagos', price: 15000, rating: 4.8, orders: 124, status: 'active', image: '🎂' },
  { id: 2, name: 'Rose Bouquet (24 stems)', category: 'Flowers', vendor: 'Bloom Nigeria', price: 25000, rating: 4.9, orders: 89, status: 'active', image: '💐' },
  { id: 3, name: 'Luxury Chocolate Box', category: 'Chocolates', vendor: 'ChocoLux', price: 12000, rating: 4.7, orders: 56, status: 'active', image: '🍫' },
  { id: 4, name: 'Birthday Hamper Deluxe', category: 'Hampers', vendor: 'GiftBox NG', price: 35000, rating: 4.9, orders: 201, status: 'active', image: '🧺' },
  { id: 5, name: 'Custom Photo Mug', category: 'Personalized', vendor: 'PrintHub', price: 5000, rating: 4.5, orders: 78, status: 'active', image: '☕' },
  { id: 6, name: 'Balloon Arch Set', category: 'Balloons', vendor: 'Party Central', price: 18000, rating: 4.6, orders: 42, status: 'draft', image: '🎈' },
  { id: 7, name: 'Fruit & Wine Hamper', category: 'Hampers', vendor: 'GiftBox NG', price: 28000, rating: 4.8, orders: 67, status: 'active', image: '🍷' },
  { id: 8, name: 'Teddy Bear XL', category: 'Personalized', vendor: 'Softie NG', price: 8000, rating: 4.4, orders: 33, status: 'inactive', image: '🧸' },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const categories = ['all', ...new Set(PRODUCTS.map(p => p.category))]

  const filtered = PRODUCTS.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    return true
  })

  const formatPrice = (price) => '₦' + price.toLocaleString()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{PRODUCTS.length} products listed</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-red-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-36 bg-gray-50 flex items-center justify-center">
              <span className="text-5xl">{product.image}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                <span className={`ml-2 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  product.status === 'active' ? 'bg-green-100 text-green-700' :
                  product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {product.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{product.vendor}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {product.rating} ({product.orders})
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
