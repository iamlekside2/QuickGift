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
      `SELECT id, user_id, is_available FROM providers WHERE id = $1`,
      [req?.provider_id],
    );
    if (!provider) throw new NotFoundException('Provider not found');
    if (!provider.is_available) {
      throw new BadRequestException('Provider is currently unavailable');
    }

    const service = await this.db.queryOne<any>(
      `SELECT id, name, price, duration_minutes FROM services
       WHERE id = $1 AND provider_id = $2`,
      [req?.service_id, req?.provider_id],
    );
    if (!service) throw new NotFoundException('Service not found');

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
    await this.notifier.notify(
      provider.user_id,
      'New Booking Request',
      `${buyerName} booked ${service.name} for ${this.naira(service.price)}`,
      'booking',
    );

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

    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 20);
    params.push(perPage, (page - 1) * perPage);
    return this.db.query(
      `SELECT ${BOOKING_FIELDS} FROM bookings WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
  }

  async getBooking(id: string, user: AuthUser) {
    const booking = await this.db.queryOne<any>(
      `SELECT ${BOOKING_FIELDS} FROM bookings WHERE id = $1`,
      [id],
    );
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user_id !== user.user_id && user.role !== 'admin') {
      throw new ForbiddenException('Not authorized');
    }
    return booking;
  }

  async updateStatus(id: string, user: AuthUser, status: string) {
    const booking = await this.db.queryOne<any>(
      `SELECT id, user_id, provider_id, service_name, status FROM bookings WHERE id = $1`,
      [id],
    );
    if (!booking) throw new NotFoundException('Booking not found');

    const provider = await this.db.queryOne<any>(
      `SELECT id FROM providers WHERE user_id = $1`,
      [user.user_id],
    );
    const isAssignedProvider = provider && provider.id === booking.provider_id;
    if (!isAssignedProvider && user.role !== 'admin') {
      throw new ForbiddenException(
        'Only the assigned provider can update booking status',
      );
    }

    if (!(VALID_TRANSITIONS[booking.status] ?? []).includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${status}`,
      );
    }

    await this.db.query(
      `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id],
    );

    const label = status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    await this.notifier.notify(
      booking.user_id,
      `Booking ${label}`,
      `Your booking for ${booking.service_name} has been ${label.toLowerCase()}`,
      'booking',
    );

    return this.reload(id);
  }
}
