import { useState } from 'react'
import { Search, Download, Loader2, ArrowUpRight, ArrowDownLeft, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetAdminTransactionsQuery } from '../services/api'

const TYPE_STYLES = {
  credit: 'badge-green',
  debit: 'badge-red',
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useGetAdminTransactionsQuery({
    type: typeFilter || undefined,
    page,
    per_page: 20,
  })

  const transactions = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const filtered = transactions.filter(t => {
    if (search && !t.reference?.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatPrice = (price) => '\u20A6' + (price || 0).toLocaleString()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">All wallet transactions across the platform</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reference or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="select"
        >
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">Type</th>
                <th className="table-header">Reference</th>
                <th className="table-header">Description</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Balance After</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading transactions...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No transactions found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'credit' ? 'bg-emerald-50' : 'bg-red-50'
                        }`}>
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <span className={`text-xs font-semibold capitalize ${
                          tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-gray-600">{tx.reference}</span>
                    </td>
                    <td className="table-cell text-gray-700 text-sm">{tx.description || '\u2014'}</td>
                    <td className="table-cell">
                      <span className={`font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                      </span>
                    </td>
                    <td className="table-cell text-gray-600">{formatPrice(tx.balance_after)}</td>
                    <td className="table-cell">
                      <span className={`badge ${tx.status === 'completed' ? 'badge-green' : tx.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 text-sm">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />}
            {total} total transactions
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === p
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
