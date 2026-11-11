import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { NotifyService } from '../../common/notify.service';
import { MailService } from '../../common/mail.service';
import { SettingsService } from '../../common/settings.service';
import { ReferralService } from '../../common/referral.service';
import { PromoService } from '../../common/promo.service';
import { creditWallet, ledgerRef } from '../../common/ledger';
import { paging } from '../../common/paging';
import { roleHasPermission } from '../../common/permissions';

const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY = 99;

// A gift can be booked for a delivery day up to this far ahead.
const MAX_SCHEDULE_DAYS = 90;
const MAX_MESSAGE_LENGTH = 500;
// Nigeria is UTC+1 all year: "today" for a delivery date is the Lagos date.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

// Where the recipient's "tell us where to deliver" page lives.
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://www.quickgift.ng').replace(/\/+$/, '');
const ADDRESS_BLOCKED =
  'The recipient has not confirmed the delivery address yet, so this order cannot be sent out.';

const DELIVERY_BASE_FEE = 0;
const EXPRESS_MULTIPLIER = 1.0;

// OrderResponse = curated subset of the orders table.
const ORDER_FIELDS = `id, order_number, user_id, order_type, status, subtotal,
  delivery_fee, total, delivery_address, delivery_city, recipient_name,
  personal_message, is_anonymous, is_express, scheduled_date, discount, promo_code,
  address_pending,
  EXISTS (SELECT 1 FROM gift_pools gp WHERE gp.order_id = orders.id) AS group_gift,
  CASE WHEN address_pending AND claim_token IS NOT NULL
       THEN '${SITE_URL}/gift/?t=' || claim_token END AS claim_url,
  payment_status, created_at`;

const ORDER_ITEM_FIELDS = `id, product_id, product_name, vendor_name, quantity, unit_price, total_price`;

interface AuthUser {
  user_id: string;
  role: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifier: NotifyService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
    private readonly referrals: ReferralService,
    private readonly promos: PromoService,
  ) {}

  private orderNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return 'QG-' + s;
  }

  private naira(n: number): string {
    return `₦${Math.round(n).toLocaleString('en-US')}`;
  }

  private reload(orderId: string) {
    return this.db.queryOne(
      `SELECT ${ORDER_FIELDS} FROM orders WHERE id = $1`,
      [orderId],
    );
  }

  /**
   * The requested delivery day as YYYY-MM-DD, or null for "as soon as
   * possible". Must be a real date, not in the past, and not too far ahead.
   */
  private scheduledDate(raw: unknown): string | null {
    if (raw === undefined || raw === null || raw === '') return null;
    const day = String(raw).slice(0, 10);
    const at = /^\d{4}-\d{2}-\d{2}$/.test(day) ? Date.parse(day + 'T00:00:00Z') : NaN;
    if (Number.isNaN(at) || new Date(at).toISOString().slice(0, 10) !== day) {
      throw new BadRequestException('The delivery date is not valid');
    }
    const lagosNow = Date.now() + LAGOS_OFFSET_MS;
    const today = new Date(lagosNow).toISOString().slice(0, 10);
    const latest = new Date(lagosNow + MAX_SCHEDULE_DAYS * 86400000).toISOString().slice(0, 10);
    if (day < today) throw new BadRequestException('The delivery date cannot be in the past');
    if (day > latest) {
      throw new BadRequestException(
        `Delivery can be scheduled up to ${MAX_SCHEDULE_DAYS} days ahead`,
      );
    }
    return day;
  }

  async createOrder(userId: string, req: any) {
    const items: Array<{ product_id: string; quantity: number }> = Array.isArray(req?.items)
      ? req.items
      : [];
    if (!items.length) throw new BadRequestException('items is required');
    if (items.length > MAX_LINE_ITEMS) {
      throw new BadRequestException(`An order can have at most ${MAX_LINE_ITEMS} different items`);
    }
    // "I don't know their address": the recipient confirms it later through a
    // link (see GiftClaimService). Everything else about the order is normal.
    const addressPending = req?.address_pending === true;
    const deliveryAddress = String(req?.delivery_address ?? '').trim();
    if (!addressPending && !deliveryAddress) {
      throw new BadRequestException('A delivery address is required');
    }
    if (addressPending && !String(req?.recipient_name ?? '').trim()) {
      throw new BadRequestException("Please enter the recipient's name");
    }

    const scheduledDate = this.scheduledDate(req?.scheduled_date);
    const personalMessage = req?.personal_message
      ? String(req.personal_message).trim().slice(0, MAX_MESSAGE_LENGTH) || null
      : null;

    const ids = items.map((i) => String(i?.product_id ?? ''));
    const products = await this.db.query<any>(
      `SELECT id, name, vendor_name, price, status FROM products WHERE id = ANY($1::text[])`,
      [ids],
    );
    const map = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemsData: any[] = [];
    for (const item of items) {
      const product = map.get(item.product_id);
      if (!product) {
        throw new NotFoundException(`Product ${item.product_id} not found`);
      }
      if (product.status !== 'active') {
        throw new BadRequestException(`"${product.name}" is currently unavailable`);
      }
      // Whole units only, 1..MAX_QUANTITY. A negative or fractional quantity
      // would otherwise discount the order (and produce negative payouts).
      const qty = item.quantity === undefined || item.quantity === null ? 1 : Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) {
        throw new BadRequestException(
          `Quantity for "${product.name}" must be a whole number between 1 and ${MAX_QUANTITY}`,
        );
      }
      const itemTotal = Number(product.price) * qty;
      subtotal += itemTotal;
      itemsData.push({
        product_id: product.id,
        product_name: product.name,
        vendor_name: product.vendor_name,
        quantity: qty,
        unit_price: product.price,
        total_price: itemTotal,
      });
    }

    if (!(subtotal > 0)) throw new BadRequestException('Order total must be greater than zero');

    const minOrder = await this.settings.getMinOrderAmount();
    if (minOrder > 0 && subtotal < minOrder) {
      throw new BadRequestException(
        `Minimum order is ${this.naira(minOrder)}. Please add more to your cart.`,
      );
    }

    let deliveryFee = DELIVERY_BASE_FEE;
    if (req?.is_express) deliveryFee *= EXPRESS_MULTIPLIER;
    const giftCommissionPct = await this.settings.getGiftCommission();
    const commission = subtotal * (giftCommissionPct / 100);
    const total = subtotal + deliveryFee;

    const orderId = randomUUID();
    // A promo code takes money off what the buyer pays. Sellers are still paid
    // on the full item price (payouts are per item), so the platform carries it.
    let discount = 0;
    let promoCode: string | null = null;
    await this.db.transaction(async (client) => {
      if (req?.promo_code) {
        // Throws (and rolls this order back) if the code cannot be used.
        const applied = await this.promos.redeem(client, userId, req.promo_code, subtotal, orderId);
        discount = applied.discount;
        promoCode = applied.code;
      }
      await client.query(
        `INSERT INTO orders
          (id, order_number, user_id, order_type, status, subtotal, delivery_fee, commission, total,
           delivery_address, delivery_city, delivery_lat, delivery_lng,
           recipient_name, recipient_phone, personal_message, is_anonymous, is_express,
           scheduled_date, payment_status, created_at, updated_at, discount, promo_code,
           address_pending, claim_token)
         VALUES ($1,$2,$3,'gift','pending',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending',NOW(),NOW(),$18,$19,$20,$21)`,
        [
          orderId,
          this.orderNumber(),
          userId,
          subtotal,
          deliveryFee,
          commission,
          total - discount,
          addressPending ? null : deliveryAddress,
          req?.delivery_city ?? null,
          req?.delivery_lat ?? null,
          req?.delivery_lng ?? null,
          req?.recipient_name ?? null,
          req?.recipient_phone ?? null,
          personalMessage,
          req?.is_anonymous === true,
          req?.is_express ?? false,
          scheduledDate,
          discount,
          promoCode,
          addressPending,
          addressPending ? randomBytes(24).toString('base64url') : null,
        ],
      );
      for (const it of itemsData) {
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, vendor_name, quantity, unit_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            randomUUID(),
            orderId,
            it.product_id,
            it.product_name,
            it.vendor_name,
            it.quantity,
            it.unit_price,
            it.total_price,
          ],
        );
      }
    });

    const order = await this.reload(orderId);
    void this.mail.sendAdminNotification('New order placed', [
      `Order: ${(order as any)?.order_number ?? '—'}`,
      `Total: ${this.naira((order as any)?.total ?? total)}`,
      `Items: ${itemsData.length}`,
      `Status: pending`,
    ]);
    return order;
  }

  async listOrders(userId: string, q: any) {
    const where = ['user_id = $1'];
    const params: any[] = [userId];
    if (q.status) {
      params.push(q.status);
      where.push(`status = $${params.length}`);
    }
    if (q.order_type) {
      params.push(q.order_type);
      where.push(`order_type = $${params.length}`);
    }
    const { perPage, offset } = paging(q);
    params.push(perPage, offset);
    return this.db.query(
      `SELECT ${ORDER_FIELDS} FROM orders WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
  }

  /**
   * Cancels an order exactly once and refunds it if it was paid.
   *
   * The status change is the first statement and is conditional, so two
   * simultaneous cancels (or a cancel racing a status change) cannot both
   * refund. The refund is what was actually paid. Returns null when the order
   * was not in a cancellable state.
   */
  private async cancelAndRefund(orderId: string) {
    // A group gift's money belongs to the people who chipped in. Cancelling
    // its order here would refund the organiser's wallet instead of them.
    const pooled = await this.db.queryOne(
      `SELECT 1 FROM gift_pools WHERE order_id = $1 AND status IN ('open','funding','funded')`,
      [orderId],
    );
    if (pooled) {
      throw new BadRequestException(
        'This order belongs to a group gift. Cancel the group gift instead, so everyone who chipped in is refunded.',
      );
    }
    return this.db.transaction(async (client) => {
      const order = (
        await client.query(
          `UPDATE orders SET status = 'cancelled', updated_at = NOW()
           WHERE id = $1 AND status IN ('pending','confirmed')
           RETURNING *`,
          [orderId],
        )
      ).rows[0];
      if (!order) return null;

      let refundAmount = 0;
      if (order.payment_status === 'paid') {
        const released = (
          await client.query(
            `SELECT 1 FROM payouts WHERE order_id = $1 AND status = 'paid' LIMIT 1`,
            [orderId],
          )
        ).rows[0];
        if (released) {
          // The seller has already been paid out; refunding here would leave
          // the platform out of pocket. This needs a dispute, not a cancel.
          throw new BadRequestException(
            'The payout for this order has already been released. Please raise a dispute instead.',
          );
        }
        const paid = order.payment_ref
          ? (
              await client.query(
                `SELECT amount FROM payments WHERE reference = $1 AND status = 'success'`,
                [order.payment_ref],
              )
            ).rows[0]
          : null;
        refundAmount = Number(paid?.amount ?? order.total);
        if (refundAmount > 0) {
          await creditWallet(
            client,
            order.user_id,
            refundAmount,
            `Refund for cancelled order ${order.order_number}`,
            ledgerRef('RFD'),
          );
        }
        await client.query(
          `UPDATE payouts SET status = 'cancelled', updated_at = NOW()
           WHERE order_id = $1 AND status IN ('pending','held')`,
          [orderId],
        );
        if (order.payment_ref) {
          await client.query(
            `UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE reference = $1`,
            [order.payment_ref],
          );
        }
        await client.query(
          `UPDATE orders SET payment_status = 'refunded', updated_at = NOW() WHERE id = $1`,
          [orderId],
        );
      }
      return { order, refunded: refundAmount > 0, refundAmount };
    });
  }

  async cancelOrder(orderId: string, user: AuthUser) {
    const existing = await this.db.queryOne<any>(
      `SELECT id, user_id, status FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!existing) throw new NotFoundException('Order not found');
    const isStaff = roleHasPermission(user.role, 'orders.manage');
    if (existing.user_id !== user.user_id && !isStaff) {
      throw new ForbiddenException('Not authorized');
    }

    const result = await this.cancelAndRefund(orderId);
    if (!result) {
      throw new BadRequestException(
        `Cannot cancel order in '${existing.status}' status`,
      );
    }
    const { order, refunded, refundAmount } = result;

    // Notify buyer
    if (refunded) {
      await this.notifier.notify(
        order.user_id,
        'Order Cancelled & Refunded',
        `Order ${order.order_number} has been cancelled. ${this.naira(refundAmount)} refunded to your wallet.`,
        'payment',
      ).catch(() => undefined);
    } else {
      await this.notifier.notify(
        order.user_id,
        'Order Cancelled',
        `Order ${order.order_number} has been cancelled.`,
        'system',
      ).catch(() => undefined);
    }

    // Notify vendor(s)
    const items = await this.db.query<any>(
      `SELECT product_id, product_name FROM order_items WHERE order_id = $1`,
      [orderId],
    );
    const notified = new Set<string>();
    for (const item of items) {
      const prod = await this.db.queryOne<any>(
        `SELECT vendor_id FROM products WHERE id = $1`,
        [item.product_id],
      );
      if (prod?.vendor_id && !notified.has(prod.vendor_id)) {
        const prov = await this.db.queryOne<any>(
          `SELECT user_id FROM providers WHERE id = $1`,
          [prod.vendor_id],
        );
        if (prov) {
          await this.notifier.notify(
            prov.user_id,
            'Order Cancelled',
            `Order ${order.order_number} for ${item.product_name} has been cancelled by the buyer.`,
            'system',
          ).catch(() => undefined);
          notified.add(prod.vendor_id);
        }
      }
    }

    return {
      status: 'cancelled',
      order_id: orderId,
      refunded,
      refund_amount: refundAmount,
    };
  }

  async listVendorOrders(userId: string, q: any) {
    const provider = await this.db.queryOne<any>(
      `SELECT id FROM providers WHERE user_id = $1`,
      [userId],
    );
    if (!provider) return [];

    const idRows = await this.db.query<{ order_id: string }>(
      `SELECT DISTINCT oi.order_id FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE p.vendor_id = $1`,
      [provider.id],
    );
    const orderIds = idRows.map((r) => r.order_id);
    if (!orderIds.length) return [];

    const params: any[] = [orderIds];
    // The seller needs the sender's name for the gift card, unless the buyer
    // asked to stay anonymous: then the name is never sent to the seller.
    let sql = `SELECT o.*, CASE WHEN o.is_anonymous THEN NULL ELSE u.full_name END AS sender_name
               FROM orders o LEFT JOIN users u ON u.id = o.user_id
               WHERE o.id = ANY($1::text[])`;
    if (q.status) {
      params.push(q.status);
      sql += ` AND o.status = $${params.length}`;
    }
    const { perPage, offset } = paging(q);
    params.push(perPage, offset);
    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const rows = await this.db.query<any>(sql, params);
    // The claim token lets its holder set the delivery address: buyer only.
    return rows.map(({ claim_token, ...rest }) => rest);
  }

  async providerUpdateStatus(orderId: string, userId: string, status: string) {
    const provider = await this.db.queryOne<any>(
      `SELECT id FROM providers WHERE user_id = $1`,
      [userId],
    );
    if (!provider) throw new ForbiddenException('Not a provider');

    const hasItems = await this.db.queryOne(
      `SELECT oi.id FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1 AND p.vendor_id = $2 LIMIT 1`,
      [orderId, provider.id],
    );
    if (!hasItems) {
      throw new ForbiddenException("This order doesn't contain your products");
    }

    const order = await this.db.queryOne<any>(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!order) throw new NotFoundException('Order not found');

    const transitions: Record<string, string[]> = {
      confirmed: ['in_transit'],
      in_transit: ['delivered'],
    };
    if (!(transitions[order.status] ?? []).includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}`,
      );
    }
    if (order.address_pending) throw new BadRequestException(ADDRESS_BLOCKED);
    const moved = await this.db.queryOne(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2 AND status = $3 RETURNING id`,
      [status, orderId, order.status],
    );
    if (!moved) throw new BadRequestException('This order was just updated. Please refresh.');
    if (status === 'delivered') await this.referrals.onPurchaseFulfilled(order.user_id);
    return this.db.queryOne(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  }

  async getOrder(orderId: string, user: AuthUser) {
    const order = await this.db.queryOne<any>(
      `SELECT ${ORDER_FIELDS} FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!order) throw new NotFoundException('Order not found');
    if (order.user_id !== user.user_id && !roleHasPermission(user.role, 'orders.view')) {
      throw new ForbiddenException('Not authorized');
    }
    const items = await this.db.query(
      `SELECT ${ORDER_ITEM_FIELDS} FROM order_items WHERE order_id = $1`,
      [orderId],
    );
    return { ...order, items };
  }

  async updateStatus(orderId: string, status: string) {
    const order = await this.db.queryOne<any>(
      `SELECT ${ORDER_FIELDS} FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!order) throw new NotFoundException('Order not found');

    const valid: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_transit', 'cancelled'],
      in_transit: ['delivered'],
      delivered: [],
      cancelled: [],
    };
    if (!(valid[order.status] ?? []).includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}`,
      );
    }
    if (status === 'cancelled') {
      // Go through the refunding path so a paid order is never cancelled
      // without returning the money and stopping the payout.
      const result = await this.cancelAndRefund(orderId);
      if (!result) throw new BadRequestException('This order was just updated. Please refresh.');
      await this.notifier
        .notify(
          order.user_id,
          result.refunded ? 'Order Cancelled & Refunded' : 'Order Cancelled',
          result.refunded
            ? `Order ${order.order_number} has been cancelled. ${this.naira(result.refundAmount)} refunded to your wallet.`
            : `Order ${order.order_number} has been cancelled.`,
          result.refunded ? 'payment' : 'system',
        )
        .catch(() => undefined);
      return this.reload(orderId);
    }

    if (order.address_pending && ['in_transit', 'delivered'].includes(status)) {
      throw new BadRequestException(ADDRESS_BLOCKED);
    }
    const moved = await this.db.queryOne(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2 AND status = $3 RETURNING id`,
      [status, orderId, order.status],
    );
    if (!moved) throw new BadRequestException('This order was just updated. Please refresh.');
    if (status === 'delivered') await this.referrals.onPurchaseFulfilled(order.user_id);
    const label = status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    await this.notifier.notify(
      order.user_id,
      `Order ${label}`,
      `Your order ${order.order_number} is now ${label.toLowerCase()}`,
      'system',
    ).catch(() => undefined);
    return this.reload(orderId);
  }
}
