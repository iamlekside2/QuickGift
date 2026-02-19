import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, Star, Loader2 } from 'lucide-react'
import { useGetProductsQuery, useGetCategoriesQuery } from '../services/api'

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const { data: productsData, isLoading } = useGetProductsQuery({
    category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
  })
  const { data: categoriesData } = useGetCategoriesQuery()

  const products = productsData?.items || productsData || []
  const categories = categoriesData || []

  const filtered = products.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString()

  const getStatusStyle = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-700'
    if (status === 'draft') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-500'
  }

  // Map category emoji
  const getCategoryEmoji = (catName) => {
    const map = { Cakes: '🎂', Flowers: '💐', Chocolates: '🍫', Hampers: '🧺', Personalized: '☕', Balloons: '🎈', Wine: '🍷' }
    for (const [key, emoji] of Object.entries(map)) {
      if (catName?.toLowerCase().includes(key.toLowerCase())) return emoji
    }
    return '🎁'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{products.length} products listed</p>
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
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-red-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-red-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📦</p>
          <p>No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gray-50 flex items-center justify-center">
                <span className="text-5xl">{getCategoryEmoji(product.category_name)}</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                  <span className={`ml-2 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(product.status || 'active')}`}>
                    {product.status || 'active'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{product.vendor_name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {product.rating || '—'} ({product.review_count || 0})
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
      )}
    </div>
  )
}
