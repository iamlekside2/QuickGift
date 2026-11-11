import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

/**
 * Table footer shared by every list page: a row count on the left and
 * prev / "Page X of Y" / next on the right. Works for any number of pages.
 *
 * It also pulls `page` back into range: when the last rows of the last page are
 * deleted the server reports fewer pages than the one being shown, which used
 * to leave an empty table with no pager to get out of it.
 */
export default function Pagination({ page, totalPages, onPageChange, total, label = 'results', isFetching = false }) {
  const pages = Math.max(1, Number(totalPages) || 0)
  const current = Math.min(Math.max(1, page), pages)

  useEffect(() => {
    if (!isFetching && page > pages) onPageChange(pages)
  }, [isFetching, page, pages, onPageChange])

  return (
    <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3">
      <span className="text-xs text-gray-500">
        {isFetching && <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />}
        {total ?? 0} {label}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            aria-label="Previous page"
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-500 px-2 whitespace-nowrap">
            Page {current} of {pages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(current + 1)}
            disabled={current >= pages}
            aria-label="Next page"
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  )
}
