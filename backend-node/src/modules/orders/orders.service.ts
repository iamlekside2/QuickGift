import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { NotifyService } from '../../common/notify.service';
import { MailService } from '../../common/mail.service';
import { SettingsService } from '../../common/settings.service';

const DELIVERY_BASE_FEE = 0;
const EXPRESS_MULTIPLIER = 1.0;

// OrderResponse = curated subset of the orders table.
const ORDER_FIELDS = `id, order_number, user_id, order_type, status, subtotal,
  delivery_fee, total, delivery_address, delivery_city, recipient_name,
  personal_message, is_anonymous, is_express, payment_status, created_at`;

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

  async createOrder(userId: string, req: any) {
    const items: Array<{ product_id: string; quantity: number }> =
      req?.items ?? [];
    if (!items.length) throw new BadRequestException('items is required');

    const ids = items.map((i) => i.product_id);
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
      const qty = item.quantity ?? 1;
      const itemTotal = product.price * qty;
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
    await this.db.transaction(async (client) => {
      await client.query(
        `INSERT INTO orders
          (id, order_number, user_id, order_type, status, subtotal, delivery_fee, commission, total,
           delivery_address, delivery_city, delivery_lat, delivery_lng,
           recipient_name, recipient_phone, personal_message, is_anonymous, is_express,
           scheduled_date, payment_status, created_at, updated_at)
         VALUES ($1,$2,$3,'gift','pending',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending',NOW(),NOW())`,
        [
          orderId,
          this.orderNumber(),
          userId,
          subtotal,
          deliveryFee,
          commission,
          total,
          req?.delivery_address,
          req?.delivery_city ?? null,
          req?.delivery_lat ?? null,
          req?.delivery_lng ?? null,
          req?.recipient_name ?? null,
          req?.recipient_phone ?? null,
          req?.personal_message ?? null,
          req?.is_anonymous ?? false,
          req?.is_express ?? false,
          req?.scheduled_date ?? null,
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
    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 20);
    params.push(perPage, (page - 1) * perPage);
    return this.db.query(
      `SELECT ${ORDER_FIELDS} FROM orders WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
  }

  async cancelOrder(orderId: string, user: AuthUser) {
    const order = await this.db.queryOne<any>(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!order) throw new NotFoundException('Order not found');
    if (order.user_id !== user.user_id && user.role !== 'admin') {
      throw new ForbiddenException('Not authorized');
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order in '${order.status}' status`,
      );
    }

    let refunded = false;
    await this.db.transaction(async (client) => {
      if (order.payment_status === 'paid') {
        const buyer = await client
          .query(`SELECT id, wallet_balance FROM users WHERE id = $1`, [order.user_id])
          .then((r) => r.rows[0]);
        if (buyer) {
          const newBalance = Number(buyer.wallet_balance) + Number(order.total);
          await client.query(
            `UPDATE users SET wallet_balance = $1 WHERE id = $2`,
            [newBalance, buyer.id],
          );
          const ref = 'RFD-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
          await client.query(
            `INSERT INTO transactions (id, user_id, type, amount, description, reference, balance_after, status, created_at)
             VALUES ($1,$2,'credit',$3,$4,$5,$6,'completed',NOW())`,
            [
              randomUUID(),
              buyer.id,
              order.total,
              `Refund for cancelled order ${order.order_number}`,
              ref,
              newBalance,
            ],
          );
          refunded = true;
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
          `UPDATE orders SET status = 'cancelled', payment_status = 'refunded', updated_at = NOW() WHERE id = $1`,
          [orderId],
        );
      } else {
        await client.query(
          `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
          [orderId],
        );
      }
    });

    // Notify buyer
    if (refunded) {
      await this.notifier.notify(
        order.user_id,
        'Order Cancelled & Refunded',
        `Order ${order.order_number} has been cancelled. ${this.naira(order.total)} refunded to your wallet.`,
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
      refund_amount: refunded ? order.total : 0,
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
    let sql = `SELECT * FROM orders WHERE id = ANY($1::text[])`;
    if (q.status) {
      params.push(q.status);
      sql += ` AND status = $${params.length}`;
    }
    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 20);
    params.push(perPage, (page - 1) * perPage);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    return this.db.query(sql, params);
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
    await this.db.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, orderId],
    );
    return this.db.queryOne(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  }

  async getOrder(orderId: string, user: AuthUser) {
    const order = await this.db.queryOne<any>(
      `SELECT ${ORDER_FIELDS} FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!order) throw new NotFoundException('Order not found');
    if (order.user_id !== user.user_id && user.role !== 'admin') {
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
    await this.db.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, orderId],
    );
    const label = status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    await this.notifier.notify(
      order.user_id,
      `Order ${label}`,
      `Your order ${order.order_number} is now ${label.toLowerCase()}`,
      'system',
    );
    return this.reload(orderId);
  }
}
