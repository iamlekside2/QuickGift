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

@Injectable()
export class DisputesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifier: NotifyService,
    private readonly mail: MailService,
  ) {}

  private naira(n: number): string {
    return `₦${Math.round(n).toLocaleString('en-US')}`;
  }

  async raise(userId: string, req: any) {
    if (!req?.order_id && !req?.booking_id) {
      throw new BadRequestException('Must provide order_id or booking_id');
    }
    let providerId: string | null = null;

    if (req.order_id) {
      const order = await this.db.queryOne<any>(
        `SELECT user_id FROM orders WHERE id = $1`,
        [req.order_id],
      );
      if (!order) throw new NotFoundException('Order not found');
      if (order.user_id !== userId) throw new ForbiddenException('Not your order');
    }
    if (req.booking_id) {
      const booking = await this.db.queryOne<any>(
        `SELECT user_id, provider_id FROM bookings WHERE id = $1`,
        [req.booking_id],
      );
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.user_id !== userId) throw new ForbiddenException('Not your booking');
      providerId = booking.provider_id;
    }

    const targetCol = req.order_id ? 'order_id' : 'booking_id';
    const targetVal = req.order_id ?? req.booking_id;
    const existing = await this.db.queryOne(
      `SELECT 1 FROM disputes
       WHERE buyer_id = $1 AND ${targetCol} = $2 AND status IN ('open','provider_responded')`,
      [userId, targetVal],
    );
    if (existing) {
      throw new BadRequestException('An open dispute already exists for this order');
    }

    const id = randomUUID();
    await this.db.query(
      `INSERT INTO disputes
        (id, order_id, booking_id, buyer_id, provider_id, reason, description, evidence_urls,
         status, refund_amount, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open',0,NOW(),NOW())`,
      [
        id,
        req.order_id ?? null,
        req.booking_id ?? null,
        userId,
        providerId,
        req.reason,
        req.description ?? null,
        req.evidence_urls ? JSON.stringify(req.evidence_urls) : null,
      ],
    );

    if (providerId) {
      const prov = await this.db.queryOne<any>(
        `SELECT user_id FROM providers WHERE id = $1`,
        [providerId],
      );
      if (prov) {
        await this.notifier
          .notify(
            prov.user_id,
            'Dispute Raised',
            `A buyer has raised a dispute. Reason: ${req.reason}. Please respond.`,
            'system',
          )
          .catch(() => undefined);
      }
    }

    void this.mail.sendAdminNotification('New dispute raised', [
      `Reason: ${req.reason}`,
      req.order_id ? `Order ID: ${req.order_id}` : `Booking ID: ${req.booking_id}`,
    ]);
    return this.db.queryOne(`SELECT * FROM disputes WHERE id = $1`, [id]);
  }

  async listMy(userId: string, status?: string) {
    // NOTE: faithful to the Python port — the JWT carries no provider_id, so the
    // provider side of the OR degrades to `provider_id IS NULL`. (Known upstream quirk.)
    const params: any[] = [userId];
    let sql = `SELECT * FROM disputes WHERE (buyer_id = $1 OR provider_id IS NULL)`;
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    sql += ` ORDER BY created_at DESC`;
    return this.db.query(sql, params);
  }

  async respond(disputeId: string, req: any) {
    const dispute = await this.db.queryOne<any>(
      `SELECT id, buyer_id, status FROM disputes WHERE id = $1`,
      [disputeId],
    );
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status !== 'open') {
      throw new BadRequestException('Cannot respond to this dispute');
    }
    await this.db.query(
      `UPDATE disputes SET provider_response = $1, provider_evidence_urls = $2,
         status = 'provider_responded', updated_at = NOW() WHERE id = $3`,
      [
        req?.response,
        req?.evidence_urls ? JSON.stringify(req.evidence_urls) : null,
        disputeId,
      ],
    );
    await this.notifier
      .notify(
        dispute.buyer_id,
        'Dispute Updated',
        'The provider has responded to your dispute. An admin will review shortly.',
        'system',
      )
      .catch(() => undefined);
    return { status: 'provider_responded', dispute_id: disputeId };
  }

  async adminList(q: any) {
    const params: any[] = [];
    let whereSql = '';
    if (q.status) {
      params.push(q.status);
      whereSql = `WHERE status = $${params.length}`;
    }
    const totalRow = await this.db.queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM disputes ${whereSql}`,
      params,
    );
    const total = totalRow ? Number(totalRow.count) : 0;
    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 20);
    params.push(perPage, (page - 1) * perPage);
    const items = await this.db.query(
      `SELECT * FROM disputes ${whereSql} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { items, total, page, per_page: perPage };
  }

  async adminGet(disputeId: string) {
    const dispute = await this.db.queryOne<any>(
      `SELECT * FROM disputes WHERE id = $1`,
      [disputeId],
    );
    if (!dispute) throw new NotFoundException('Dispute not found');
    const buyer = await this.db.queryOne<any>(
      `SELECT full_name FROM users WHERE id = $1`,
      [dispute.buyer_id],
    );
    const parse = (s: any) => {
      try {
        return s ? JSON.parse(s) : [];
      } catch {
        return [];
      }
    };
    return {
      ...dispute,
      buyer_name: buyer?.full_name ?? 'Unknown',
      evidence_urls: parse(dispute.evidence_urls),
      provider_evidence_urls: parse(dispute.provider_evidence_urls),
    };
  }

  async adminResolve(adminUserId: string, disputeId: string, req: any) {
    const dispute = await this.db.queryOne<any>(
      `SELECT id, order_id, booking_id, buyer_id, provider_id, status FROM disputes WHERE id = $1`,
      [disputeId],
    );
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (['resolved_buyer', 'resolved_provider', 'closed'].includes(dispute.status)) {
      throw new BadRequestException('Dispute already resolved');
    }

    let newStatus = dispute.status;
    let refundAmount = 0;

    await this.db.transaction(async (client) => {
      if (req?.resolution === 'buyer') {
        newStatus = 'resolved_buyer';
        refundAmount = Number(req?.refund_amount) || 0;
        if (!refundAmount) {
          if (dispute.order_id) {
            const order = (await client.query(`SELECT total FROM orders WHERE id = $1`, [dispute.order_id])).rows[0];
            if (order) refundAmount = Number(order.total);
          } else if (dispute.booking_id) {
            const booking = (await client.query(`SELECT price FROM bookings WHERE id = $1`, [dispute.booking_id])).rows[0];
            if (booking) refundAmount = Number(booking.price);
          }
        }
        if (refundAmount > 0) {
          const buyer = (await client.query(`SELECT id, wallet_balance FROM users WHERE id = $1`, [dispute.buyer_id])).rows[0];
          if (buyer) {
            const newBalance = Number(buyer.wallet_balance) + refundAmount;
            await client.query(`UPDATE users SET wallet_balance = $1 WHERE id = $2`, [newBalance, buyer.id]);
            const ref = 'DRF-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
            await client.query(
              `INSERT INTO transactions (id, user_id, type, amount, description, reference, balance_after, status, created_at)
               VALUES ($1,$2,'credit',$3,'Dispute refund',$4,$5,'completed',NOW())`,
              [randomUUID(), buyer.id, refundAmount, ref, newBalance],
            );
          }
          if (dispute.order_id) {
            await client.query(
              `UPDATE payouts SET status = 'cancelled', updated_at = NOW()
               WHERE order_id = $1 AND status IN ('pending','held')`,
              [dispute.order_id],
            );
          }
        }
      } else if (req?.resolution === 'provider') {
        newStatus = 'resolved_provider';
        refundAmount = 0;
      }
      await client.query(
        `UPDATE disputes SET resolved_by = $1, resolution_notes = $2, status = $3, refund_amount = $4, updated_at = NOW() WHERE id = $5`,
        [adminUserId, req?.notes ?? null, newStatus, refundAmount, disputeId],
      );
    });

    // Notifications (best-effort, after commit)
    if (req?.resolution === 'buyer') {
      await this.notifier
        .notify(
          dispute.buyer_id,
          'Dispute Resolved',
          `Your dispute has been resolved in your favor. ${this.naira(refundAmount)} refunded to your wallet.`,
          'payment',
        )
        .catch(() => undefined);
    } else if (req?.resolution === 'provider') {
      await this.notifier
        .notify(
          dispute.buyer_id,
          'Dispute Resolved',
          'Your dispute has been reviewed and resolved in favor of the provider.',
          'system',
        )
        .catch(() => undefined);
    }
    if (dispute.provider_id) {
      const prov = await this.db.queryOne<any>(
        `SELECT user_id FROM providers WHERE id = $1`,
        [dispute.provider_id],
      );
      if (prov) {
        const outcome = req?.resolution === 'provider' ? 'in your favor' : 'in favor of the buyer';
        await this.notifier
          .notify(prov.user_id, 'Dispute Resolved', `A dispute has been resolved ${outcome}.`, 'system')
          .catch(() => undefined);
      }
    }

    return { status: newStatus, refund_amount: refundAmount };
  }
}
