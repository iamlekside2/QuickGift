import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';

interface AuthUser {
  user_id: string;
  role: string;
}

@Injectable()
export class DeliveryService {
  constructor(private readonly db: DatabaseService) {}

  private get kwikConfigured(): boolean {
    return !!process.env.KWIK_EMAIL;
  }

  // TODO: port the Kwik HTTP client (quote/create/track/cancel). Until then,
  // these throw so the callers fall back to estimates — exactly the behavior
  // when KWIK_EMAIL is unset (the only configured scenario today).
  private async kwikQuote(_req: any): Promise<{ amount: number }> {
    throw new Error('Kwik integration not configured');
  }

  async quote(req: any) {
    if (!this.kwikConfigured) {
      return {
        amount: 1500,
        currency: 'NGN',
        source: 'estimate',
        message: 'Kwik not configured — returning flat estimate',
      };
    }
    try {
      const q = await this.kwikQuote(req);
      return { amount: q.amount, currency: 'NGN', source: 'kwik' };
    } catch (e) {
      return { amount: 1500, currency: 'NGN', source: 'estimate', message: String(e) };
    }
  }

  async create(user: AuthUser, req: any) {
    const order = await this.db.queryOne<any>(
      `SELECT id, user_id, payment_status, total FROM orders WHERE id = $1`,
      [req?.order_id],
    );
    if (!order) throw new NotFoundException('Order not found');
    if (order.user_id !== user.user_id && user.role !== 'admin') {
      throw new ForbiddenException('Not authorized');
    }
    if (order.payment_status !== 'paid') {
      throw new BadRequestException('Order must be paid before creating delivery');
    }
    const existing = await this.db.queryOne(
      `SELECT 1 FROM deliveries WHERE order_id = $1`,
      [req.order_id],
    );
    if (existing) {
      throw new BadRequestException('Delivery already exists for this order');
    }

    const vehicleType = req?.vehicle_id === 0 || req?.vehicle_id == null ? 'motorcycle' : 'car';
    let status = 'pending';
    let deliveryFee = 0;
    let kwikOrderId: string | null = null;
    let kwikJobId: string | null = null;
    let dispatched = false;

    if (this.kwikConfigured) {
      try {
        const q = await this.kwikQuote(req);
        deliveryFee = q.amount ?? 0;
        // kwik create would go here; left as TODO
        throw new Error('Kwik dispatch not configured');
      } catch {
        status = 'pending';
        deliveryFee = 1500;
      }
    }

    const id = randomUUID();
    await this.db.transaction(async (client) => {
      await client.query(
        `INSERT INTO deliveries
          (id, order_id, user_id, status, pickup_address, pickup_lat, pickup_lng, pickup_name, pickup_phone,
           delivery_address, delivery_lat, delivery_lng, delivery_name, delivery_phone,
           delivery_fee, vehicle_type, kwik_order_id, kwik_job_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())`,
        [
          id,
          req.order_id,
          user.user_id,
          status,
          req.pickup_address,
          req.pickup_lat ?? null,
          req.pickup_lng ?? null,
          req.pickup_name,
          req.pickup_phone,
          req.delivery_address,
          req.delivery_lat ?? null,
          req.delivery_lng ?? null,
          req.delivery_name,
          req.delivery_phone,
          deliveryFee,
          vehicleType,
          kwikOrderId,
          kwikJobId,
        ],
      );
      if (dispatched) {
        await client.query(
          `UPDATE orders SET status = 'in_transit', delivery_fee = $1, updated_at = NOW() WHERE id = $2`,
          [deliveryFee, req.order_id],
        );
      }
    });

    return {
      id,
      order_id: req.order_id,
      status,
      kwik_order_id: kwikOrderId,
      delivery_fee: deliveryFee,
      pickup_address: req.pickup_address,
      delivery_address: req.delivery_address,
    };
  }

  async track(orderId: string, user: AuthUser) {
    const delivery = await this.db.queryOne<any>(
      `SELECT id, order_id, user_id, status, delivery_fee, pickup_address, delivery_address,
              delivery_name, dispatched_at, picked_up_at, delivered_at, kwik_order_id
       FROM deliveries WHERE order_id = $1`,
      [orderId],
    );
    if (!delivery) throw new NotFoundException('No delivery found for this order');
    if (delivery.user_id !== user.user_id && user.role !== 'admin') {
      throw new ForbiddenException('Not authorized');
    }
    // Real-time Kwik sync happens here when configured (TODO).
    return {
      id: delivery.id,
      order_id: delivery.order_id,
      status: delivery.status,
      delivery_fee: delivery.delivery_fee,
      pickup_address: delivery.pickup_address,
      delivery_address: delivery.delivery_address,
      delivery_name: delivery.delivery_name,
      dispatched_at: delivery.dispatched_at,
      picked_up_at: delivery.picked_up_at,
      delivered_at: delivery.delivered_at,
    };
  }

  async cancel(orderId: string, user: AuthUser) {
    const delivery = await this.db.queryOne<any>(
      `SELECT id, user_id, status, kwik_job_id FROM deliveries WHERE order_id = $1`,
      [orderId],
    );
    if (!delivery) throw new NotFoundException('No delivery found for this order');
    if (delivery.user_id !== user.user_id && user.role !== 'admin') {
      throw new ForbiddenException('Not authorized');
    }
    if (['delivered', 'cancelled'].includes(delivery.status)) {
      throw new BadRequestException(
        `Cannot cancel delivery in '${delivery.status}' status`,
      );
    }
    // Kwik cancel (best-effort) when configured — TODO.
    await this.db.query(
      `UPDATE deliveries SET status = 'cancelled', updated_at = NOW() WHERE order_id = $1`,
      [orderId],
    );
    return { status: 'cancelled', order_id: orderId };
  }
}
