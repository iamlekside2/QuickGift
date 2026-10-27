import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { SecurityService } from '../../common/security.service';
import { NotifyService } from '../../common/notify.service';

const USER_SAFE_FIELDS = `id, full_name, email, phone, avatar_url, city, address, lat, lng, role, is_active, wallet_balance, created_at, push_token, updated_at`;
const PAID_PAYOUT_STATUSES = ['held', 'released', 'paid'];

@Injectable()
export class AdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly security: SecurityService,
    private readonly notifier: NotifyService,
  ) {}

  private async num(sql: string, params: any[] = []): Promise<number> {
    const row = await this.db.queryOne<{ v: number }>(sql, params);
    return row ? Number((row as any).v) : 0;
  }

  /** Generic paginated `SELECT *` list → {items, total, page, per_page}. */
  private async list(table: string, where: string[], params: any[], page: number, perPage: number) {
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = await this.num(
      `SELECT count(*)::int AS v FROM ${table} ${whereSql}`,
      params,
    );
    const p = [...params, perPage, (page - 1) * perPage];
    const items = await this.db.query(
      `SELECT * FROM ${table} ${whereSql} ORDER BY created_at DESC LIMIT $${p.length - 1} OFFSET $${p.length}`,
      p,
    );
    return { items, total, page, per_page: perPage };
  }

  // ---- seed (secret-gated) ----
  async seed(secret: string) {
    if (!secret) throw new ForbiddenException('Secret required');
    if (secret !== (process.env.SECRET_KEY || 'dev-only-insecure-key')) {
      throw new ForbiddenException('Invalid secret');
    }
    const results: string[] = [];
    const admin = await this.db.queryOne(`SELECT 1 FROM users WHERE email = 'admin@quickgift.ng'`);
    if (!admin) {
      await this.db.query(
        `INSERT INTO users (id, full_name, phone, email, password_hash, role, city, is_active, wallet_balance, created_at, updated_at)
         VALUES ($1,'QuickGift Admin','+2348000000000','admin@quickgift.ng',$2,'admin','Lagos',true,0,NOW(),NOW())`,
        [randomUUID(), this.security.hashPassword('admin123')],
      );
      results.push('Admin user created');
    } else {
      results.push('Admin user: already exists');
    }
    for (const [label, table] of [
      ['Categories', 'categories'],
      ['Occasions', 'occasions'],
      ['Products', 'products'],
      ['Providers', 'providers'],
    ] as const) {
      const c = await this.num(`SELECT count(*)::int AS v FROM ${table}`);
      results.push(`${label}: already has ${c}`);
    }
    return { status: 'ok', results };
  }

  // ---- dashboard ----
  async dashboard() {
    const orderRevenue = await this.num(`SELECT coalesce(sum(total),0)::float AS v FROM orders WHERE payment_status='paid'`);
    const bookingRevenue = await this.num(`SELECT coalesce(sum(price),0)::float AS v FROM bookings WHERE payment_status='paid'`);
    const orderCommission = await this.num(`SELECT coalesce(sum(commission),0)::float AS v FROM orders WHERE payment_status='paid'`);
    const bookingCommission = await this.num(`SELECT coalesce(sum(commission),0)::float AS v FROM bookings WHERE payment_status='paid'`);
    return {
      revenue: { total: orderRevenue + bookingRevenue, gifts: orderRevenue, beauty: bookingRevenue },
      commission: { total: orderCommission + bookingCommission, gifts: orderCommission, beauty: bookingCommission },
      counts: {
        orders: await this.num(`SELECT count(*)::int AS v FROM orders`),
        bookings: await this.num(`SELECT count(*)::int AS v FROM bookings`),
        users: await this.num(`SELECT count(*)::int AS v FROM users`),
        providers: await this.num(`SELECT count(*)::int AS v FROM providers`),
        products: await this.num(`SELECT count(*)::int AS v FROM products`),
      },
      pending: {
        orders: await this.num(`SELECT count(*)::int AS v FROM orders WHERE status='pending'`),
        providers: await this.num(`SELECT count(*)::int AS v FROM providers WHERE status='pending'`),
        bookings: await this.num(`SELECT count(*)::int AS v FROM bookings WHERE status='pending'`),
      },
    };
  }

  // ---- entity lists ----
  listOrders(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    if (q.order_type) { params.push(q.order_type); where.push(`order_type = $${params.length}`); }
    return this.list('orders', where, params, Number(q.page ?? 1), Number(q.per_page ?? 20));
  }

  async listUsers(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.search) {
      params.push(`%${q.search}%`);
      const i = params.length;
      where.push(`(full_name ILIKE $${i} OR email ILIKE $${i} OR phone ILIKE $${i})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 20);
    const total = await this.num(`SELECT count(*)::int AS v FROM users ${whereSql}`, params);
    const p = [...params, perPage, (page - 1) * perPage];
    const items = await this.db.query(
      `SELECT ${USER_SAFE_FIELDS} FROM users ${whereSql} ORDER BY created_at DESC LIMIT $${p.length - 1} OFFSET $${p.length}`,
      p,
    );
    return { items, total, page, per_page: perPage };
  }

  listProviders(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return this.db.query(`SELECT * FROM providers ${whereSql} ORDER BY created_at DESC`, params);
  }

  listBookings(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    return this.list('bookings', where, params, Number(q.page ?? 1), Number(q.per_page ?? 20));
  }

  listPayments(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    return this.list('payments', where, params, Number(q.page ?? 1), Number(q.per_page ?? 20));
  }

  listTransactions(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.type) { params.push(q.type); where.push(`type = $${params.length}`); }
    return this.list('transactions', where, params, Number(q.page ?? 1), Number(q.per_page ?? 20));
  }

  listPayouts(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    return this.list('payouts', where, params, Number(q.page ?? 1), Number(q.per_page ?? 20));
  }

  listDeliveries(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    return this.list('deliveries', where, params, Number(q.page ?? 1), Number(q.per_page ?? 20));
  }

  // ---- payouts ----
  async releasePayout(payoutId: string) {
    const payout = await this.db.queryOne<any>(`SELECT * FROM payouts WHERE id = $1`, [payoutId]);
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'held') {
      throw new BadRequestException(`Cannot release payout in '${payout.status}' status`);
    }
    let providerUserId: string | null = null;
    await this.db.transaction(async (client) => {
      const provider = (await client.query(`SELECT id, user_id FROM providers WHERE id = $1`, [payout.provider_id])).rows[0];
      if (provider) {
        const user = (await client.query(`SELECT id, wallet_balance FROM users WHERE id = $1`, [provider.user_id])).rows[0];
        if (user) {
          providerUserId = user.id;
          const newBalance = Number(user.wallet_balance) + Number(payout.amount);
          await client.query(`UPDATE users SET wallet_balance = $1 WHERE id = $2`, [newBalance, user.id]);
          const ref = 'PO-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
          const target = payout.order_id ? 'order' : 'booking';
          await client.query(
            `INSERT INTO transactions (id, user_id, type, amount, description, reference, balance_after, status, created_at)
             VALUES ($1,$2,'credit',$3,$4,$5,$6,'completed',NOW())`,
            [randomUUID(), user.id, payout.amount, `Payout for ${target} ${payout.order_id || payout.booking_id}`, ref, newBalance],
          );
          await client.query(`UPDATE providers SET total_revenue = total_revenue + $1 WHERE id = $2`, [payout.amount, provider.id]);
        }
      }
      await client.query(`UPDATE payouts SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1`, [payoutId]);
    });
    if (providerUserId) {
      await this.notifier
        .notify(providerUserId, 'Payment Received!', `₦${Math.round(payout.amount).toLocaleString('en-US')} has been credited to your wallet.`, 'payment')
        .catch(() => undefined);
    }
    return { status: 'ok', payout_id: payoutId, amount: payout.amount };
  }

  async cancelPayout(payoutId: string) {
    const payout = await this.db.queryOne<any>(`SELECT status FROM payouts WHERE id = $1`, [payoutId]);
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status === 'paid') {
      throw new BadRequestException('Cannot cancel an already paid payout');
    }
    await this.db.query(`UPDATE payouts SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [payoutId]);
    return { status: 'ok', payout_id: payoutId };
  }

  async payoutStats() {
    return {
      held: await this.num(`SELECT coalesce(sum(amount),0)::float AS v FROM payouts WHERE status='held'`),
      released: await this.num(`SELECT coalesce(sum(amount),0)::float AS v FROM payouts WHERE status='released'`),
      paid: await this.num(`SELECT coalesce(sum(amount),0)::float AS v FROM payouts WHERE status='paid'`),
      total_commission: await this.num(`SELECT coalesce(sum(commission),0)::float AS v FROM payouts WHERE status IN ('held','released','paid')`),
      pending_count: await this.num(`SELECT count(*)::int AS v FROM payouts WHERE status IN ('held','released')`),
    };
  }

  // ---- settings ----
  settings() {
    return {
      gift_commission: Number(process.env.GIFT_COMMISSION_PERCENT ?? '10.0'),
      beauty_commission: Number(process.env.BEAUTY_COMMISSION_PERCENT ?? '10.0'),
      paystack_live: (process.env.PAYSTACK_LIVE || 'false').toLowerCase() === 'true',
      kwik_env: process.env.KWIK_ENV || 'test',
      payout_hold_hours: 24,
    };
  }

  // ---- analytics ----
  async revenueAnalytics() {
    const rows: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const name = start.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const startS = start.toISOString();
      const endS = end.toISOString();
      const gifts = await this.num(
        `SELECT coalesce(sum(total),0)::float AS v FROM orders WHERE payment_status='paid' AND created_at >= $1 AND created_at < $2`,
        [startS, endS],
      );
      const beauty = await this.num(
        `SELECT coalesce(sum(price),0)::float AS v FROM bookings WHERE payment_status='paid' AND created_at >= $1 AND created_at < $2`,
        [startS, endS],
      );
      rows.push({ name, gifts, beauty });
    }
    return rows;
  }

  listWithdrawals(q: any) {
    const where: string[] = [`description LIKE '%Withdrawal%'`];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    return this.list('transactions', where, params, Number(q.page ?? 1), Number(q.per_page ?? 20));
  }

  async completeWithdrawal(txId: string) {
    const tx = await this.db.queryOne<any>(`SELECT status FROM transactions WHERE id = $1`, [txId]);
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== 'pending') throw new BadRequestException(`Transaction is already ${tx.status}`);
    await this.db.query(`UPDATE transactions SET status = 'completed' WHERE id = $1`, [txId]);
    return { status: 'completed', transaction_id: txId };
  }

  async failWithdrawal(txId: string) {
    return this.db.transaction(async (client) => {
      const tx = (await client.query(`SELECT user_id, amount, status FROM transactions WHERE id = $1`, [txId])).rows[0];
      if (!tx) throw new NotFoundException('Transaction not found');
      if (tx.status !== 'pending') throw new BadRequestException(`Transaction is already ${tx.status}`);
      const user = (await client.query(`SELECT id, wallet_balance FROM users WHERE id = $1`, [tx.user_id])).rows[0];
      if (user) {
        await client.query(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [tx.amount, user.id]);
      }
      await client.query(`UPDATE transactions SET status = 'failed' WHERE id = $1`, [txId]);
      return { status: 'failed', transaction_id: txId, refunded: true };
    });
  }

  async extendedAnalytics() {
    const statusRows = await this.db.query<{ status: string; count: number }>(
      `SELECT status, count(*)::int AS count FROM orders GROUP BY status`,
    );
    const breakdown: Record<string, number> = {
      pending: 0, confirmed: 0, in_transit: 0, delivered: 0, cancelled: 0,
    };
    for (const r of statusRows) {
      if (r.status in breakdown) breakdown[r.status] = Number(r.count);
    }
    const totalOrders = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const successRate = Math.round((breakdown.delivered / Math.max(totalOrders, 1)) * 1000) / 10;
    const cancelRate = Math.round((breakdown.cancelled / Math.max(totalOrders, 1)) * 1000) / 10;

    const topRaw = await this.db.query<any>(
      `SELECT provider_id, sum(amount)::float AS total_revenue, count(id)::int AS order_count
       FROM payouts WHERE status IN ('held','released','paid')
       GROUP BY provider_id ORDER BY sum(amount) DESC LIMIT 10`,
    );
    const topProviders: any[] = [];
    for (const row of topRaw) {
      const prov = await this.db.queryOne<any>(
        `SELECT id, business_name, service_type, rating FROM providers WHERE id = $1`,
        [row.provider_id],
      );
      if (prov) {
        topProviders.push({
          id: prov.id,
          business_name: prov.business_name,
          service_type: prov.service_type,
          revenue: Number(row.total_revenue),
          orders: Number(row.order_count),
          rating: prov.rating,
        });
      }
    }

    const pendingWithdrawals = await this.num(
      `SELECT coalesce(sum(amount),0)::float AS v FROM transactions WHERE description LIKE '%Withdrawal%' AND status='pending'`,
    );
    const platformFee = await this.num(
      `SELECT coalesce(sum(commission),0)::float AS v FROM payouts WHERE status IN ('held','released','paid')`,
    );

    return {
      order_status_breakdown: breakdown,
      success_rate: successRate,
      cancel_rate: cancelRate,
      top_providers: topProviders,
      pending_withdrawals: pendingWithdrawals,
      platform_fee_earned: platformFee,
    };
  }
}
