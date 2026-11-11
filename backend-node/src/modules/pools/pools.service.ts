import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomBytes, randomInt, randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { NotifyService } from '../../common/notify.service';
import { MailService } from '../../common/mail.service';
import { AuditService } from '../../common/audit.service';
import { paging } from '../../common/paging';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://www.quickgift.ng').replace(/\/+$/, '');
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_CONTRIBUTION = 500;
const MAX_DAYS = 30;
const MAX_OPEN_PER_USER = 5;
const SWEEP_EVERY_MS = 10 * 60 * 1000;
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-US')}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

interface Actor {
  user_id: string;
  role: string;
}

/**
 * Group gifts: several people pay for one gift.
 *
 * The organiser builds the gift like a normal order, but instead of paying
 * they open a "pool". The order is created straight away (so prices are
 * fixed) and waits unpaid. Friends open a public page and chip in by card; no
 * account is needed. When the pool reaches the order total, the order is
 * marked paid through the normal payment path (seller payouts, notifications,
 * delivery). If the deadline passes first, or the pool is cancelled, every
 * contribution is refunded to the card it came from.
 *
 * Money rules:
 *  - a contribution only counts once the gateway confirms it, for the exact
 *    amount, and it is claimed with a conditional UPDATE (so never twice);
 *  - the pool row is locked while a contribution is applied, so the total can
 *    never pass the target: anything over is refunded to that contributor;
 *  - pooled money never goes to the organiser's wallet. A pool order cannot
 *    be paid or cancelled through the ordinary order routes.
 */
@Injectable()
export class PoolsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PoolsService.name);
  private timer: NodeJS.Timeout | null = null;
  private sweeping = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
    private readonly notifier: NotifyService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS gift_pools (
        id             VARCHAR PRIMARY KEY,
        code           VARCHAR(16) NOT NULL UNIQUE,
        organiser_id   VARCHAR NOT NULL,
        order_id       VARCHAR NOT NULL UNIQUE,
        title          VARCHAR(120) NOT NULL,
        recipient_name VARCHAR(80),
        message        TEXT,
        target         DOUBLE PRECISION NOT NULL,
        raised         DOUBLE PRECISION NOT NULL DEFAULT 0,
        status         VARCHAR(16) NOT NULL DEFAULT 'open',
        deadline       TIMESTAMP NOT NULL,
        created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
        closed_at      TIMESTAMP
      )
    `);
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS pool_contributions (
        id            VARCHAR PRIMARY KEY,
        pool_id       VARCHAR NOT NULL,
        name          VARCHAR(80) NOT NULL,
        email         VARCHAR(160) NOT NULL,
        amount        DOUBLE PRECISION NOT NULL,
        reference     VARCHAR(40) NOT NULL UNIQUE,
        status        VARCHAR(16) NOT NULL DEFAULT 'pending',
        refund_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        refund_sent   DOUBLE PRECISION NOT NULL DEFAULT 0,
        refund_state  VARCHAR(16) NOT NULL DEFAULT 'none',
        created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        paid_at       TIMESTAMP,
        refunded_at   TIMESTAMP
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS ix_pool_contributions_pool ON pool_contributions (pool_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS ix_gift_pools_organiser ON gift_pools (organiser_id)`,
    );
    this.timer = setInterval(() => void this.sweep(), SWEEP_EVERY_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ---- helpers ----

  private shareUrl(code: string) {
    return `${SITE_URL}/group/?c=${code}`;
  }

  private firstName(fullName?: string | null): string {
    return String(fullName || '').trim().split(/\s+/)[0] || '';
  }

  /** "Ada O." — enough for friends to recognise each other. */
  private shortName(fullName?: string | null): string {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'A friend';
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
  }

  private newCode(): string {
    let s = '';
    for (let i = 0; i < 8; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    return s;
  }

  private present(pool: any) {
    const target = Number(pool.target);
    const raised = Math.min(Number(pool.raised), target);
    return {
      id: pool.id,
      code: pool.code,
      title: pool.title,
      recipient_name: pool.recipient_name,
      message: pool.message,
      target,
      raised,
      remaining: round2(Math.max(0, target - raised)),
      status: pool.status,
      deadline: pool.deadline,
      order_id: pool.order_id,
      share_url: this.shareUrl(pool.code),
      created_at: pool.created_at,
    };
  }

  private async byCode(code: string) {
    const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length !== 8) return null;
    return this.db.queryOne<any>(`SELECT * FROM gift_pools WHERE code = $1`, [c]);
  }

  // ---- organiser ----

  async create(userId: string, body: any) {
    const days = body?.days === undefined ? 7 : Number(body.days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
      throw new BadRequestException(`A group gift can stay open for 1 to ${MAX_DAYS} days`);
    }
    if (body?.scheduled_date) {
      const closes = new Date(Date.now() + LAGOS_OFFSET_MS + days * 86400000).toISOString().slice(0, 10);
      if (String(body.scheduled_date).slice(0, 10) <= closes) {
        throw new BadRequestException(
          'The delivery day must be after the group gift closes. Pick a later day or a shorter collection time.',
        );
      }
    }
    const open = await this.db.queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM gift_pools WHERE organiser_id = $1 AND status = 'open'`,
      [userId],
    );
    if ((open?.n ?? 0) >= MAX_OPEN_PER_USER) {
      throw new BadRequestException(
        `You already have ${MAX_OPEN_PER_USER} group gifts open. Finish or cancel one first.`,
      );
    }

    // The order is created now so the price is fixed; it waits unpaid until
    // the pool fills. Promo codes are not combined with group gifts.
    const order: any = await this.orders.createOrder(userId, { ...body, promo_code: undefined });
    const recipient = String(body?.recipient_name ?? '').trim().slice(0, 80) || null;
    const title =
      String(body?.title ?? '').trim().slice(0, 120) || (recipient ? `A gift for ${recipient}` : 'Group gift');
    const id = randomUUID();
    for (let attempt = 0; ; attempt++) {
      try {
        await this.db.query(
          `INSERT INTO gift_pools (id, code, organiser_id, order_id, title, recipient_name, message, target, raised, status, deadline, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,'open', NOW() + make_interval(days => $9), NOW(), NOW())`,
          [id, this.newCode(), userId, order.id, title, recipient, order.personal_message ?? null, Number(order.total), days],
        );
        break;
      } catch (err: any) {
        if (err?.code !== '23505' || attempt >= 5) throw err; // code clash: try another
      }
    }
    return this.detail(id, userId);
  }

  async mine(userId: string) {
    await this.refreshFor(`organiser_id = $1`, [userId]);
    const rows = await this.db.query<any>(
      `SELECT p.*, o.order_number,
              (SELECT count(*)::int FROM pool_contributions c WHERE c.pool_id = p.id AND c.status = 'paid') AS contributors
       FROM gift_pools p LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.organiser_id = $1 ORDER BY p.created_at DESC LIMIT 50`,
      [userId],
    );
    return rows.map((r) => ({ ...this.present(r), order_number: r.order_number, contributors: r.contributors }));
  }

  async detail(id: string, userId: string) {
    await this.refreshFor(`id = $1`, [id]);
    const pool = await this.db.queryOne<any>(
      `SELECT p.*, o.order_number FROM gift_pools p LEFT JOIN orders o ON o.id = p.order_id WHERE p.id = $1`,
      [id],
    );
    if (!pool) throw new NotFoundException('Group gift not found');
    if (pool.organiser_id !== userId) throw new ForbiddenException('Not authorized');
    const contributions = await this.db.query<any>(
      `SELECT name, amount, refund_amount, refund_state, paid_at FROM pool_contributions
       WHERE pool_id = $1 AND status = 'paid' ORDER BY paid_at DESC`,
      [id],
    );
    return {
      ...this.present(pool),
      order_number: pool.order_number,
      // What counted towards the gift: an overshoot is returned straight
      // away, so only the part that was kept is shown.
      contributions: contributions.map((c) => {
        const returnedInFull = Number(c.refund_amount) >= Number(c.amount);
        return {
          name: c.name,
          amount: returnedInFull ? Number(c.amount) : round2(Number(c.amount) - Number(c.refund_amount)),
          refunded: returnedInFull,
          paid_at: c.paid_at,
        };
      }),
    };
  }

  async cancelByOrganiser(id: string, userId: string) {
    const pool = await this.db.queryOne<any>(`SELECT * FROM gift_pools WHERE id = $1`, [id]);
    if (!pool) throw new NotFoundException('Group gift not found');
    if (pool.organiser_id !== userId) throw new ForbiddenException('Not authorized');
    if (pool.status !== 'open') {
      throw new BadRequestException(
        pool.status === 'funded'
          ? 'This group gift is fully paid. Please contact support if it needs to be cancelled.'
          : 'This group gift is already closed.',
      );
    }
    const closed = await this.close(id, 'cancelled');
    if (!closed) throw new BadRequestException('This group gift was just updated. Please refresh.');
    return this.detail(id, userId);
  }

  // ---- public page ----

  async publicView(code: string) {
    let pool = await this.byCode(code);
    if (!pool) throw new NotFoundException('This group gift link is not valid');
    await this.refreshFor(`id = $1`, [pool.id]);
    pool = (await this.byCode(code))!;
    const organiser = await this.db.queryOne<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id = $1`,
      [pool.organiser_id],
    );
    const names = await this.db.query<{ name: string }>(
      `SELECT name FROM pool_contributions
       WHERE pool_id = $1 AND status = 'paid' AND NOT (refund_state <> 'none' AND refund_amount >= amount)
       ORDER BY paid_at DESC LIMIT 30`,
      [pool.id],
    );
    const p = this.present(pool);
    return {
      code: p.code,
      title: p.title,
      recipient_name: p.recipient_name,
      organiser_name: this.firstName(organiser?.full_name) || null,
      message: p.message,
      target: p.target,
      raised: p.raised,
      remaining: p.remaining,
      status: p.status,
      deadline: p.deadline,
      min_contribution: Math.min(MIN_CONTRIBUTION, p.remaining),
      contributors: names.map((n) => this.shortName(n.name)),
    };
  }

  async contribute(code: string, body: any) {
    const pool = await this.byCode(code);
    if (!pool) throw new NotFoundException('This group gift link is not valid');
    await this.refreshFor(`id = $1`, [pool.id]);
    const fresh = (await this.byCode(code))!;
    if (fresh.status !== 'open') {
      throw new BadRequestException(
        fresh.status === 'funded' || fresh.status === 'funding'
          ? 'This gift is already fully paid for. Thank you!'
          : 'This group gift is closed.',
      );
    }
    const name = String(body?.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (name.length < 2) throw new BadRequestException('Please enter your name');
    const email = String(body?.email ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 160) {
      throw new BadRequestException('Please enter a valid email address. Your receipt goes there.');
    }
    const remaining = round2(Number(fresh.target) - Number(fresh.raised));
    const amount = Number(body?.amount);
    const min = Math.min(MIN_CONTRIBUTION, remaining);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) && amount !== remaining) {
      throw new BadRequestException('Please enter a whole amount in naira');
    }
    if (amount < min) throw new BadRequestException(`The smallest contribution is ${naira(min)}`);
    if (amount > remaining) {
      throw new BadRequestException(`Only ${naira(remaining)} is left to raise. Please enter that or less.`);
    }

    const reference = 'QG-GRP-' + randomBytes(8).toString('hex').toUpperCase();
    await this.db.query(
      `INSERT INTO pool_contributions (id, pool_id, name, email, amount, reference, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',NOW())`,
      [randomUUID(), fresh.id, name, email, amount, reference],
    );
    try {
      const started = await this.payments.gatewayStart({
        email,
        amount,
        reference,
        callbackUrl: this.shareUrl(fresh.code),
        metadata: { pool_code: fresh.code, kind: 'group_gift' },
      });
      return { reference, amount, authorization_url: started.authorization_url };
    } catch (err) {
      await this.db.query(
        `UPDATE pool_contributions SET status = 'failed' WHERE reference = $1 AND status = 'pending'`,
        [reference],
      );
      throw err;
    }
  }

  /** Called when the contributor comes back from the card page. */
  async verify(code: string, reference: string) {
    const pool = await this.byCode(code);
    if (!pool) throw new NotFoundException('This group gift link is not valid');
    const c = await this.db.queryOne<any>(
      `SELECT * FROM pool_contributions WHERE reference = $1 AND pool_id = $2`,
      [String(reference || ''), pool.id],
    );
    if (!c) throw new NotFoundException('Contribution not found');
    const status = c.status === 'pending' ? await this.settleContribution(c) : c.status;
    return {
      status: status === 'paid' ? 'success' : status,
      refunded: status === 'paid' ? await this.wasReturned(c.id) : false,
      pool: await this.publicView(code),
    };
  }

  private async wasReturned(contributionId: string): Promise<boolean> {
    const row = await this.db.queryOne<any>(
      `SELECT amount, refund_amount, refund_state FROM pool_contributions WHERE id = $1`,
      [contributionId],
    );
    return !!row && row.refund_state !== 'none' && Number(row.refund_amount) >= Number(row.amount);
  }

  /** Asks the gateway about a pending contribution and applies the answer. */
  private async settleContribution(c: any): Promise<'paid' | 'pending' | 'failed'> {
    const result = await this.payments.gatewayCheck(c.reference);
    if (result.state === 'unknown' || result.state === 'pending') return 'pending';
    if (result.state === 'failed') {
      await this.db.query(
        `UPDATE pool_contributions SET status = 'failed' WHERE id = $1 AND status = 'pending'`,
        [c.id],
      );
      return 'failed';
    }
    if (result.state === 'success' && result.kobo < Math.round(Number(c.amount) * 100)) {
      this.logger.error(`Amount mismatch on ${c.reference}: paid ${result.kobo} kobo, expected ${c.amount} NGN`);
      return 'failed';
    }
    await this.applyPaid(c.reference);
    return 'paid';
  }

  /**
   * Counts a confirmed contribution towards its pool, exactly once. If the
   * pool is no longer open the money is queued to go straight back; if this
   * payment takes the pool past its target, only the excess goes back.
   */
  private async applyPaid(reference: string) {
    const outcome = await this.db.transaction(async (client) => {
      const c = (
        await client.query(
          `UPDATE pool_contributions SET status = 'paid', paid_at = NOW()
           WHERE reference = $1 AND status = 'pending' RETURNING *`,
          [reference],
        )
      ).rows[0];
      if (!c) return null; // already applied
      const pool = (
        await client.query(`SELECT * FROM gift_pools WHERE id = $1 FOR UPDATE`, [c.pool_id])
      ).rows[0];
      const amount = Number(c.amount);
      if (pool.status !== 'open') {
        await client.query(
          `UPDATE pool_contributions SET refund_amount = $1, refund_state = 'due' WHERE id = $2`,
          [amount, c.id],
        );
        return { pool, contribution: c, counted: 0, full: false };
      }
      const target = Number(pool.target);
      const room = round2(target - Number(pool.raised));
      const counted = Math.min(amount, room);
      const excess = round2(amount - counted);
      if (excess > 0) {
        await client.query(
          `UPDATE pool_contributions SET refund_amount = $1, refund_state = 'due' WHERE id = $2`,
          [excess, c.id],
        );
      }
      const raised = round2(Number(pool.raised) + counted);
      const full = raised >= target;
      await client.query(
        `UPDATE gift_pools SET raised = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [raised, full ? 'funding' : 'open', pool.id],
      );
      return { pool, contribution: c, counted, full };
    });
    if (!outcome) return;

    const { pool, contribution, counted, full } = outcome;
    if (counted > 0) {
      void this.mail
        .sendUserNotification(
          contribution.email,
          this.firstName(contribution.name) || 'there',
          'Thank you for chipping in',
          `We have received your ${naira(counted)} towards "${pool.title}". If the gift is not fully funded in time, your money is returned to your card.`,
        )
        .catch(() => undefined);
      await this.notifier
        .notify(
          pool.organiser_id,
          'New contribution to your group gift',
          `${this.shortName(contribution.name)} added ${naira(counted)} to "${pool.title}".`,
          'payment',
        )
        .catch(() => undefined);
    }
    if (full) await this.fund(pool.id);
    await this.processRefunds(pool.id);
  }

  /** The pool is full: pay its order through the normal payment path. */
  private async fund(poolId: string) {
    const pool = await this.db.queryOne<any>(`SELECT * FROM gift_pools WHERE id = $1`, [poolId]);
    if (!pool || pool.status !== 'funding') return;
    const paid = await this.payments.settleOrderFromPool(pool.order_id, `QG-POOL-${pool.code}`);
    if (!paid) {
      // The order was cancelled underneath the pool: give everyone their money back.
      await this.close(poolId, 'cancelled');
      return;
    }
    const done = await this.db.queryOne(
      `UPDATE gift_pools SET status = 'funded', closed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'funding' RETURNING id`,
      [poolId],
    );
    if (!done) return;
    await this.notifier
      .notify(
        pool.organiser_id,
        'Your group gift is fully funded',
        `"${pool.title}" reached ${naira(Number(pool.target))}. The order is confirmed and is being prepared.`,
        'payment',
      )
      .catch(() => undefined);
  }

  /**
   * Closes a pool that will not be completed and queues every contribution
   * for refund. Returns false if it was not open.
   */
  private async close(poolId: string, status: 'expired' | 'cancelled'): Promise<boolean> {
    const pool = await this.db.transaction(async (client) => {
      const row = (
        await client.query(
          `UPDATE gift_pools SET status = $1, closed_at = NOW(), updated_at = NOW()
           WHERE id = $2 AND status IN ('open', 'funding') RETURNING *`,
          [status, poolId],
        )
      ).rows[0];
      if (!row) return null;
      await client.query(
        `UPDATE pool_contributions SET refund_amount = amount, refund_state = 'due'
         WHERE pool_id = $1 AND status = 'paid' AND refund_sent < amount AND refund_state <> 'processing'`,
        [poolId],
      );
      // The order was never paid: simply withdraw it.
      await client.query(
        `UPDATE orders SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1 AND status = 'pending' AND payment_status IS DISTINCT FROM 'paid'`,
        [row.order_id],
      );
      return row;
    });
    if (!pool) return false;
    await this.notifier
      .notify(
        pool.organiser_id,
        status === 'expired' ? 'Your group gift has closed' : 'Group gift cancelled',
        status === 'expired'
          ? `"${pool.title}" did not reach its target in time. Everyone who chipped in is being refunded to their card.`
          : `"${pool.title}" was cancelled. Everyone who chipped in is being refunded to their card.`,
        'payment',
      )
      .catch(() => undefined);
    await this.processRefunds(poolId);
    return true;
  }

  /** Sends queued refunds back to the cards they came from. */
  private async processRefunds(poolId?: string) {
    const due = await this.db.query<any>(
      `SELECT c.id FROM pool_contributions c
       WHERE c.refund_state = 'due' ${poolId ? 'AND c.pool_id = $1' : ''} ORDER BY c.created_at LIMIT 100`,
      poolId ? [poolId] : [],
    );
    for (const { id } of due) {
      const c = await this.db.queryOne<any>(
        `UPDATE pool_contributions SET refund_state = 'processing'
         WHERE id = $1 AND refund_state = 'due' RETURNING *`,
        [id],
      );
      if (!c) continue; // another worker has it
      // Only what has not already gone back (a contribution can be refunded
      // in part when it overshoots, and the rest later if the pool is cancelled).
      const toSend = round2(Number(c.refund_amount) - Number(c.refund_sent));
      const ok = toSend <= 0 ? true : await this.payments.gatewayRefund(c.reference, toSend).catch(() => false);
      await this.db.query(
        `UPDATE pool_contributions SET refund_state = $1::varchar,
                refund_sent = CASE WHEN $1::varchar = 'done' THEN refund_amount ELSE refund_sent END,
                refunded_at = CASE WHEN $1::varchar = 'done' THEN NOW() ELSE refunded_at END
         WHERE id = $2`,
        [ok ? 'done' : 'failed', c.id],
      );
      if (ok && toSend > 0) {
        void this.mail
          .sendUserNotification(
            c.email,
            this.firstName(c.name) || 'there',
            'Your contribution has been refunded',
            `${naira(toSend)} is on its way back to the card you paid with. Banks usually take a few working days to show it.`,
          )
          .catch(() => undefined);
      } else {
        this.logger.error(`Refund failed for contribution ${c.reference} (${c.refund_amount} NGN)`);
      }
    }
  }

  /** Brings the selected pools up to date before they are shown or used. */
  private async refreshFor(where: string, params: any[]) {
    const stale = await this.db.query<any>(
      `SELECT p.id, p.status, p.deadline, o.status AS order_status
       FROM gift_pools p LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.${where} AND p.status IN ('open', 'funding')`,
      params,
    );
    for (const p of stale) {
      if (p.status === 'funding') await this.fund(p.id);
      else if (p.order_status === 'cancelled') await this.close(p.id, 'cancelled');
      else if (new Date(p.deadline).getTime() < Date.now()) await this.close(p.id, 'expired');
    }
  }

  /** Periodic housekeeping; also safe to run by hand. */
  async sweep(): Promise<{ ok: boolean }> {
    if (this.sweeping) return { ok: false };
    this.sweeping = true;
    try {
      await this.refreshFor(`status IN ('open', 'funding')`, []);
      // Someone paid but never came back to the page: ask the gateway.
      const pending = await this.db.query<any>(
        `SELECT * FROM pool_contributions
         WHERE status = 'pending' AND created_at < NOW() - interval '2 minutes'
           AND created_at > NOW() - interval '2 hours' LIMIT 100`,
      );
      for (const c of pending) await this.settleContribution(c).catch(() => undefined);
      await this.db.query(
        `UPDATE pool_contributions SET status = 'failed'
         WHERE status = 'pending' AND created_at <= NOW() - interval '2 hours'`,
      );
      await this.processRefunds();
    } catch (err: any) {
      this.logger.error(`pool sweep failed: ${err?.message}`);
    } finally {
      this.sweeping = false;
    }
    return { ok: true };
  }

  // ---- staff ----

  async adminList(q: any) {
    const { page, perPage, offset } = paging(q);
    const where: string[] = [];
    const params: any[] = [];
    if (q?.status) { params.push(q.status); where.push(`p.status = $${params.length}`); }
    if (q?.search) {
      params.push('%' + String(q.search).trim().replace(/[\\%_]/g, (c) => '\\' + c) + '%');
      const i = params.length;
      where.push(`(p.title ILIKE $${i} OR p.code ILIKE $${i} OR u.full_name ILIKE $${i} OR o.order_number ILIKE $${i})`);
    }
    const from = `gift_pools p LEFT JOIN users u ON u.id = p.organiser_id LEFT JOIN orders o ON o.id = p.order_id`;
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (await this.db.queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM ${from} ${whereSql}`, params))?.n ?? 0;
    const rows = await this.db.query<any>(
      `SELECT p.*, u.full_name AS organiser_name, u.phone AS organiser_phone, o.order_number,
              (SELECT count(*)::int FROM pool_contributions c WHERE c.pool_id = p.id AND c.status = 'paid') AS contributors,
              (SELECT count(*)::int FROM pool_contributions c WHERE c.pool_id = p.id AND c.refund_state = 'failed') AS refunds_failed
       FROM ${from} ${whereSql}
       ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPage, offset],
    );
    return {
      items: rows.map((r) => ({
        ...this.present(r),
        organiser_name: r.organiser_name,
        organiser_phone: r.organiser_phone,
        order_number: r.order_number,
        contributors: r.contributors,
        refunds_failed: r.refunds_failed,
      })),
      total,
      page,
      per_page: perPage,
    };
  }

  async adminDetail(id: string) {
    const pool = await this.db.queryOne<any>(
      `SELECT p.*, u.full_name AS organiser_name, o.order_number FROM gift_pools p
       LEFT JOIN users u ON u.id = p.organiser_id LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.id = $1`,
      [id],
    );
    if (!pool) throw new NotFoundException('Group gift not found');
    const contributions = await this.db.query<any>(
      `SELECT id, name, email, amount, reference, status, refund_amount, refund_sent, refund_state, created_at, paid_at, refunded_at
       FROM pool_contributions WHERE pool_id = $1 AND status <> 'pending' ORDER BY created_at DESC`,
      [id],
    );
    return {
      ...this.present(pool),
      organiser_name: pool.organiser_name,
      order_number: pool.order_number,
      contributions: contributions.map((c) => ({
        ...c,
        amount: Number(c.amount),
        refund_amount: Number(c.refund_amount),
        refund_sent: Number(c.refund_sent),
      })),
    };
  }

  /**
   * Staff: stop a pool and refund everyone. Works on an open pool, and on a
   * fully paid one as long as the seller has not been paid out yet (the order
   * is cancelled with it).
   */
  async adminCancel(id: string, actor: Actor) {
    const pool = await this.db.queryOne<any>(`SELECT * FROM gift_pools WHERE id = $1`, [id]);
    if (!pool) throw new NotFoundException('Group gift not found');
    if (pool.status === 'open' || pool.status === 'funding') {
      await this.close(id, 'cancelled');
    } else if (pool.status === 'funded') {
      await this.db.transaction(async (client) => {
        const locked = (await client.query(`SELECT * FROM gift_pools WHERE id = $1 FOR UPDATE`, [id])).rows[0];
        if (locked.status !== 'funded') throw new BadRequestException('This group gift was just updated. Please refresh.');
        const order = (await client.query(`SELECT * FROM orders WHERE id = $1 FOR UPDATE`, [locked.order_id])).rows[0];
        if (!order || !['pending', 'confirmed'].includes(order.status)) {
          throw new BadRequestException(
            'This order is already on its way or delivered, so it cannot be cancelled here. Use a dispute instead.',
          );
        }
        const released = (
          await client.query(`SELECT 1 FROM payouts WHERE order_id = $1 AND status = 'paid' LIMIT 1`, [order.id])
        ).rows[0];
        if (released) {
          throw new BadRequestException('The seller has already been paid for this order. Use a dispute instead.');
        }
        await client.query(
          `UPDATE orders SET status = 'cancelled', payment_status = 'refunded', updated_at = NOW() WHERE id = $1`,
          [order.id],
        );
        await client.query(
          `UPDATE payouts SET status = 'cancelled', updated_at = NOW() WHERE order_id = $1 AND status IN ('pending','held')`,
          [order.id],
        );
        await client.query(
          `UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE order_id = $1 AND status = 'success'`,
          [order.id],
        );
        await client.query(
          `UPDATE gift_pools SET status = 'cancelled', closed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [id],
        );
        await client.query(
          `UPDATE pool_contributions SET refund_amount = amount, refund_state = 'due'
           WHERE pool_id = $1 AND status = 'paid' AND refund_sent < amount AND refund_state <> 'processing'`,
          [id],
        );
      });
      await this.notifier
        .notify(
          pool.organiser_id,
          'Group gift cancelled',
          `"${pool.title}" was cancelled by QuickGift. Everyone who chipped in is being refunded to their card.`,
          'payment',
        )
        .catch(() => undefined);
      await this.processRefunds(id);
    } else {
      throw new BadRequestException('This group gift is already closed.');
    }
    await this.audit.log(
      actor as any,
      'cancelled',
      { id, full_name: pool.title },
      `Cancelled group gift ${pool.code} and refunded contributors`,
      'pool',
    );
    return this.adminDetail(id);
  }

  /** Staff: try a refund again after the gateway refused it. */
  async adminRetryRefund(contributionId: string, actor: Actor) {
    const c = await this.db.queryOne<any>(
      `UPDATE pool_contributions SET refund_state = 'due'
       WHERE id = $1 AND refund_state = 'failed' RETURNING *`,
      [contributionId],
    );
    if (!c) throw new BadRequestException('This contribution has no failed refund to retry.');
    await this.processRefunds(c.pool_id);
    await this.audit.log(
      actor as any,
      'refund_retried',
      { id: c.id, full_name: c.name, email: c.email },
      `Retried refund of ${naira(Number(c.refund_amount))} for ${c.reference}`,
      'pool',
    );
    return this.adminDetail(c.pool_id);
  }
}
