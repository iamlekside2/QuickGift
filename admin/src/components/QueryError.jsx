import { AlertCircle, RefreshCw } from 'lucide-react'
import { errMsg } from '../lib/errors'

/** "The request failed" block with a Retry button, shown instead of an empty state. */
export function QueryError({ what = 'this data', error, onRetry, retrying = false }) {
  return (
    <div className="flex flex-col items-center gap-2" role="alert">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-700">Could not load {what}</p>
      <p className="text-xs text-gray-400 max-w-sm">
        {errMsg(error, 'The request failed. Check your connection and try again.')}
      </p>
      {onRetry && (
        <button type="button" onClick={() => onRetry()} disabled={retrying} className="btn-secondary mt-2">
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          Retry
        </button>
      )}
    </div>
  )
}

/** The same block as a full-width table row. */
export function ErrorRow({ colSpan, ...props }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center">
        <QueryError {...props} />
      </td>
    </tr>
  )
}
