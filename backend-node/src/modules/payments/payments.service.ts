import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';

const GIFT_COMMISSION_PERCENT = Number(process.env.GIFT_COMMISSION_PERCENT ?? '10.0');
const BEAUTY_COMMISSION_PERCENT = Number(process.env.BEAUTY_COMMISSION_PERCENT ?? '10.0');
const PAYOUT_HOLD_HOURS = 24;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaymentRow {
  reference: string;
  order_id: string | null;
  booking_id: string | null;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly db: DatabaseService) {}

  private get secretKey(): string {
    const live = (process.env.PAYSTACK_LIVE || 'false').toLowerCase() === 'true';
    return live
      ? process.env.PAYSTACK_LIVE_SECRET_KEY || ''
      : process.env.PAYSTACK_TEST_SECRET_KEY || '';
  }

  private reference(): string {
    return 'QG-PAY-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  }

  // ---- post-payment side effects (all run on a transaction client) ----

  private async createPayoutForOrder(client: PoolClient, order: any) {
    const items = (
      await client.query(
        `SELECT product_id, total_price FROM order_items WHERE order_id = $1`,
        [order.id],
      )
    ).rows;
    for (const item of items) {
      const product = (
        await client.query(`SELECT id, vendor_id FROM products WHERE id = $1`, [
          item.product_id,
        ])
      ).rows[0];
      if (!product) continue;
      const commission = item.total_price * (GIFT_COMMISSION_PERCENT / 100);
      const providerAmount = item.total_price - commission;
      if (product.vendor_id) {
        const provider = (
          await client.query(
            `SELECT id, user_id FROM providers WHERE id = $1`,
            [product.vendor_id],
          )
        ).rows[0];
        if (provider) {
          await client.query(
            `INSERT INTO payouts (id, provider_id, user_id, order_id, booking_id, amount, commission, status, hold_until, created_at, updated_at)
             VALUES ($1,$2,$3,$4,NULL,$5,$6,'held',NOW() + interval '${PAYOUT_HOLD_HOURS} hours',NOW(),NOW())`,
            [randomUUID(), provider.id, provider.user_id, order.id, providerAmount, commission],
          );
        }
      }
    }
  }

  private async createPayoutForBooking(client: PoolClient, booking: any) {
    const provider = (
      await client.query(`SELECT id, user_id FROM providers WHERE id = $1`, [
        booking.provider_id,
      ])
    ).rows[0];
    if (!provider) return;
    const commission = booking.price * (BEAUTY_COMMISSION_PERCENT / 100);
    const providerAmount = booking.price - commission;
    await client.query(
      `INSERT INTO payouts (id, provider_id, user_id, order_id, booking_id, amount, commission, status, hold_until, created_at, updated_at)
       VALUES ($1,$2,$3,NULL,$4,$5,$6,'held',NOW() + interval '${PAYOUT_HOLD_HOURS} hours',NOW(),NOW())`,
      [randomUUID(), booking.provider_id, provider.user_id, booking.id, providerAmount, commission],
    );
  }

  private async notifyVendorsOfOrder(client: PoolClient, order: any) {
    const items = (
      await client.query(
        `SELECT product_id, product_name, quantity FROM order_items WHERE order_id = $1`,
        [order.id],
      )
    ).rows;
    const notified = new Set<string>();
    for (const item of items) {
      const product = (
        await client.query(`SELECT vendor_id FROM products WHERE id = $1`, [
          item.product_id,
        ])
      ).rows[0];
      if (!product?.vendor_id || notified.has(product.vendor_id)) continue;
      notified.add(product.vendor_id);
      const provider = (
        await client.query(`SELECT user_id FROM providers WHERE id = $1`, [
          product.vendor_id,
        ])
      ).rows[0];
      if (!provider) continue;
      await client.query(
        `INSERT INTO notifications (id, user_id, title, description, type, is_read, created_at)
         VALUES ($1,$2,'New Order!',$3,'system',false,NOW())`,
        [
          randomUUID(),
          provider.user_id,
          `Order ${order.order_number}: ${item.product_name} x${item.quantity}`,
        ],
      );
    }
  }

  private async createPendingDelivery(client: PoolClient, order: any) {
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

  private async processSuccessfulPayment(client: PoolClient, payment: PaymentRow) {
    if (payment.order_id) {
      const order = (
        await client.query(`SELECT * FROM orders WHERE id = $1`, [payment.order_id])
      ).rows[0];
      if (order) {
        await client.query(
          `UPDATE orders SET payment_status='paid', payment_ref=$1, status='confirmed', updated_at=NOW() WHERE id=$2`,
          [payment.reference, order.id],
        );
        await this.createPayoutForOrder(client, order);
        await this.notifyVendorsOfOrder(client, order);
        await this.createPendingDelivery(client, order);
      }
    }
    if (payment.booking_id) {
      const booking = (
        await client.query(
          `SELECT id, provider_id, price FROM bookings WHERE id = $1`,
          [payment.booking_id],
        )
      ).rows[0];
      if (booking) {
        await client.query(
          `UPDATE bookings SET payment_status='paid', payment_ref=$1, status='confirmed', updated_at=NOW() WHERE id=$2`,
          [payment.reference, booking.id],
        );
        await this.createPayoutForBooking(client, booking);
      }
    }
  }

  // ---- endpoints ----

  async initialize(userId: string, req: any) {
    const reference = this.reference();
    const method = req?.method || 'card';
    const amount = Number(req?.amount);

    if (method === 'wallet') {
      return this.db.transaction(async (client) => {
        const user = (
          await client.query(`SELECT id, wallet_balance FROM users WHERE id = $1`, [userId])
        ).rows[0];
        if (!user) throw new NotFoundException('User not found');
        if (Number(user.wallet_balance) < amount) {
          throw new BadRequestException('Insufficient wallet balance');
        }
        const newBalance = Number(user.wallet_balance) - amount;
        await client.query(`UPDATE users SET wallet_balance = $1 WHERE id = $2`, [
          newBalance,
          userId,
        ]);
        await client.query(
          `INSERT INTO payments (id, user_id, reference, order_id, booking_id, amount, currency, status, provider, channel, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'NGN','success','paystack','wallet',NOW(),NOW())`,
          [randomUUID(), userId, reference, req?.order_id ?? null, req?.booking_id ?? null, amount],
        );
        await client.query(
          `INSERT INTO transactions (id, user_id, type, amount, description, reference, balance_after, status, created_at)
           VALUES ($1,$2,'debit',$3,$4,$5,$6,'completed',NOW())`,
          [
            randomUUID(),
            userId,
            amount,
            `Payment for order ${req?.order_id || req?.booking_id}`,
            reference,
            newBalance,
          ],
        );
        await this.processSuccessfulPayment(client, {
          reference,
          order_id: req?.order_id ?? null,
          booking_id: req?.booking_id ?? null,
        });
        return { reference, status: 'success', method: 'wallet', new_balance: newBalance };
      });
    }

    // Card (Paystack) — persist a pending payment, then initialize with Paystack.
    await this.db.query(
      `INSERT INTO payments (id, user_id, reference, order_id, booking_id, amount, currency, status, provider, channel, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'NGN','pending','paystack',$7,NOW(),NOW())`,
      [randomUUID(), userId, reference, req?.order_id ?? null, req?.booking_id ?? null, amount, method],
    );

    if (this.secretKey) {
      const resp = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: req?.email || `${userId}@quickgift.ng`,
          amount: Math.round(amount * 100), // kobo
          reference,
          callback_url: req?.callback_url || 'https://quickgift.ng/payment/callback',
          currency: 'NGN',
          metadata: {
            order_id: req?.order_id ?? null,
            booking_id: req?.booking_id ?? null,
            user_id: userId,
          },
        }),
      });
      if (resp.status === 200) {
        const data: any = await resp.json();
        return {
          reference,
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
        };
      }
    }

    return {
      reference,
      authorization_url: null,
      message: 'Payment initialized (dev mode - no Paystack key configured)',
    };
  }

  async verify(reference: string, user: { user_id: string; role: string }) {
    const payment = await this.db.queryOne<any>(
      `SELECT user_id, reference, order_id, booking_id, status FROM payments WHERE reference = $1`,
      [reference],
    );
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.user_id !== user.user_id && user.role !== 'admin') {
      throw new ForbiddenException('Not authorized to verify this payment');
    }
    if (payment.status === 'success') {
      return { status: 'success', reference };
    }

    if (this.secretKey) {
      const resp = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${this.secretKey}` } },
      );
      if (resp.status === 200) {
        const data: any = (await resp.json()).data;
        const status = data.status === 'success' ? 'success' : 'failed';
        await this.db.transaction(async (client) => {
          await client.query(
            `UPDATE payments SET status=$1, channel=$2, updated_at=NOW() WHERE reference=$3`,
            [status, data.channel ?? null, reference],
          );
          if (status === 'success') {
            await this.processSuccessfulPayment(client, payment);
          }
        });
        return { status, reference };
      }
    }

    // Dev-mode auto-verify (only sets success when no key is configured).
    await this.db.transaction(async (client) => {
      if (!this.secretKey) {
        await client.query(
          `UPDATE payments SET status='success', updated_at=NOW() WHERE reference=$1`,
          [reference],
        );
      }
      await this.processSuccessfulPayment(client, payment);
    });
    return { status: 'success', reference, message: 'Dev mode auto-verified' };
  }

  async webhook(rawBody: Buffer, signature: string, parsed: any) {
    if (this.secretKey) {
      const expected = createHmac('sha512', this.secretKey)
        .update(rawBody)
        .digest('hex');
      if (signature !== expected) {
        throw new BadRequestException('Invalid signature');
      }
    }
    if (parsed?.event === 'charge.success') {
      const reference = parsed.data.reference;
      const payment = await this.db.queryOne<any>(
        `SELECT reference, order_id, booking_id, status FROM payments WHERE reference = $1`,
        [reference],
      );
      if (payment && payment.status !== 'success') {
        await this.db.transaction(async (client) => {
          await client.query(
            `UPDATE payments SET status='success', channel=$1, updated_at=NOW() WHERE reference=$2`,
            [parsed.data.channel ?? null, reference],
          );
          await this.processSuccessfulPayment(client, payment);
        });
      }
    }
    return { status: 'ok' };
  }
}
