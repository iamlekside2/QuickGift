import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { SettingsService } from '../../common/settings.service';
import { PROMO_PAY_MINUTES } from '../../common/promo.service';
import {
  creditWallet,
  debitWallet,
  devPaymentsAllowed,
  ledgerRef,
  paystackSecret,
} from '../../common/ledger';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const CALLBACK_URL = 'https://quickgift.ng/payment/callback';
const WALLET_FUND = 'wallet_fund';

interface PaymentRow {
  id?: string;
  user_id: string;
  reference: string;
  order_id: string | null;
  booking_id: string | null;
  amount: number;
  status?: string;
  channel?: string | null;
}

interface Payable {
  order_id: string | null;
  booking_id: string | null;
  amount: number;
  label: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly settings: SettingsService,
  ) {}

  private get secretKey(): string {
    return paystackSecret();
  }

  private reference(): string {
    return ledgerRef('QG-PAY');
  }

  // ---- post-payment side effects (all run on a transaction client) ----

  private async createPayoutForOrder(
    client: PoolClient,
    order: any,
    commissionPct: number,
    holdHours: number,
  ) {
    const items = (
      await client.query(
        `SELECT oi.total_price, p.vendor_id, pr.id AS provider_id, pr.user_id AS provider_user_id
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         LEFT JOIN providers pr ON pr.id = p.vendor_id
         WHERE oi.order_id = $1`,
        [order.id],
      )
    ).rows;
    for (const item of items) {
      if (!item.provider_id) continue;
      const total = Number(item.total_price);
      if (!(total > 0)) continue;
      const commission = total * (commissionPct / 100);
      await client.query(
        `INSERT INTO payouts (id, provider_id, user_id, order_id, booking_id, amount, commission, status, hold_until, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NULL,$5,$6,'held',NOW() + make_interval(hours => $7),NOW(),NOW())`,
        [
          randomUUID(),
          item.provider_id,
          item.provider_user_id,
          order.id,
          total - commission,
          commission,
          holdHours,
        ],
      );
    }
  }

  private async createPayoutForBooking(
    client: PoolClient,
    booking: any,
    commissionPct: number,
    holdHours: number,
  ) {
    const provider = (
      await client.query(`SELECT id, user_id FROM providers WHERE id = $1`, [
        booking.provider_id,
      ])
    ).rows[0];
    if (!provider) return;
    const price = Number(booking.price);
    if (!(price > 0)) return;
    const commission = price * (commissionPct / 100);
    await client.query(
      `INSERT INTO payouts (id, provider_id, user_id, order_id, booking_id, amount, commission, status, hold_until, created_at, updated_at)
       VALUES ($1,$2,$3,NULL,$4,$5,$6,'held',NOW() + make_interval(hours => $7),NOW(),NOW())`,
      [randomUUID(), provider.id, provider.user_id, booking.id, price - commission, commission, holdHours],
    );
  }

  private async notifyVendorsOfOrder(client: PoolClient, order: any) {
    const items = (
      await client.query(
        `SELECT oi.product_name, oi.quantity, pr.id AS provider_id, pr.user_id AS provider_user_id
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         LEFT JOIN providers pr ON pr.id = p.vendor_id
         WHERE oi.order_id = $1`,
        [order.id],
      )
    ).rows;
    const notified = new Set<string>();
    for (const item of items) {
      if (!item.provider_id || notified.has(item.provider_id)) continue;
      notified.add(item.provider_id);
      await client.query(
        `INSERT INTO notifications (id, user_id, title, description, type, is_read, created_at)
         VALUES ($1,$2,'New Order!',$3,'system',false,NOW())`,
        [
          randomUUID(),
          item.provider_user_id,
          `Order ${order.order_number}: ${item.product_name} x${item.quantity}`,
        ],
      );
    }
  }

  private async createPendingDelivery(client: PoolClient, order: any) {
    // No address yet: the delivery record is created when the recipient (or
    // the buyer) supplies one. See GiftClaimService.
    if (order.address_pending) return;
    const existing = (
      await client.query(`SELECT 1 FROM deliveries WHERE order_id = $1`, [
        order.id,
      ])
    ).rows[0];
    if (existing) return;
    await client.query(
      `INSERT INTO deliveries (id, order_id, user_id, status, delivery_address, delivery_name, delivery_phone, delivery_fee, vehicle_type, created_at, updated_at)
       VALUES ($1,$2,$3,'pending',$4,$5,$6,0,'motorcycle',NOW(),NOW())`,
      [
        randomUUID(),
        order.id,
        order.user_id,
        order.delivery_address,
        order.recipient_name,
        order.recipient_phone,
      ],
    );
  }

  /**
   * Applies a confirmed payment to its order/booking exactly once.
   *
   * The `payment_status IS DISTINCT FROM 'paid'` claim makes this idempotent:
   * a second confirmation of the same target (verify + webhook arriving
   * together, a retried request) updates nothing and so creates no second
   * payout. If the target was cancelled before the money arrived, the payer is
   * refunded to their wallet instead of the order being revived.
   */
  private async settle(client: PoolClient, payment: PaymentRow) {
    const cfg = await this.settings.get();

    if (payment.order_id) {
      const order = (
        await client.query(
          `UPDATE orders SET payment_status = 'paid', payment_ref = $1,
                 status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
                 updated_at = NOW()
           WHERE id = $2 AND payment_status IS DISTINCT FROM 'paid' AND status <> 'cancelled'
           RETURNING *`,
          [payment.reference, payment.order_id],
        )
      ).rows[0];
      if (order) {
        await this.createPayoutForOrder(client, order, cfg.gift_commission, cfg.payout_hold_hours);
        await this.notifyVendorsOfOrder(client, order);
        await this.createPendingDelivery(client, order);
      } else {
        await this.refundIfCancelled(client, payment, 'orders', payment.order_id);
      }
    }

    if (payment.booking_id) {
      const booking = (
        await client.query(
          `UPDATE bookings SET payment_status = 'paid', payment_ref = $1,
                 status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
                 updated_at = NOW()
           WHERE id = $2 AND payment_status IS DISTINCT FROM 'paid'
             AND status NOT IN ('cancelled','declined')
           RETURNING id, provider_id, price`,
          [payment.reference, payment.booking_id],
        )
      ).rows[0];
      if (booking) {
        await this.createPayoutForBooking(client, booking, cfg.beauty_commission, cfg.payout_hold_hours);
      } else {
        await this.refundIfCancelled(client, payment, 'bookings', payment.booking_id);
      }
    }
  }

  /** Money arrived for something already cancelled: return it to the wallet. */
  private async refundIfCancelled(
    client: PoolClient,
    payment: PaymentRow,
    table: 'orders' | 'bookings',
    id: string,
  ) {
    const row = (
      await client.query(`SELECT status, payment_status FROM ${table} WHERE id = $1`, [id])
    ).rows[0];
    if (!row || row.payment_status === 'paid') return; // already settled: nothing to do
    if (!['cancelled', 'declined'].includes(row.status)) return;
    await creditWallet(
      client,
      payment.user_id,
      Number(payment.amount),
      `Refund: payment received for a cancelled ${table === 'orders' ? 'order' : 'booking'}`,
      `${payment.reference}-RF`,
    );
  }

  /**
   * Resolves what is being paid for and how much it costs — from the database,
   * never from the request. The caller must own it and it must still be payable.
   */
  private async loadPayable(userId: string, req: any): Promise<Payable> {
    const orderId = req?.order_id ? String(req.order_id) : null;
    const bookingId = req?.booking_id ? String(req.booking_id) : null;
    if ((orderId && bookingId) || (!orderId && !bookingId)) {
      throw new BadRequestException('Provide exactly one of order_id or booking_id');
    }

    if (orderId) {
      const order = await this.db.queryOne<any>(
        `SELECT id, user_id, total, status, payment_status, order_number, discount,
                (created_at < NOW() - make_interval(mins => $2)) AS promo_window_closed
         FROM orders WHERE id = $1`,
        [orderId, PROMO_PAY_MINUTES],
      );
      if (!order || order.user_id !== userId) throw new NotFoundException('Order not found');
      if (order.payment_status === 'paid') throw new BadRequestException('This order is already paid');
      if (order.status === 'cancelled') throw new BadRequestException('This order was cancelled');
      const pooled = await this.db.queryOne(
        `SELECT 1 FROM gift_pools WHERE order_id = $1 AND status IN ('open','funding')`,
        [orderId],
      );
      if (pooled) {
        throw new BadRequestException(
          'This order is being paid for by a group gift. Share the group gift link to collect contributions.',
        );
      }
      // A promo code only holds its place for a short while on an unpaid
      // order; after that the discounted price can no longer be paid.
      if (Number(order.discount) > 0 && order.promo_window_closed) {
        throw new BadRequestException(
          'This discounted order has expired. Please check out again to use your promo code.',
        );
      }
      const amount = Number(order.total);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException('This order has nothing to pay');
      }
      return { order_id: order.id, booking_id: null, amount, label: `order ${order.order_number}` };
    }

    const booking = await this.db.queryOne<any>(
      `SELECT id, user_id, price, status, payment_status, booking_number FROM bookings WHERE id = $1`,
      [bookingId],
    );
    if (!booking || booking.user_id !== userId) throw new NotFoundException('Booking not found');
    if (booking.payment_status === 'paid') throw new BadRequestException('This booking is already paid');
    if (['cancelled', 'declined'].includes(booking.status)) {
      throw new BadRequestException('This booking is no longer active');
    }
    const amount = Number(booking.price);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('This booking has nothing to pay');
    }
    return { order_id: null, booking_id: booking.id, amount, label: `booking ${booking.booking_number}` };
  }

  /** Marks a pending payment successful (once) and settles it. */
  private async confirm(reference: string, channel?: string | null): Promise<boolean> {
    return this.db.transaction(async (client) => {
      const claimed = (
        await client.query(
          `UPDATE payments SET status = 'success', channel = COALESCE($1, channel), updated_at = NOW()
           WHERE reference = $2 AND status <> 'success'
           RETURNING user_id, reference, order_id, booking_id, amount, channel`,
          [channel ?? null, reference],
        )
      ).rows[0];
      if (!claimed) return false; // someone else already confirmed it
      await this.settle(client, claimed);
      return true;
    });
  }

  // ---- gateway access for group gifts (PoolsService) ----

  /**
   * Starts a hosted card checkout for something that is not an order or a
   * booking. In local development (no key) there is no page to send the
   * payer to, so the address is null and gatewayCheck approves it.
   */
  async gatewayStart(opts: {
    email: string;
    amount: number;
    reference: string;
    callbackUrl: string;
    metadata?: Record<string, any>;
  }): Promise<{ authorization_url: string | null }> {
    if (!this.secretKey) {
      if (!devPaymentsAllowed()) {
        throw new HttpException(
          'Card payments are not available right now. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      return { authorization_url: null };
    }
    const resp = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: opts.email,
        amount: Math.round(opts.amount * 100), // kobo
        reference: opts.reference,
        callback_url: opts.callbackUrl,
        currency: 'NGN',
        metadata: opts.metadata ?? {},
      }),
    }).catch(() => null);
    const data: any = resp ? await resp.json().catch(() => null) : null;
    if (!resp || resp.status !== 200 || !data?.data?.authorization_url) {
      this.logger.error(`Paystack initialize failed for ${opts.reference}: ${data?.message ?? resp?.status ?? 'no response'}`);
      throw new HttpException(
        'We could not start your card payment. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return { authorization_url: data.data.authorization_url };
  }

  /** What the gateway says about a reference. Unknown is never "paid". */
  async gatewayCheck(
    reference: string,
  ): Promise<{ state: 'success' | 'failed' | 'pending' | 'unknown'; kobo: number }> {
    if (!this.secretKey) {
      return devPaymentsAllowed()
        ? { state: 'success', kobo: Number.MAX_SAFE_INTEGER }
        : { state: 'unknown', kobo: 0 };
    }
    const r = await this.askPaystack(reference);
    return { state: r.state, kobo: r.kobo };
  }

  /** Sends `amount` of a card payment back to the card. True if accepted. */
  async gatewayRefund(reference: string, amount: number): Promise<boolean> {
    if (!(amount > 0)) return true;
    if (!this.secretKey) return devPaymentsAllowed();
    const resp = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: reference, amount: Math.round(amount * 100) }),
    }).catch(() => null);
    const data: any = resp ? await resp.json().catch(() => null) : null;
    const ok = !!resp && resp.status >= 200 && resp.status < 300 && data?.status === true;
    if (!ok) {
      this.logger.error(`Paystack refund failed for ${reference}: ${data?.message ?? resp?.status ?? 'no response'}`);
    }
    return ok;
  }

  /**
   * Marks an order paid with money collected by a group gift, through the
   * same settle step as any other payment (payouts, seller notices, delivery).
   * Returns false, changing nothing, if the order was cancelled or was paid
   * some other way: the caller must then refund its contributors. The order
   * row is locked first so settle() can never take its "refund a cancelled
   * order to the payer's wallet" branch with other people's money.
   */
  async settleOrderFromPool(orderId: string, reference: string): Promise<boolean> {
    return this.db.transaction(async (client) => {
      const order = (
        await client.query(
          `SELECT id, user_id, total, status, payment_status, payment_ref FROM orders WHERE id = $1 FOR UPDATE`,
          [orderId],
        )
      ).rows[0];
      if (!order || order.status === 'cancelled') return false;
      if (order.payment_status === 'paid') return order.payment_ref === reference;
      const amount = Number(order.total);
      await client.query(
        `INSERT INTO payments (id, user_id, reference, order_id, booking_id, amount, currency, status, provider, channel, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NULL,$5,'NGN','success','paystack','group_gift',NOW(),NOW())
         ON CONFLICT (reference) DO NOTHING`,
        [randomUUID(), order.user_id, reference, order.id, amount],
      );
      await this.settle(client, {
        user_id: order.user_id,
        reference,
        order_id: order.id,
        booking_id: null,
        amount,
      });
      return true;
    });
  }

  // ---- endpoints ----

  async initialize(userId: string, req: any) {
    const method = req?.method === 'wallet' ? 'wallet' : 'card';
    const target = await this.loadPayable(userId, req);
    const reference = this.reference();

    if (method === 'wallet') {
      return this.db.transaction(async (client) => {
        const debit = await debitWallet(
          client,
          userId,
          target.amount,
          `Payment for ${target.label}`,
          reference,
        );
        if (!debit) throw new BadRequestException('Insufficient wallet balance');
        await client.query(
          `INSERT INTO payments (id, user_id, reference, order_id, booking_id, amount, currency, status, provider, channel, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'NGN','success','wallet','wallet',NOW(),NOW())`,
          [randomUUID(), userId, reference, target.order_id, target.booking_id, target.amount],
        );
        // settle() re-checks "not already paid" atomically; if a concurrent
        // payment won the race, roll the debit back.
        const before = await this.isPaid(client, target);
        if (before) throw new BadRequestException('This has already been paid');
        await this.settle(client, {
          user_id: userId,
          reference,
          order_id: target.order_id,
          booking_id: target.booking_id,
          amount: target.amount,
        });
        return {
          reference,
          status: 'success',
          method: 'wallet',
          amount: target.amount,
          new_balance: debit.balance,
        };
      });
    }

    // Card (Paystack)
    if (!this.secretKey && !devPaymentsAllowed()) {
      throw new HttpException(
        'Card payments are not available right now. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.db.query(
      `INSERT INTO payments (id, user_id, reference, order_id, booking_id, amount, currency, status, provider, channel, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'NGN','pending','paystack','card',NOW(),NOW())`,
      [randomUUID(), userId, reference, target.order_id, target.booking_id, target.amount],
    );

    if (!this.secretKey) {
      // Local development only (see devPaymentsAllowed).
      return {
        reference,
        amount: target.amount,
        authorization_url: null,
        message: 'Payment initialized (dev mode - no Paystack key configured)',
      };
    }

    const email = await this.payerEmail(userId, req?.email);
    const resp = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(target.amount * 100), // kobo
        reference,
        callback_url: CALLBACK_URL,
        currency: 'NGN',
        metadata: {
          order_id: target.order_id,
          booking_id: target.booking_id,
          user_id: userId,
        },
      }),
    }).catch(() => null);

    const data: any = resp ? await resp.json().catch(() => null) : null;
    if (!resp || resp.status !== 200 || !data?.data?.authorization_url) {
      await this.db.query(
        `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE reference = $1 AND status = 'pending'`,
        [reference],
      );
      this.logger.error(`Paystack initialize failed for ${reference}: ${data?.message ?? resp?.status ?? 'no response'}`);
      throw new HttpException(
        'We could not start your card payment. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return {
      reference,
      amount: target.amount,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
    };
  }

  private async isPaid(client: PoolClient, target: Payable): Promise<boolean> {
    const table = target.order_id ? 'orders' : 'bookings';
    const row = (
      await client.query(`SELECT payment_status FROM ${table} WHERE id = $1 FOR UPDATE`, [
        target.order_id ?? target.booking_id,
      ])
    ).rows[0];
    return row?.payment_status === 'paid';
  }

  /** A deliverable email for the Paystack receipt (never a made-up address). */
  private async payerEmail(userId: string, supplied?: string): Promise<string> {
    const user = await this.db.queryOne<{ email: string | null }>(
      `SELECT email FROM users WHERE id = $1`,
      [userId],
    );
    const candidate = user?.email || (supplied ? String(supplied).trim() : '');
    if (candidate && /^[^\s@+]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return candidate;
    // Paystack requires an email; fall back to a neutral, valid, per-user one.
    return `customer-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}@quickgift.ng`;
  }

  async verify(reference: string, user: { user_id: string; role: string }) {
    const payment = await this.db.queryOne<any>(
      `SELECT user_id, reference, order_id, booking_id, amount, status, channel FROM payments WHERE reference = $1`,
      [reference],
    );
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.user_id !== user.user_id && !['owner', 'admin'].includes(user.role)) {
      throw new ForbiddenException('Not authorized to verify this payment');
    }
    if (payment.channel === WALLET_FUND) {
      throw new BadRequestException('This is a wallet top-up. Verify it from the wallet.');
    }
    if (payment.status === 'success') {
      return { status: 'success', reference };
    }

    if (!this.secretKey) {
      if (!devPaymentsAllowed()) {
        throw new HttpException('Payments are not configured', HttpStatus.SERVICE_UNAVAILABLE);
      }
      await this.confirm(reference, 'dev');
      return { status: 'success', reference, message: 'Dev mode auto-verified' };
    }

    const result = await this.askPaystack(reference);
    if (result.state === 'unknown') {
      // Gateway unreachable or reference not found there. NEVER treat this as
      // paid — report it as still pending so the app can retry.
      return { status: 'pending', reference, message: 'Payment not confirmed yet' };
    }
    if (result.state !== 'success') {
      if (result.state === 'failed') {
        await this.db.query(
          `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE reference = $1 AND status = 'pending'`,
          [reference],
        );
      }
      return { status: result.state, reference };
    }
    if (result.kobo < Math.round(Number(payment.amount) * 100)) {
      this.logger.error(`Amount mismatch on ${reference}: paid ${result.kobo} kobo, expected ${payment.amount} NGN`);
      return { status: 'failed', reference, message: 'Amount paid does not match' };
    }
    await this.confirm(reference, result.channel);
    return { status: 'success', reference };
  }

  /** Asks Paystack for the truth about a reference. */
  private async askPaystack(
    reference: string,
  ): Promise<{ state: 'success' | 'failed' | 'pending' | 'unknown'; kobo: number; channel: string | null }> {
    const resp = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${this.secretKey}` } },
    ).catch(() => null);
    if (!resp || resp.status !== 200) return { state: 'unknown', kobo: 0, channel: null };
    const data: any = (await resp.json().catch(() => null))?.data;
    if (!data) return { state: 'unknown', kobo: 0, channel: null };
    const state =
      data.status === 'success' ? 'success' : data.status === 'failed' ? 'failed' : 'pending';
    return { state, kobo: Number(data.amount) || 0, channel: data.channel ?? null };
  }

  async webhook(rawBody: Buffer, signature: string, parsed: any) {
    if (!this.secretKey) {
      // No key means we cannot authenticate the sender. Only local dev may
      // accept unsigned events.
      if (!devPaymentsAllowed()) throw new BadRequestException('Webhook not configured');
    } else {
      const expected = createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
      const a = Buffer.from(expected);
      const b = Buffer.from(String(signature || ''));
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new BadRequestException('Invalid signature');
      }
    }
    if (parsed?.event !== 'charge.success') return { status: 'ok' };

    const reference = parsed?.data?.reference;
    if (!reference) return { status: 'ok' };
    const payment = await this.db.queryOne<any>(
      `SELECT reference, amount, status, channel FROM payments WHERE reference = $1`,
      [reference],
    );
    if (!payment || payment.status === 'success') return { status: 'ok' };

    const kobo = Number(parsed.data.amount) || 0;
    if (kobo < Math.round(Number(payment.amount) * 100)) {
      this.logger.error(`Webhook amount mismatch on ${reference}: ${kobo} kobo vs ${payment.amount} NGN`);
      return { status: 'ok' };
    }
    if (payment.channel === WALLET_FUND) {
      await this.creditWalletFund(reference);
    } else {
      await this.confirm(reference, parsed.data.channel ?? null);
    }
    return { status: 'ok' };
  }

  // ---- wallet top-ups (shared with WalletService) ----

  /** Records a pending wallet top-up so only its owner can later claim it. */
  async createWalletFund(userId: string, amount: number): Promise<string> {
    const reference = ledgerRef('WF');
    await this.db.query(
      `INSERT INTO payments (id, user_id, reference, order_id, booking_id, amount, currency, status, provider, channel, created_at, updated_at)
       VALUES ($1,$2,$3,NULL,NULL,$4,'NGN','pending','paystack',$5,NOW(),NOW())`,
      [randomUUID(), userId, reference, amount, WALLET_FUND],
    );
    return reference;
  }

  async findWalletFund(reference: string) {
    return this.db.queryOne<any>(
      `SELECT user_id, reference, amount, status FROM payments WHERE reference = $1 AND channel = $2`,
      [reference, WALLET_FUND],
    );
  }

  /** Paystack's view of a top-up reference (for WalletService.fundVerify). */
  walletFundState(reference: string) {
    return this.askPaystack(reference);
  }

  /**
   * Credits a wallet top-up exactly once. Claiming the payments row first means
   * a replay, a double-tap, or verify + webhook together credits only once.
   */
  async creditWalletFund(reference: string): Promise<{ credited: boolean; balance: number | null }> {
    return this.db.transaction(async (client) => {
      const claimed = (
        await client.query(
          `UPDATE payments SET status = 'success', updated_at = NOW()
           WHERE reference = $1 AND channel = $2 AND status <> 'success'
           RETURNING user_id, amount`,
          [reference, WALLET_FUND],
        )
      ).rows[0];
      if (!claimed) return { credited: false, balance: null };
      const balance = await creditWallet(
        client,
        claimed.user_id,
        Number(claimed.amount),
        'Wallet funding via Paystack',
        reference,
      );
      return { credited: true, balance };
    });
  }
}
