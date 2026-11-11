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
import { ReferralService } from '../../common/referral.service';
import { creditWallet, ledgerRef } from '../../common/ledger';
import { paging } from '../../common/paging';
import { roleHasPermission } from '../../common/permissions';

// Statuses that represent work being done or finished — never reachable for a
// booking that has not been paid for.
const REQUIRES_PAYMENT = ['confirmed', 'in_progress', 'completed'];
// Statuses a buyer may still cancel from.
const BUYER_CANCELLABLE = ['pending', 'accepted', 'confirmed'];

// BookingResponse = curated subset (no commission, lat, lng, payment_ref, updated_at).
const BOOKING_FIELDS = `id, booking_number, user_id, provider_id, service_id,
  service_name, service_type, status, booking_date, booking_time,
  duration_minutes, price, deposit, address, notes, payment_status, created_at`;

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'confirmed', 'declined', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  declined: [],
  cancelled: [],
};

interface AuthUser {
  user_id: string;
  role: string;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifier: NotifyService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
    private readonly referrals: ReferralService,
  ) {}

  private bookingNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return 'QB-' + s;
  }

  private naira(n: number): string {
    return `₦${Math.round(n).toLocaleString('en-US')}`;
  }

  private reload(id: string) {
    return this.db.queryOne(
      `SELECT ${BOOKING_FIELDS} FROM bookings WHERE id = $1`,
      [id],
    );
  }

  async createBooking(user: AuthUser, req: any) {
    const provider = await this.db.queryOne<any>(
      `SELECT id, user_id, is_available, status FROM providers WHERE id = $1`,
      [req?.provider_id],
    );
    if (!provider) throw new NotFoundException('Provider not found');
    // Only approved providers can take bookings (pending/suspended/rejected cannot).
    if (provider.status !== 'verified') {
      throw new BadRequestException('This provider is not accepting bookings yet');
    }
    if (!provider.is_available) {
      throw new BadRequestException('Provider is currently unavailable');
    }
    if (provider.user_id === user.user_id) {
      throw new BadRequestException('You cannot book your own service');
    }

    const service = await this.db.queryOne<any>(
      `SELECT id, name, price, duration_minutes, is_active FROM services
       WHERE id = $1 AND provider_id = $2`,
      [req?.service_id, req?.provider_id],
    );
    if (!service || service.is_active === false) {
      throw new NotFoundException('Service not found');
    }
    if (!(Number(service.price) > 0)) {
      throw new BadRequestException('This service cannot be booked right now');
    }

    const when = new Date(req?.booking_date);
    if (!req?.booking_date || Number.isNaN(when.getTime())) {
      throw new BadRequestException('Please choose a valid booking date');
    }
    if (when.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      throw new BadRequestException('The booking date cannot be in the past');
    }
    if (!String(req?.booking_time ?? '').trim()) {
      throw new BadRequestException('Please choose a booking time');
    }

    const deposit = service.price;
    const beautyCommissionPct = await this.settings.getBeautyCommission();
    const commission = service.price * (beautyCommissionPct / 100);
    const id = randomUUID();

    await this.db.query(
      `INSERT INTO bookings
        (id, booking_number, user_id, provider_id, service_id, service_name, service_type,
         status, booking_date, booking_time, duration_minutes, price, deposit, commission,
         address, lat, lng, notes, payment_status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending',NOW(),NOW())`,
      [
        id,
        this.bookingNumber(),
        user.user_id,
        req.provider_id,
        req.service_id,
        service.name,
        req.service_type,
        req.booking_date,
        req.booking_time,
        service.duration_minutes,
        service.price,
        deposit,
        commission,
        req.address ?? null,
        req.lat ?? null,
        req.lng ?? null,
        req.notes ?? null,
      ],
    );

    const buyer = await this.db.queryOne<any>(
      `SELECT full_name FROM users WHERE id = $1`,
      [user.user_id],
    );
    const buyerName = buyer?.full_name ?? 'A customer';
    await this.notifier
      .notify(
        provider.user_id,
        'New Booking Request',
        `${buyerName} booked ${service.name} for ${this.naira(service.price)}`,
        'booking',
      )
      .catch(() => undefined);

    const booking = await this.reload(id);
    void this.mail.sendAdminNotification('New booking request', [
      `Booking: ${(booking as any)?.booking_number ?? '—'}`,
      `Service: ${service.name}`,
      `Customer: ${buyerName}`,
      `Amount: ${this.naira(service.price)}`,
      `Status: pending`,
    ]);
    return booking;
  }

  async listBookings(user: AuthUser, q: any) {
    const where: string[] = [];
    const params: any[] = [];

    if (user.role === 'provider') {
      const provider = await this.db.queryOne<any>(
        `SELECT id FROM providers WHERE user_id = $1`,
        [user.user_id],
      );
      if (!provider) throw new NotFoundException('Provider profile not found');
      params.push(provider.id);
      where.push(`provider_id = $${params.length}`);
    } else {
      params.push(user.user_id);
      where.push(`user_id = $${params.length}`);
    }

    if (q.status) {
      params.push(q.status);
      where.push(`status = $${params.length}`);
    }
    if (q.date) {
      params.push(q.date);
      where.push(`booking_date::date = $${params.length}::date`);
    }

    const { perPage, offset } = paging(q);
    params.push(perPage, offset);
    const asProvider = user.role === 'provider';
    const fields = BOOKING_FIELDS.split(',')
      .map((f) => 'b.' + f.trim())
      .join(', ');
    // The provider sees who booked (name + phone to reach them); the buyer
    // sees the business they booked. Neither gets the other's extra details.
    const extra = asProvider
      ? `u.full_name AS client_name, u.phone AS client_phone`
      : `pr.business_name AS provider_name`;
    return this.db.query(
      `SELECT ${fields}, ${extra}
       FROM bookings b
       LEFT JOIN users u ON u.id = b.user_id
       LEFT JOIN providers pr ON pr.id = b.provider_id
       WHERE ${where.map((w) => 'b.' + w).join(' AND ')}
       ORDER BY b.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
  }

  async getBooking(id: string, user: AuthUser) {
    const booking = await this.db.queryOne<any>(
      `SELECT ${BOOKING_FIELDS} FROM bookings WHERE id = $1`,
      [id],
    );
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user_id !== user.user_id && !roleHasPermission(user.role, 'bookings.view')) {
      const provider = await this.db.queryOne<any>(
        `SELECT id FROM providers WHERE user_id = $1`,
        [user.user_id],
      );
      if (!provider || provider.id !== booking.provider_id) {
        throw new ForbiddenException('Not authorized');
      }
    }
    return booking;
  }

  /**
   * Ends a booking (cancelled / declined) exactly once, refunding the buyer if
   * it had been paid and stopping the provider's held payout. Returns null if
   * the booking was not in one of the `from` statuses.
   */
  private async endAndRefund(id: string, newStatus: 'cancelled' | 'declined', from: string[]) {
    return this.db.transaction(async (client) => {
      const booking = (
        await client.query(
          `UPDATE bookings SET status = $1, updated_at = NOW()
           WHERE id = $2 AND status = ANY($3::text[])
           RETURNING *`,
          [newStatus, id, from],
        )
      ).rows[0];
      if (!booking) return null;

      let refundAmount = 0;
      if (booking.payment_status === 'paid') {
        const released = (
          await client.query(
            `SELECT 1 FROM payouts WHERE booking_id = $1 AND status = 'paid' LIMIT 1`,
            [id],
          )
        ).rows[0];
        if (released) {
          throw new BadRequestException(
            'The payout for this booking has already been released. Please raise a dispute instead.',
          );
        }
        const paid = booking.payment_ref
          ? (
              await client.query(
                `SELECT amount FROM payments WHERE reference = $1 AND status = 'success'`,
                [booking.payment_ref],
              )
            ).rows[0]
          : null;
        refundAmount = Number(paid?.amount ?? booking.price);
        if (refundAmount > 0) {
          await creditWallet(
            client,
            booking.user_id,
            refundAmount,
            `Refund for ${newStatus} booking ${booking.booking_number}`,
            ledgerRef('RFD'),
          );
        }
        await client.query(
          `UPDATE payouts SET status = 'cancelled', updated_at = NOW()
           WHERE booking_id = $1 AND status IN ('pending','held')`,
          [id],
        );
        if (booking.payment_ref) {
          await client.query(
            `UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE reference = $1`,
            [booking.payment_ref],
          );
        }
        await client.query(
          `UPDATE bookings SET payment_status = 'refunded', updated_at = NOW() WHERE id = $1`,
          [id],
        );
      }
      return { booking, refunded: refundAmount > 0, refundAmount };
    });
  }

  /** The buyer cancels their own booking (refunded to wallet if already paid). */
  async cancelBooking(id: string, user: AuthUser) {
    const existing = await this.db.queryOne<any>(
      `SELECT id, user_id, provider_id, service_name, status FROM bookings WHERE id = $1`,
      [id],
    );
    if (!existing) throw new NotFoundException('Booking not found');
    if (existing.user_id !== user.user_id && !roleHasPermission(user.role, 'bookings.manage')) {
      throw new ForbiddenException('Not authorized');
    }
    const result = await this.endAndRefund(id, 'cancelled', BUYER_CANCELLABLE);
    if (!result) {
      throw new BadRequestException(`Cannot cancel a booking that is ${existing.status}`);
    }

    const prov = await this.db.queryOne<any>(
      `SELECT user_id FROM providers WHERE id = $1`,
      [existing.provider_id],
    );
    if (prov) {
      await this.notifier
        .notify(
          prov.user_id,
          'Booking Cancelled',
          `The booking for ${existing.service_name} was cancelled by the customer.`,
          'booking',
        )
        .catch(() => undefined);
    }
    if (result.refunded) {
      await this.notifier
        .notify(
          existing.user_id,
          'Booking Cancelled & Refunded',
          `${this.naira(result.refundAmount)} has been refunded to your wallet.`,
          'payment',
        )
        .catch(() => undefined);
    }
    return {
      status: 'cancelled',
      booking_id: id,
      refunded: result.refunded,
      refund_amount: result.refundAmount,
    };
  }

  async updateStatus(id: string, user: AuthUser, status: string) {
    const booking = await this.db.queryOne<any>(
      `SELECT id, user_id, provider_id, service_name, status, payment_status FROM bookings WHERE id = $1`,
      [id],
    );
    if (!booking) throw new NotFoundException('Booking not found');

    const provider = await this.db.queryOne<any>(
      `SELECT id FROM providers WHERE user_id = $1`,
      [user.user_id],
    );
    const isAssignedProvider = provider && provider.id === booking.provider_id;
    if (!isAssignedProvider && !roleHasPermission(user.role, 'bookings.manage')) {
      throw new ForbiddenException(
        'Only the assigned provider can update booking status',
      );
    }

    if (!(VALID_TRANSITIONS[booking.status] ?? []).includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${status}`,
      );
    }
    // No work starts, and nothing is marked done, on a booking nobody paid for.
    if (REQUIRES_PAYMENT.includes(status) && booking.payment_status !== 'paid') {
      throw new BadRequestException(
        'This booking has not been paid for yet. It can be confirmed once the customer pays.',
      );
    }

    let refundNote = '';
    if (status === 'cancelled' || status === 'declined') {
      // Refunding path: a paid booking is never ended without returning the money.
      const result = await this.endAndRefund(id, status, [booking.status]);
      if (!result) throw new BadRequestException('This booking was just updated. Please refresh.');
      if (result.refunded) {
        refundNote = ` ${this.naira(result.refundAmount)} has been refunded to your wallet.`;
      }
    } else {
      const moved = await this.db.queryOne(
        `UPDATE bookings SET status = $1, updated_at = NOW()
         WHERE id = $2 AND status = $3 RETURNING id`,
        [status, id, booking.status],
      );
      if (!moved) throw new BadRequestException('This booking was just updated. Please refresh.');
      if (status === 'completed') await this.referrals.onPurchaseFulfilled(booking.user_id);
    }

    const label = status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    await this.notifier
      .notify(
        booking.user_id,
        `Booking ${label}`,
        `Your booking for ${booking.service_name} has been ${label.toLowerCase()}.${refundNote}`,
        refundNote ? 'payment' : 'booking',
      )
      .catch(() => undefined);

    return this.reload(id);
  }
}
