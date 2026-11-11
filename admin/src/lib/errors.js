// One place to turn an RTK Query / fetch error into a message for the user.
// The Node backend answers `{ message: string | string[] }`; `detail` is kept
// as a fallback for anything still shaped like the old FastAPI errors.

function asText(value) {
  if (Array.isArray(value)) {
    const parts = value
      .map((v) => (typeof v === 'string' ? v : v?.msg || v?.message || ''))
      .map((v) => String(v).trim())
      .filter(Boolean)
    return parts.join(', ')
  }
  return typeof value === 'string' ? value.trim() : ''
}

export function errMsg(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.data
  return asText(data?.message) || asText(data?.detail) || fallback
}
