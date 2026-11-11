import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Search, Plus, Edit2, Trash2, Star, Loader2, X, Package } from 'lucide-react'
import { useGetAdminProductsQuery, useGetCategoriesQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '../services/api'
import { selectCurrentUser } from '../features/authSlice'
import { hasPerm } from '../lib/permissions'
import { errMsg } from '../lib/errors'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'

const PER_PAGE = 20

const STATUS_STYLES = {
  active: 'badge-green',
  draft: 'badge-yellow',
  inactive: 'badge-gray',
}

const STATUS_LABELS = {
  active: 'Active',
  draft: 'Draft',
  inactive: 'Inactive',
}

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
      setError(errMsg(err, isEdit ? 'Could not save the product' : 'Could not add the product'))
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Name *</label>
            <input value={form.name} onChange={set('name')} required className="input" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Price *</label>
              <input type="number" step="0.01" value={form.price} onChange={set('price')} required className="input" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Compare Price</label>
              <input type="number" step="0.01" value={form.compare_price} onChange={set('compare_price')} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Category *</label>
              <select value={form.category_id} onChange={set('category_id')} required className="select w-full">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Vendor *</label>
              <input value={form.vendor_name} onChange={set('vendor_name')} required className="input" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Image URL</label>
            <input value={form.image_url} onChange={set('image_url')} className="input" />
          </div>
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className="select">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-5 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={creating || updating} className="btn-primary flex-1">
              {creating || updating ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const user = useSelector(selectCurrentUser)
  const canManage = hasPerm(user, 'products.manage')

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalProduct, setModalProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const search = useDebouncedSearch(() => setPage(1))

  // The admin list returns every status, so drafts and inactive products stay
  // visible here (the public /products list only returns active ones).
  const { data: productsData, isLoading, isFetching, isError, error, refetch } = useGetAdminProductsQuery({
    search: search.query || undefined,
    status: statusFilter || undefined,
    category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
    page,
    per_page: PER_PAGE,
  })
  const { data: categoriesData } = useGetCategoriesQuery()
  const [deleteProduct] = useDeleteProductMutation()

  const products = productsData?.items || []
  const total = productsData?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)
  const categories = Array.isArray(categoriesData) ? categoriesData : []
  const colSpan = canManage ? 7 : 6

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString()

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setBusyId(product.id)
    try {
      await deleteProduct(product.id).unwrap()
    } catch (err) {
      alert(errMsg(err, 'Failed to delete product'))
    } finally {
      setBusyId(null)
    }
  }

  const openAdd = () => { setModalProduct({}); setShowModal(true) }
  const openEdit = (product) => { setModalProduct(product); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setModalProduct(null) }

  return (
    <div className="space-y-6 animate-fade-in">
      {showModal && canManage && <ProductModal product={modalProduct?.id ? modalProduct : null} categories={categories} onClose={closeModal} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Every product on the platform, including drafts and inactive ones</p>
        </div>
        {canManage && (
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search.input}
            onChange={(e) => search.onChange(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="select"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => { setCategoryFilter('all'); setPage(1) }}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
            categoryFilter === 'all'
              ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/20'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategoryFilter(cat.id); setPage(1) }}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
              categoryFilter === cat.id
                ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/20'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Price</th>
                <th className="table-header">Rating</th>
                <th className="table-header">Featured</th>
                <th className="table-header">Status</th>
                {canManage && <th className="table-header w-[80px]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={colSpan} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading products...</span>
                  </div>
                </td></tr>
              ) : isError ? (
                <ErrorRow colSpan={colSpan} what="products" error={error} onRetry={refetch} retrying={isFetching} />
              ) : products.length === 0 ? (
                <tr><td colSpan={colSpan} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No products found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                  </div>
                </td></tr>
              ) : (
                products.map((product) => {
                  const status = product.status || 'active'
                  return (
                    <tr key={product.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{product.vendor_name || ''}</div>
                      </td>
                      <td className="table-cell text-gray-600">{product.category_name || '—'}</td>
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">{formatPrice(product.price)}</div>
                        {product.compare_price ? (
                          <div className="text-xs text-gray-400 line-through mt-0.5">{formatPrice(product.compare_price)}</div>
                        ) : null}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{product.rating || '—'}</span>
                          <span className="text-gray-400 text-xs">({product.review_count || 0})</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        {product.is_featured ? (
                          <span className="badge badge-orange">Featured</span>
                        ) : (
                          <span className="text-xs text-gray-300">{'—'}</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${STATUS_STYLES[status] || 'badge-gray'}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="table-cell">
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => openEdit(product)}
                              title="Edit product"
                              className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              disabled={busyId === product.id}
                              title="Delete product"
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {busyId === product.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      )}
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
          label="total products"
          isFetching={isFetching}
        />
      </div>
    </div>
  )
}

