// One place that turns a failed request into a message a person can read.
//
// The API always answers errors as `{ message: string | string[] }`. Older
// builds of the backend used `detail`, so that is still read as a fallback.
// The raw axios text ("Request failed with status code 400") is never shown.

const clean = (value) => {
  if (Array.isArray(value)) {
    const parts = value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
    return parts.length ? parts.join('\n') : null;
  }
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
};

/**
 * @param {any} err       The caught error (usually an axios error).
 * @param {string} fallback  What to show when the server gave no message.
 */
export function apiError(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  const fromServer = clean(data?.message) || clean(data?.detail);
  if (fromServer) return fromServer;

  // No response at all: the request never reached the server.
  if (err && !err.response && (err.code === 'ECONNABORTED' || err.message === 'Network Error' || err.request)) {
    return err.code === 'ECONNABORTED'
      ? 'The server took too long to respond. Please try again.'
      : 'Could not reach the server. Check your connection and try again.';
  }
  return fallback;
}

/** HTTP status of a failed request, or null when there was no response. */
export function apiStatus(err) {
  return err?.response?.status ?? null;
}

export default apiError;
