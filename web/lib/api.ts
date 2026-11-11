// The QuickGift API. Local development points at the local server through
// NEXT_PUBLIC_API_URL in .env.development; everywhere else uses the live API.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://quickgift-node-api.onrender.com/api/v1';

export interface ApiResult<T = unknown> {
  status: number;
  data: T;
}

/** Calls the API and always resolves with the status and the parsed JSON body ({} if none). */
export async function api<T = Record<string, unknown>>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  const res = await fetch(API_BASE + path, {
    method,
    headers: body
      ? { 'Content-Type': 'application/json', Accept: 'application/json' }
      : { Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

/** The server answers errors as JSON { message: string | string[] }. */
export function serverMessage(data: unknown, fallback: string): string {
  const m = (data as { message?: unknown } | null)?.message;
  const text = Array.isArray(m) ? m.join(' ') : m;
  return typeof text === 'string' && text.trim() ? text.trim() : fallback;
}

export const naira = (n: unknown) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
