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
import { creditWallet, ledgerRef, toAmount } from '../../common/ledger';
import { paging } from '../../common/paging';

const REASON_MAX = 200;
const TEXT_MAX = 2000;

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
    const reason = String(req?.reason ?? '').trim().slice(0, REASON_MAX);
    if (!reason) throw new BadRequestException('Please tell us what went wrong');
    req.reason = reason;
    if (req.description != null) req.description = String(req.description).slice(0, TEXT_MAX);
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

  /** Provider ids owned by this user (a user normally has zero or one). */
  private async providerIdsOf(userId: string): Promise<string[]> {
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM providers WHERE user_id = $1`,
      [userId],
    );
    return rows.map((r) => r.id);
  }

  /**
   * True if the user is the provider side of this dispute: the provider on a
   * booking dispute, or a vendor with at least one item in a disputed order.
   */
  private async isProviderParty(userId: string, dispute: any): Promise<boolean> {
    const mine = await this.providerIdsOf(userId);
    if (!mine.length) return false;
    if (dispute.provider_id && mine.includes(dispute.provider_id)) return true;
    if (dispute.order_id) {
      const row = await this.db.queryOne(
        `SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1 AND p.vendor_id = ANY($2::text[]) LIMIT 1`,
        [dispute.order_id, mine],
      );
      return !!row;
    }
    return false;
  }

  /** Disputes the caller raised, or that concern them as the provider/vendor. */
  async listMy(userId: string, status?: string) {
    const mine = await this.providerIdsOf(userId);
    const params: any[] = [userId, mine];
    let sql = `SELECT d.* FROM disputes d
      WHERE (
        d.buyer_id = $1
        OR d.provider_id = ANY($2::text[])
        OR (d.order_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = d.order_id AND p.vendor_id = ANY($2::text[])))
      )`;
    if (status) {
      params.push(status);
      sql += ` AND d.status = $${params.length}`;
    }
    sql += ` ORDER BY d.created_at DESC`;
    return this.db.query(sql, params);
  }

  async respond(disputeId: string, userId: string, req: any) {
    const dispute = await this.db.queryOne<any>(
      `SELECT id, buyer_id, provider_id, order_id, status FROM disputes WHERE id = $1`,
      [disputeId],
    );
    if (!dispute) throw new NotFoundException('Dispute not found');
    // Only the provider the dispute is against may answer it — not the buyer,
    // and not an unrelated user.
    if (!(await this.isProviderParty(userId, dispute))) {
      throw new ForbiddenException('Only the provider on this dispute can respond');
    }
    const response = String(req?.response ?? '').trim().slice(0, TEXT_MAX);
    if (!response) throw new BadRequestException('Please write a response');

    const updated = await this.db.queryOne(
      `UPDATE disputes SET provider_response = $1, provider_evidence_urls = $2,
         status = 'provider_responded', updated_at = NOW()
       WHERE id = $3 AND status = 'open' RETURNING id`,
      [
        response,
        Array.isArray(req?.evidence_urls) ? JSON.stringify(req.evidence_urls.slice(0, 10)) : null,
        disputeId,
      ],
    );
    if (!updated) throw new BadRequestException('Cannot respond to this dispute');

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
    const { page, perPage, offset } = paging(q);
    params.push(perPage, offset);
    const items = await this.db.query(
      `SELECT d.*, u.full_name AS buyer_name, pr.business_name AS provider_name,
              o.order_number, b.booking_number,
              COALESCE(o.total, b.price) AS target_amount
       FROM disputes d
       LEFT JOIN users u ON u.id = d.buyer_id
       LEFT JOIN providers pr ON pr.id = d.provider_id
       LEFT JOIN orders o ON o.id = d.order_id
       LEFT JOIN bookings b ON b.id = d.booking_id
       ${whereSql.replace('status', 'd.status')}
       ORDER BY d.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    // Accept the canonical values and the older "favor_*" spelling; anything
    // else is an error rather than a silent no-op.
    const raw = String(req?.resolution ?? '').replace(/^favor_/, '');
    if (raw !== 'buyer' && raw !== 'provider') {
      throw new BadRequestException("resolution must be 'buyer' or 'provider'");
    }
    const resolution: 'buyer' | 'provider' = raw;
    const notes = req?.notes != null ? String(req.notes).slice(0, TEXT_MAX) : null;

    const outcome = await this.db.transaction(async (client) => {
      // Claim the dispute first so two staff members (or a double-click)
      // cannot both resolve it and refund twice.
      const dispute = (
        await client.query(
          `UPDATE disputes SET status = $1, resolved_by = $2, resolution_notes = $3, updated_at = NOW()
           WHERE id = $4 AND status IN ('open','provider_responded')
           RETURNING id, order_id, booking_id, buyer_id, provider_id`,
          [resolution === 'buyer' ? 'resolved_buyer' : 'resolved_provider', adminUserId, notes, disputeId],
        )
      ).rows[0];
      if (!dispute) return null;

      let refundAmount = 0;
      let payoutAlreadyReleased = false;

      if (resolution === 'buyer') {
        // The most that can be refunded is what the buyer actually paid.
        const table = dispute.order_id ? 'orders' : 'bookings';
        const targetId = dispute.order_id ?? dispute.booking_id;
        const target = (
          await client.query(
            `SELECT payment_status, payment_ref FROM ${table} WHERE id = $1 FOR UPDATE`,
            [targetId],
          )
        ).rows[0];
        let paid = 0;
        if (target?.payment_status === 'paid' && target.payment_ref) {
          const pay = (
            await client.query(
              `SELECT amount FROM payments WHERE reference = $1 AND status = 'success'`,
              [target.payment_ref],
            )
          ).rows[0];
          paid = Number(pay?.amount ?? 0);
          // Earlier disputes on the same order/booking may already have
          // refunded part of it; the total refunded can never exceed what was paid.
          const col0 = dispute.order_id ? 'order_id' : 'booking_id';
          const prior = (
            await client.query(
              `SELECT COALESCE(SUM(refund_amount), 0) AS s FROM disputes WHERE ${col0} = $1 AND id <> $2`,
              [targetId, disputeId],
            )
          ).rows[0];
          paid = Math.max(0, paid - Number(prior?.s ?? 0));
        }

        const requested =
          req?.refund_amount === undefined || req?.refund_amount === null || req?.refund_amount === ''
            ? paid
            : toAmount(req.refund_amount) ?? -1;
        if (requested < 0) throw new BadRequestException('Refund amount is not valid');
        if (requested > paid) {
          throw new BadRequestException(
            paid > 0
              ? `Refund cannot be more than the ${this.naira(paid)} that was paid`
              : 'Nothing was paid for this, so there is nothing to refund',
          );
        }
        refundAmount = requested;

        if (refundAmount > 0) {
          await creditWallet(client, dispute.buyer_id, refundAmount, 'Dispute refund', ledgerRef('DRF'));
          const col = dispute.order_id ? 'order_id' : 'booking_id';
          payoutAlreadyReleased = !!(
            await client.query(
              `SELECT 1 FROM payouts WHERE ${col} = $1 AND status = 'paid' LIMIT 1`,
              [targetId],
            )
          ).rows[0];
          // Stop any payout that has not gone out yet (orders AND bookings).
          await client.query(
            `UPDATE payouts SET status = 'cancelled', updated_at = NOW()
             WHERE ${col} = $1 AND status IN ('pending','held')`,
            [targetId],
          );
          if (refundAmount >= paid) {
            // Fully refunded: nothing left to refund on a later cancel.
            await client.query(
              `UPDATE ${table} SET payment_status = 'refunded', updated_at = NOW() WHERE id = $1`,
              [targetId],
            );
            await client.query(
              `UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE reference = $1`,
              [target.payment_ref],
            );
          }
        }
      }

      await client.query(`UPDATE disputes SET refund_amount = $1 WHERE id = $2`, [refundAmount, disputeId]);
      return { dispute, refundAmount, payoutAlreadyReleased };
    });

    if (!outcome) throw new BadRequestException('Dispute already resolved');
    const { dispute, refundAmount, payoutAlreadyReleased } = outcome;
    const newStatus = resolution === 'buyer' ? 'resolved_buyer' : 'resolved_provider';

    // Notifications (best-effort, after commit)
    await this.notifier
      .notify(
        dispute.buyer_id,
        'Dispute Resolved',
        resolution === 'buyer'
          ? refundAmount > 0
            ? `Your dispute has been resolved in your favor. ${this.naira(refundAmount)} refunded to your wallet.`
            : 'Your dispute has been resolved in your favor.'
          : 'Your dispute has been reviewed and resolved in favor of the provider.',
        resolution === 'buyer' && refundAmount > 0 ? 'payment' : 'system',
      )
      .catch(() => undefined);
    if (dispute.provider_id) {
      const prov = await this.db.queryOne<any>(
        `SELECT user_id FROM providers WHERE id = $1`,
        [dispute.provider_id],
      );
      if (prov) {
        const outcomeText = resolution === 'provider' ? 'in your favor' : 'in favor of the buyer';
        await this.notifier
          .notify(prov.user_id, 'Dispute Resolved', `A dispute has been resolved ${outcomeText}.`, 'system')
          .catch(() => undefined);
      }
    }

    return {
      status: newStatus,
      refund_amount: refundAmount,
      // True when the seller had already been paid out before the refund, so
      // staff know the platform covered it and may need to recover it.
      payout_already_released: payoutAlreadyReleased,
    };
  }
}
