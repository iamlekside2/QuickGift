import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { AuditService } from './audit.service';
import { paging } from './paging';

// Nigeria is UTC+1 all year: a promo's first and last day are Lagos days.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
// An unpaid order holds its promo slot for this long, then stops counting.
export const PROMO_HOLD_MINUTES = 45;
// ...and can only be paid for this long, so a held slot is never paid late.
export const PROMO_PAY_MINUTES = 30;
// Whatever the discount, the customer always pays at least this much.
const MIN_PAYABLE = 100;

interface PromoRow {
  id: string;
  code: string;
  description: string | null;
  kind: 'percent' | 'fixed';
  value: number;
  max_discount: number | null;
  min_order: number;
  usage_limit: number | null;
  per_user_limit: number;
  first_order_only: boolean;
  starts_at: Date | null;
  expires_at: Date | null;
  is_active: boolean;
  created_at: Date;
}

interface Actor {
  user_id: string;
  role: string;
}

type Runner = (sql: string, params?: any[]) => Promise<any[]>;

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-US')}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** 'YYYY-MM-DD HH:MM:SS' in UTC, the form a `timestamp` column takes as text. */
const sqlTime = (ms: number) => new Date(ms).toISOString().replace('T', ' ').slice(0, 19);

/** A real calendar day as UTC-midnight ms, or null. */
function dayMs(raw: unknown): number | null {
  const day = String(raw ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const at = Date.parse(day + 'T00:00:00Z');
  if (Number.isNaN(at) || new Date(at).toISOString().slice(0, 10) !== day) return null;
  return at;
}

/** The Lagos calendar day a stored instant falls on, as YYYY-MM-DD. */
const lagosDay = (d: Date | null) =>
  d ? new Date(new Date(d).getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10) : null;

/**
 * Promo codes for gift orders.
 *
 * The discount comes off what the customer pays; sellers are paid on the full
 * item price, so QuickGift carries the cost of every code.
 *
 * A code is spent by a `promo_redemptions` row tied to the order. It counts
 * towards the limits while that order is paid, or for PROMO_HOLD_MINUTES while
 * it is still waiting for payment. A cancelled or refunded order frees the
 * slot again with no extra bookkeeping. The promo row is locked while a
 * redemption is written, so two checkouts cannot both take the last use.
 */
@Injectable()
export class PromoService implements OnModuleInit {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id               VARCHAR PRIMARY KEY,
        code             VARCHAR(32) NOT NULL UNIQUE,
        description      TEXT,
        kind             VARCHAR(8) NOT NULL,
        value            DOUBLE PRECISION NOT NULL,
        max_discount     DOUBLE PRECISION,
        min_order        DOUBLE PRECISION NOT NULL DEFAULT 0,
        usage_limit      INT,
        per_user_limit   INT NOT NULL DEFAULT 1,
        first_order_only BOOLEAN NOT NULL DEFAULT false,
        starts_at        TIMESTAMP,
        expires_at       TIMESTAMP,
        is_active        BOOLEAN NOT NULL DEFAULT true,
        created_by       VARCHAR,
        created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS promo_redemptions (
        id         VARCHAR PRIMARY KEY,
        promo_id   VARCHAR NOT NULL,
        user_id    VARCHAR NOT NULL,
        order_id   VARCHAR NOT NULL UNIQUE,
        amount     DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS ix_promo_redemptions_promo ON promo_redemptions (promo_id)`,
    );
    await this.db.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS discount   DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS promo_code VARCHAR(32)
    `);
  }

  normalize(raw: unknown): string {
    return String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
  }

  private discountFor(promo: PromoRow, subtotal: number): number {
    let d = promo.kind === 'percent' ? subtotal * (Number(promo.value) / 100) : Number(promo.value);
    if (promo.max_discount !== null && promo.max_discount !== undefined) {
      d = Math.min(d, Number(promo.max_discount));
    }
    d = Math.min(d, subtotal - MIN_PAYABLE);
    return d > 0 ? round2(d) : 0;
  }

  /**
   * Works out whether `userId` may use `rawCode` on an order of `subtotal`,
   * and what it is worth. Throws a BadRequestException that says why not.
   * With `lock`, the promo row is locked for the rest of the transaction.
   */
  private async evaluate(run: Runner, userId: string, rawCode: unknown, subtotal: number, lock: boolean) {
    const invalid = new BadRequestException('This promo code is not valid');
    const code = this.normalize(rawCode);
    if (code.length < 3) throw invalid;
    const promo: PromoRow | undefined = (
      await run(`SELECT * FROM promo_codes WHERE code = $1${lock ? ' FOR UPDATE' : ''}`, [code])
    )[0];
    if (!promo || !promo.is_active) throw invalid;

    const now = Date.now();
    if (promo.starts_at && new Date(promo.starts_at).getTime() > now) throw invalid;
    if (promo.expires_at && new Date(promo.expires_at).getTime() < now) {
      throw new BadRequestException('This promo code has expired');
    }
    if (subtotal < Number(promo.min_order)) {
      throw new BadRequestException(
        `Spend at least ${naira(Number(promo.min_order))} to use this code`,
      );
    }

    const used = (
      await run(
        `SELECT count(*)::int AS total,
                (count(*) FILTER (WHERE r.user_id = $2))::int AS mine
         FROM promo_redemptions r JOIN orders o ON o.id = r.order_id
         WHERE r.promo_id = $1 AND o.status <> 'cancelled'
           AND (o.payment_status = 'paid'
                OR (o.payment_status = 'pending'
                    AND r.created_at > NOW() - make_interval(mins => $3)))`,
        [promo.id, userId, PROMO_HOLD_MINUTES],
      )
    )[0];
    if (promo.usage_limit !== null && used.total >= promo.usage_limit) {
      throw new BadRequestException('This promo code has been fully used');
    }
    if (used.mine >= promo.per_user_limit) {
      throw new BadRequestException('You have already used this promo code');
    }
    if (promo.first_order_only) {
      const bought = (
        await run(`SELECT 1 FROM orders WHERE user_id = $1 AND payment_status = 'paid' LIMIT 1`, [userId])
      )[0];
      if (bought) throw new BadRequestException('This code is for first orders only');
    }

    const discount = this.discountFor(promo, subtotal);
    if (!(discount > 0)) {
      throw new BadRequestException('This code does not reduce the price of this order');
    }
    return { promo, discount };
  }

  /** POST /promos/validate: a preview for the cart. Never spends the code. */
  async preview(userId: string, rawCode: unknown, rawSubtotal: unknown) {
    const subtotal = Number(rawSubtotal);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return { valid: false, message: 'Add something to your cart first' };
    }
    try {
      const { promo, discount } = await this.evaluate(
        (sql, params) => this.db.query(sql, params),
        userId,
        rawCode,
        subtotal,
        false,
      );
      return { valid: true, code: promo.code, discount, description: promo.description };
    } catch (err: any) {
      if (err instanceof BadRequestException) return { valid: false, message: err.message };
      throw err;
    }
  }

  /**
   * Spends the code on `orderId` inside the order's own transaction. Throws
   * (rolling the order back) if the code cannot be used after all.
   */
  async redeem(client: PoolClient, userId: string, rawCode: unknown, subtotal: number, orderId: string) {
    const { promo, discount } = await this.evaluate(
      async (sql, params) => (await client.query(sql, params)).rows,
      userId,
      rawCode,
      subtotal,
      true,
    );
    await client.query(
      `INSERT INTO promo_redemptions (id, promo_id, user_id, order_id, amount, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [randomUUID(), promo.id, userId, orderId, discount],
    );
    return { code: promo.code, discount };
  }

  // ---- admin ----

  private present(row: any) {
    return {
      id: row.id,
      code: row.code,
      description: row.description,
      kind: row.kind,
      value: Number(row.value),
      max_discount: row.max_discount === null ? null : Number(row.max_discount),
      min_order: Number(row.min_order),
      usage_limit: row.usage_limit,
      per_user_limit: row.per_user_limit,
      first_order_only: row.first_order_only,
      starts_on: lagosDay(row.starts_at),
      expires_on: lagosDay(row.expires_at),
      is_active: row.is_active,
      expired: !!row.expires_at && new Date(row.expires_at).getTime() < Date.now(),
      used_count: Number(row.used_count ?? 0),
      total_discount: Number(row.total_discount ?? 0),
      created_at: row.created_at,
    };
  }

  private static readonly WITH_USAGE = `
    SELECT p.*,
      (SELECT count(*)::int FROM promo_redemptions r JOIN orders o ON o.id = r.order_id
        WHERE r.promo_id = p.id AND o.payment_status = 'paid') AS used_count,
      (SELECT COALESCE(sum(r.amount), 0) FROM promo_redemptions r JOIN orders o ON o.id = r.order_id
        WHERE r.promo_id = p.id AND o.payment_status = 'paid') AS total_discount
    FROM promo_codes p`;

  async adminList(q: any) {
    const { page, perPage, offset } = paging(q);
    const where: string[] = [];
    const params: any[] = [];
    if (q?.search) {
      params.push('%' + String(q.search).trim().replace(/[\\%_]/g, (c) => '\\' + c) + '%');
      where.push(`(p.code ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (
      await this.db.queryOne<{ n: number }>(
        `SELECT count(*)::int AS n FROM promo_codes p ${whereSql}`,
        params,
      )
    )?.n ?? 0;
    const rows = await this.db.query(
      `${PromoService.WITH_USAGE} ${whereSql}
       ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPage, offset],
    );
    return { items: rows.map((r) => this.present(r)), total, page, per_page: perPage };
  }

  /** Validates the fields present in `data`; returns column -> value. */
  private clean(data: any, partial: boolean, current?: PromoRow) {
    const out: Record<string, any> = {};
    const has = (k: string) => data && data[k] !== undefined;
    const money = (v: any, label: string, max = 10_000_000) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > max) {
        throw new BadRequestException(`${label} is not a valid amount`);
      }
      return round2(n);
    };
    const count = (v: any, label: string, min: number) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > 1_000_000) {
        throw new BadRequestException(`${label} must be a whole number of ${min} or more`);
      }
      return n;
    };

    if (!partial) {
      const code = this.normalize(data?.code);
      if (code.length < 3) {
        throw new BadRequestException('A code needs at least 3 letters or numbers');
      }
      out.code = code;
    }
    if (has('description')) out.description = String(data.description ?? '').trim().slice(0, 200) || null;

    if (has('kind') || !partial) {
      if (data?.kind !== 'percent' && data?.kind !== 'fixed') {
        throw new BadRequestException('Choose a percentage or a fixed amount');
      }
      out.kind = data.kind;
    }
    if (has('value') || !partial) {
      const kind = out.kind ?? current?.kind;
      const n = Number(data?.value);
      if (!Number.isFinite(n) || n <= 0) throw new BadRequestException('Enter how much the code takes off');
      if (kind === 'percent' && n > 100) throw new BadRequestException('A percentage cannot be more than 100');
      out.value = round2(n);
    } else if (out.kind === 'percent' && current && Number(current.value) > 100) {
      throw new BadRequestException('A percentage cannot be more than 100');
    }
    if (has('max_discount')) {
      out.max_discount =
        data.max_discount === null || data.max_discount === '' ? null : money(data.max_discount, 'Maximum discount');
    }
    if (has('min_order')) out.min_order = money(data.min_order ?? 0, 'Minimum order');
    if (has('usage_limit')) {
      out.usage_limit =
        data.usage_limit === null || data.usage_limit === '' ? null : count(data.usage_limit, 'Total uses', 1);
    }
    if (has('per_user_limit')) out.per_user_limit = count(data.per_user_limit, 'Uses per customer', 1);
    if (has('first_order_only')) out.first_order_only = !!data.first_order_only;
    if (has('is_active')) out.is_active = !!data.is_active;

    // Dates are whole Lagos days: valid from 00:00 on the first day until
    // 23:59:59 on the last.
    if (has('starts_on')) {
      if (data.starts_on === null || data.starts_on === '') out.starts_at = null;
      else {
        const at = dayMs(data.starts_on);
        if (at === null) throw new BadRequestException('The start date is not valid');
        out.starts_at = sqlTime(at - LAGOS_OFFSET_MS);
      }
    }
    if (has('expires_on')) {
      if (data.expires_on === null || data.expires_on === '') out.expires_at = null;
      else {
        const at = dayMs(data.expires_on);
        if (at === null) throw new BadRequestException('The end date is not valid');
        out.expires_at = sqlTime(at - LAGOS_OFFSET_MS + 24 * 60 * 60 * 1000 - 1000);
      }
    }
    const startsAt = out.starts_at !== undefined ? out.starts_at : current?.starts_at ? sqlTime(new Date(current.starts_at).getTime()) : null;
    const expiresAt = out.expires_at !== undefined ? out.expires_at : current?.expires_at ? sqlTime(new Date(current.expires_at).getTime()) : null;
    if (startsAt && expiresAt && expiresAt < startsAt) {
      throw new BadRequestException('The end date is before the start date');
    }
    return out;
  }

  private async byId(id: string) {
    const row = await this.db.queryOne<any>(`${PromoService.WITH_USAGE} WHERE p.id = $1`, [id]);
    if (!row) throw new NotFoundException('Promo code not found');
    return row;
  }

  async adminCreate(data: any, actor: Actor) {
    const v = this.clean(data, false);
    const taken = await this.db.queryOne(`SELECT 1 FROM promo_codes WHERE code = $1`, [v.code]);
    if (taken) throw new BadRequestException('That code already exists');
    const id = randomUUID();
    const cols = ['id', 'created_by', ...Object.keys(v)];
    const params = [id, actor.user_id, ...Object.values(v)];
    await this.db.query(
      `INSERT INTO promo_codes (${cols.join(', ')}, created_at, updated_at)
       VALUES (${cols.map((_, i) => '$' + (i + 1)).join(', ')}, NOW(), NOW())`,
      params,
    );
    const row = await this.byId(id);
    const worth = row.kind === 'percent' ? `${Number(row.value)}% off` : `${naira(Number(row.value))} off`;
    await this.audit.log(actor as any, 'created', { id, full_name: row.code }, `Created promo code ${row.code} (${worth})`, 'promo');
    return this.present(row);
  }

  async adminUpdate(id: string, data: any, actor: Actor) {
    const current = await this.byId(id);
    const v = this.clean(data, true, current);
    const entries = Object.entries(v);
    if (entries.length) {
      const params = entries.map(([, value]) => value);
      params.push(id);
      await this.db.query(
        `UPDATE promo_codes SET ${entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')}, updated_at = NOW()
         WHERE id = $${params.length}`,
        params,
      );
      const action =
        v.is_active === false ? 'deactivated' : v.is_active === true && !current.is_active ? 'activated' : 'updated';
      await this.audit.log(
        actor as any,
        action,
        { id, full_name: current.code },
        `Promo code ${current.code}: changed ${entries.map(([k]) => k).join(', ')}`,
        'promo',
      );
    }
    return this.present(await this.byId(id));
  }
}
