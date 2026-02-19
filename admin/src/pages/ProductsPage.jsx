import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, Star, Loader2, X } from 'lucide-react'
import { useGetProductsQuery, useGetCategoriesQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '../services/api'

function ProductModal({ product, categories, onClose }) {
  const [createProduct, { isLoading: creating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation()
  const isEdit = !!product

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    compare_price: product?.compare_price || '',
    category_id: product?.category_id || '',
    vendor_name: product?.vendor_name || '',
    image_url: product?.image_url || '',
    status: product?.status || 'active',
    is_featured: product?.is_featured || false,
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const body = {
      ...form,
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
    }
    try {
      if (isEdit) {
        await updateProduct({ id: product.id, ...body }).unwrap()
      } else {
        await createProduct(body).unwrap()
      }
      onClose()
    } catch (err) {
      setError(err?.data?.detail || 'Something went wrong')
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input value={form.name} onChange={set('name')} required className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" step="0.01" value={form.price} onChange={set('price')} required className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price</label>
              <input type="number" step="0.01" value={form.compare_price} onChange={set('compare_price')} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category_id} onChange={set('category_id')} required className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-red-500 outline-none">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
              <input value={form.vendor_name} onChange={set('vendor_name')} required className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input value={form.image_url} onChange={set('image_url')} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none" />
          </div>
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={set('status')} className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-red-500 outline-none">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-5 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={creating || updating} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              {creating || updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [modalProduct, setModalProduct] = useState(null) // null=closed, {}=new, {id,...}=edit
  const [showModal, setShowModal] = useState(false)

  const { data: productsData, isLoading } = useGetProductsQuery({
    category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
  })
  const { data: categoriesData } = useGetCategoriesQuery()
  const [deleteProduct] = useDeleteProductMutation()

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

  const getCategoryEmoji = (catName) => {
    const map = { Cakes: '🎂', Flowers: '💐', Chocolates: '🍫', Hampers: '🧺', Personalized: '☕', Balloons: '🎈', Wine: '🍷' }
    for (const [key, emoji] of Object.entries(map)) {
      if (catName?.toLowerCase().includes(key.toLowerCase())) return emoji
    }
    return '🎁'
  }

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return
    try {
      await deleteProduct(product.id).unwrap()
    } catch (err) {
      alert(err?.data?.detail || 'Failed to delete product')
    }
  }

  const openAdd = () => { setModalProduct({}); setShowModal(true) }
  const openEdit = (product) => { setModalProduct(product); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setModalProduct(null) }

  return (
    <div className="space-y-6">
      {showModal && <ProductModal product={modalProduct?.id ? modalProduct : null} categories={categories} onClose={closeModal} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{products.length} products listed</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
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
                  <button onClick={() => openEdit(product)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button onClick={() => handleDelete(product)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
