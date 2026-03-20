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
            <input value={form.name} onChange={set('name')} required className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" step="0.01" value={form.price} onChange={set('price')} required className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price</label>
              <input type="number" step="0.01" value={form.compare_price} onChange={set('compare_price')} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category_id} onChange={set('category_id')} required className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-teal-500 outline-none">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
              <input value={form.vendor_name} onChange={set('vendor_name')} required className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input value={form.image_url} onChange={set('image_url')} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
          </div>
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={set('status')} className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-teal-500 outline-none">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-5 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={creating || updating} className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
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
  const [page, setPage] = useState(1)
  const [modalProduct, setModalProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const { data: productsData, isLoading } = useGetProductsQuery({
    category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
    page,
    per_page: 20,
  })
  const { data: categoriesData } = useGetCategoriesQuery()
  const [deleteProduct] = useDeleteProductMutation()

  const products = productsData?.items || productsData || []
  const total = productsData?.total || products.length
  const totalPages = Math.ceil(total / 20)
  const categories = categoriesData || []

  const filtered = products.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatPrice = (price) => '\u20A6' + (price || 0).toLocaleString()

  const getStatusStyle = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-700'
    if (status === 'draft') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-500'
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
          <p className="text-sm text-gray-500">{total} products listed</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-colors">
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setCategoryFilter('all'); setPage(1) }}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-teal-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategoryFilter(cat.id); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-1">No products found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-400">{product.vendor_name || ''}</div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">{product.category_name || '\u2014'}</td>
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</div>
                      {product.compare_price && (
                        <div className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</div>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {product.rating || '\u2014'} ({product.review_count || 0})
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      {product.is_featured ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Featured</span>
                      ) : (
                        <span className="text-xs text-gray-400">\u2014</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(product.status || 'active')}`}>
                        {product.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {filtered.length} of {total} products</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-lg ${page === p ? 'bg-teal-50 text-teal-600 font-medium' : 'hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
