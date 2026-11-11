import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { NotifyService } from '../../common/notify.service';
import { SecurityService } from '../../common/security.service';

const MIN_ADDRESS = 8;
const MAX_ADDRESS = 300;

/**
 * "I don't know their address" gifts.
 *
 * The buyer places and pays for the order with no delivery address. The order
 * carries a long random `claim_token`; the buyer shares a link containing it
 * with the recipient, who opens a public page and says where to deliver. The
 * link works once, only for a paid order that has not been cancelled, and the
 * page never shows what the gift is. Until the address is in, the order
 * cannot be dispatched. The buyer can also fill the address in themselves.
 */
@Injectable()
export class GiftClaimService implements OnModuleInit {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifier: NotifyService,
    private readonly security: SecurityService,
  ) {}

  async onModuleInit() {
    await this.db.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS address_pending      BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS claim_token          VARCHAR(64),
        ADD COLUMN IF NOT EXISTS address_confirmed_at TIMESTAMP
    `);
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_claim_token
       ON orders (claim_token) WHERE claim_token IS NOT NULL`,
    );
  }

  private firstName(fullName?: string | null): string {
    return String(fullName || '').trim().split(/\s+/)[0] || '';
  }

  /** Validates what a person typed for a delivery address. */
  private clean(body: any, phoneRequired: boolean) {
    const address = String(body?.delivery_address ?? body?.address ?? '').trim().replace(/\s+/g, ' ');
    if (address.length < MIN_ADDRESS) {
      throw new BadRequestException('Please enter the full delivery address, with the street and area');
    }
    if (address.length > MAX_ADDRESS) {
      throw new BadRequestException(`The address is too long (${MAX_ADDRESS} characters at most)`);
    }
    const city = String(body?.delivery_city ?? body?.city ?? '').trim().slice(0, 60) || null;
    const rawPhone = String(body?.recipient_phone ?? body?.phone ?? '').trim();
    if (!rawPhone && phoneRequired) {
      throw new BadRequestException('Please enter a phone number the rider can call');
    }
    if (rawPhone && !this.security.validateNigerianPhone(rawPhone)) {
      throw new BadRequestException('Please enter a valid Nigerian phone number (e.g. 08012345678)');
    }
    return { address, city, phone: rawPhone || null };
  }

  /**
   * Writes the address onto the order exactly once (the `address_pending`
   * condition is the claim), then makes sure the delivery record carries it.
   */
  private async apply(
    client: PoolClient,
    where: { token?: string; orderId?: string; userId?: string },
    v: { address: string; city: string | null; phone: string | null },
    requirePaid: boolean,
  ) {
    const params: any[] = [v.address, v.city, v.phone];
    const cond: string[] = [`address_pending = true`, `status <> 'cancelled'`];
    if (where.token) { params.push(where.token); cond.push(`claim_token = $${params.length}`); }
    if (where.orderId) { params.push(where.orderId); cond.push(`id = $${params.length}`); }
    if (where.userId) { params.push(where.userId); cond.push(`user_id = $${params.length}`); }
    if (requirePaid) cond.push(`payment_status = 'paid'`);
    const order = (
      await client.query(
        `UPDATE orders SET delivery_address = $1,
                delivery_city = COALESCE($2, delivery_city),
                recipient_phone = COALESCE($3, recipient_phone),
                address_pending = false, address_confirmed_at = NOW(), updated_at = NOW()
         WHERE ${cond.join(' AND ')}
         RETURNING *`,
        params,
      )
    ).rows[0];
    if (!order) return null;

    if (order.payment_status === 'paid') {
      const updated = await client.query(
        `UPDATE deliveries SET delivery_address = $1, delivery_name = $2, delivery_phone = $3, updated_at = NOW()
         WHERE order_id = $4`,
        [order.delivery_address, order.recipient_name, order.recipient_phone, order.id],
      );
      if (!updated.rowCount) {
        await client.query(
          `INSERT INTO deliveries (id, order_id, user_id, status, delivery_address, delivery_name, delivery_phone, delivery_fee, vehicle_type, created_at, updated_at)
           VALUES ($1,$2,$3,'pending',$4,$5,$6,0,'motorcycle',NOW(),NOW())`,
          [randomUUID(), order.id, order.user_id, order.delivery_address, order.recipient_name, order.recipient_phone],
        );
      }
    }
    return order;
  }

  /** Tells the sellers on this order that it can now be delivered. */
  private async notifySellers(order: any) {
    const sellers = await this.db.query<{ user_id: string }>(
      `SELECT DISTINCT pr.user_id FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN providers pr ON pr.id = p.vendor_id
        WHERE oi.order_id = $1`,
      [order.id],
    );
    for (const s of sellers) {
      await this.notifier
        .notify(
          s.user_id,
          'Delivery address confirmed',
          `Order ${order.order_number} now has a delivery address and is ready to prepare.`,
          'system',
        )
        .catch(() => undefined);
    }
  }

  private async byToken(token: string) {
    const t = String(token || '').trim();
    if (t.length < 20 || t.length > 64) return null;
    return this.db.queryOne<any>(
      `SELECT o.id, o.status, o.payment_status, o.address_pending, o.recipient_name,
              o.personal_message, o.is_anonymous, o.scheduled_date, u.full_name AS sender
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       WHERE o.claim_token = $1`,
      [t],
    );
  }

  /**
   * GET /gifts/claim/:token. What the recipient's page shows. It never says
   * what the gift is, and names the sender only when the gift is not anonymous.
   */
  async view(token: string) {
    const o = await this.byToken(token);
    if (!o) throw new NotFoundException('This gift link is not valid');
    let state: 'waiting' | 'confirmed' | 'unavailable' = 'waiting';
    if (o.status === 'cancelled' || o.payment_status !== 'paid') state = 'unavailable';
    else if (!o.address_pending) state = 'confirmed';
    return {
      state,
      recipient_name: o.recipient_name,
      sender_name: o.is_anonymous ? null : this.firstName(o.sender) || null,
      message: state === 'unavailable' ? null : o.personal_message,
      scheduled_date: o.scheduled_date ? new Date(o.scheduled_date).toISOString().slice(0, 10) : null,
    };
  }

  /** POST /gifts/claim/:token. The recipient says where to deliver. */
  async confirm(token: string, body: any) {
    const o = await this.byToken(token);
    if (!o) throw new NotFoundException('This gift link is not valid');
    if (o.status === 'cancelled' || o.payment_status !== 'paid') {
      throw new BadRequestException('This gift is no longer available');
    }
    if (!o.address_pending) {
      throw new BadRequestException('The delivery address for this gift has already been confirmed');
    }
    const v = this.clean(body, true);
    const order = await this.db.transaction((client) =>
      this.apply(client, { token: String(token).trim() }, v, true),
    );
    if (!order) {
      throw new BadRequestException('The delivery address for this gift has already been confirmed');
    }
    await this.notifier
      .notify(
        order.user_id,
        'Delivery address confirmed',
        `${order.recipient_name || 'Your recipient'} has confirmed where to deliver order ${order.order_number}. We are getting it ready.`,
        'system',
      )
      .catch(() => undefined);
    await this.notifySellers(order);
    return { state: 'confirmed' };
  }

  /** POST /orders/:id/address. The buyer fills the address in themselves. */
  async setByBuyer(orderId: string, userId: string, body: any) {
    const o = await this.db.queryOne<any>(
      `SELECT id, user_id, status, address_pending FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!o) throw new NotFoundException('Order not found');
    if (o.user_id !== userId) throw new ForbiddenException('Not authorized');
    if (o.status === 'cancelled') throw new BadRequestException('This order was cancelled');
    if (!o.address_pending) {
      throw new BadRequestException('This order already has a delivery address');
    }
    const v = this.clean(body, false);
    const order = await this.db.transaction((client) =>
      this.apply(client, { orderId, userId }, v, false),
    );
    if (!order) throw new BadRequestException('This order already has a delivery address');
    if (order.payment_status === 'paid') await this.notifySellers(order);
    return { status: 'ok', delivery_address: order.delivery_address, address_pending: false };
  }
}
