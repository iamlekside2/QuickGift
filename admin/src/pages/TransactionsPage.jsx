import { useState } from 'react'
import { Search, Download, Loader2, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react'
import { useGetAdminTransactionsQuery } from '../services/api'
import { downloadCsv, csvDate } from '../lib/csv'
import { useDebouncedSearch } from '../lib/useDebouncedSearch'
import Pagination from '../components/Pagination'
import { ErrorRow } from '../components/QueryError'

const PER_PAGE = 20

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const search = useDebouncedSearch(() => setPage(1))

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminTransactionsQuery({
    type: typeFilter || undefined,
    search: search.query || undefined,
    page,
    per_page: PER_PAGE,
  })

  const transactions = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  const formatPrice = (price) => '₦' + (price || 0).toLocaleString()

  const handleExport = () => {
    if (!transactions.length) return
    downloadCsv(
      'quickgift-transactions',
      ['Type', 'Reference', 'Description', 'Amount', 'Balance after', 'Status', 'Date'],
      transactions.map((t) => [
        t.type, t.reference, t.description,
        Number(t.amount) || 0, Number(t.balance_after) || 0, t.status, csvDate(t.created_at),
      ]),
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">All wallet transactions across the platform</p>
        </div>
        <button
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExport}
          disabled={!transactions.length}
          title="Downloads the rows on this page as a CSV file"
        >
          <Download className="w-4 h-4" />
          Export page
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search.input}
            onChange={(e) => search.onChange(e.target.value)}
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
              ) : isError ? (
                <ErrorRow colSpan={7} what="transactions" error={error} onRetry={refetch} retrying={isFetching} />
              ) : transactions.length === 0 ? (
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
                transactions.map((tx) => (
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
                    <td className="table-cell text-gray-700 text-sm">{tx.description || '—'}</td>
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

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          label="total transactions"
          isFetching={isFetching}
        />
      </div>
    </div>
  )
}
