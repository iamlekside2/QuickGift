/**
 * Tiny in-memory sliding-window limiter. Good enough for a single API instance
 * (Render runs one); it resets on restart and is not shared across instances,
 * so treat it as abuse damping, not a hard security boundary.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  private recent(key: string): number[] {
    const cutoff = Date.now() - this.windowMs;
    const list = (this.hits.get(key) || []).filter((t) => t > cutoff);
    if (list.length) this.hits.set(key, list);
    else this.hits.delete(key);
    return list;
  }

  /** True while the key has used up its allowance for the current window. */
  isBlocked(key: string): boolean {
    return this.recent(key).length >= this.limit;
  }

  /** Record one event against the key. */
  record(key: string): void {
    const list = this.recent(key);
    list.push(Date.now());
    this.hits.set(key, list);
    // Opportunistic cleanup so the map cannot grow without bound.
    if (this.hits.size > 5000) {
      for (const k of this.hits.keys()) this.recent(k);
    }
  }

  /** Record an event and report whether the key is still within its allowance. */
  allow(key: string): boolean {
    if (this.isBlocked(key)) return false;
    this.record(key);
    return true;
  }

  reset(key: string): void {
    this.hits.delete(key);
  }
}

/** Best-effort client IP behind Render's proxy. */
export function clientIp(req: any): string {
  const fwd = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req?.ip || req?.socket?.remoteAddress || 'unknown';
}
