import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { haversineKm } from '../../common/geo';
import { AuditService } from '../../common/audit.service';
import { AuthUser } from '../../common/current-user.decorator';

const PROVIDER_FIELDS = `id, user_id, business_name, service_type, bio, location, city,
  lat, lng, rating, review_count, booking_count, experience_years, status,
  status_reason, plan, is_available, offers_home_service, offers_salon_service,
  avatar_url, created_at`;

const SERVICE_FIELDS = `id, provider_id, name, description, price, duration_minutes, is_active`;

const DEFAULT_AVAILABILITY = {
  schedule: {
    mon: { active: true, start: '9:00 AM', end: '5:00 PM' },
    tue: { active: true, start: '9:00 AM', end: '5:00 PM' },
    wed: { active: true, start: '9:00 AM', end: '5:00 PM' },
    thu: { active: true, start: '9:00 AM', end: '5:00 PM' },
    fri: { active: true, start: '9:00 AM', end: '5:00 PM' },
    sat: { active: false, start: '', end: '' },
    sun: { active: false, start: '', end: '' },
  },
  buffer_minutes: 30,
  blocked_dates: [],
};

export interface ProviderListQuery {
  city?: string;
  service_type?: string;
  available?: boolean;
  search?: string;
  min_rating?: number;
  sort: string;
  page: number;
  per_page: number;
  lat?: number;
  lng?: number;
  radius_km: number;
}

@Injectable()
export class ProvidersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  /** Record an admin status change against the provider in the audit log. */
  private async auditStatus(
    actor: AuthUser | undefined,
    providerId: string,
    action: string,
    details: string,
  ) {
    const p = await this.db.queryOne<{ business_name: string }>(
      `SELECT business_name FROM providers WHERE id = $1`,
      [providerId],
    );
    await this.audit.log(
      actor,
      action,
      { id: providerId, full_name: p?.business_name || 'Provider' },
      details,
      'provider',
    );
  }

  private withDistance<T>(row: T, distance: number | null = null) {
    return { ...row, distance_km: distance };
  }

  private async servicesFor(providerId: string) {
    return this.db.query(
      `SELECT ${SERVICE_FIELDS} FROM services
       WHERE provider_id = $1 AND is_active = true`,
      [providerId],
    );
  }

  private async portfolioFor(providerId: string) {
    return this.db.query(
      `SELECT id, image_url, caption FROM portfolios
       WHERE provider_id = $1 ORDER BY created_at DESC`,
      [providerId],
    );
  }

  async listProviders(q: ProviderListQuery) {
    const where: string[] = [`status = 'verified'`];
    const params: any[] = [];
    const push = (v: any) => {
      params.push(v);
      return `$${params.length}`;
    };

    const hasCoords = q.lat != null && q.lng != null;
    if (!hasCoords && q.city) where.push(`city = ${push(q.city)}`);
    if (q.service_type) where.push(`service_type = ${push(q.service_type)}`);
    if (q.available != null) where.push(`is_available = ${push(q.available)}`);
    if (q.search) where.push(`business_name ILIKE ${push(`%${q.search}%`)}`);
    if (q.min_rating != null) where.push(`rating >= ${push(q.min_rating)}`);

    const whereSql = `WHERE ${where.join(' AND ')}`;

    // Distance sort: fetch all, compute haversine in JS (matches Python).
    if (q.sort === 'distance' && hasCoords) {
      const rows = await this.db.query<any>(
        `SELECT ${PROVIDER_FIELDS} FROM providers ${whereSql}`,
        params,
      );
      const withDistance: Array<{ p: any; d: number }> = [];
      const withoutCoords: any[] = [];
      for (const p of rows) {
        if (p.lat != null && p.lng != null) {
          const d = haversineKm(q.lat!, q.lng!, p.lat, p.lng);
          if (d <= q.radius_km) {
            withDistance.push({ p, d: Math.round(d * 100) / 100 });
          }
        } else {
          withoutCoords.push(p);
        }
      }
      withDistance.sort((a, b) => a.d - b.d);
      const ordered = [
        ...withDistance.map((x) => this.withDistance(x.p, x.d)),
        ...withoutCoords.map((p) => this.withDistance(p, null)),
      ];
      const start = (q.page - 1) * q.per_page;
      return ordered.slice(start, start + q.per_page);
    }

    // Standard sort.
    let orderBy = 'rating DESC';
    if (q.sort === 'bookings') orderBy = 'booking_count DESC';
    else if (q.sort === 'newest') orderBy = 'created_at DESC';

    const rows = await this.db.query<any>(
      `SELECT ${PROVIDER_FIELDS} FROM providers ${whereSql}
       ORDER BY ${orderBy} LIMIT ${push(q.per_page)} OFFSET ${push((q.page - 1) * q.per_page)}`,
      params,
    );
    return rows.map((r) => this.withDistance(r, null));
  }

  async getMy(userId: string) {
    const provider = await this.db.queryOne<any>(
      `SELECT ${PROVIDER_FIELDS} FROM providers WHERE user_id = $1`,
      [userId],
    );
    if (!provider) {
      throw new NotFoundException("You don't have a provider profile");
    }
    return {
      ...this.withDistance(provider, null),
      services: await this.servicesFor(provider.id),
      portfolio: await this.portfolioFor(provider.id),
    };
  }

  async updateMy(userId: string, data: any) {
    const provider = await this.db.queryOne<any>(
      `SELECT id FROM providers WHERE user_id = $1`,
      [userId],
    );
    if (!provider) throw new NotFoundException('Provider profile not found');
    return this.applyUpdate(provider.id, data);
  }

  async addMyService(userId: string, body: any) {
    const provider = await this.db.queryOne<any>(
      `SELECT id FROM providers WHERE user_id = $1`,
      [userId],
    );
    if (!provider) {
      throw new NotFoundException(
        "You don't have a provider profile. Complete your business setup first.",
      );
    }
    return this.insertService(provider.id, body);
  }

  async getProvider(providerId: string) {
    const provider = await this.db.queryOne<any>(
      `SELECT ${PROVIDER_FIELDS} FROM providers WHERE id = $1`,
      [providerId],
    );
    if (!provider) throw new NotFoundException('Provider not found');
    return {
      ...this.withDistance(provider, null),
      services: await this.servicesFor(providerId),
      portfolio: await this.portfolioFor(providerId),
    };
  }

  async register(userId: string, body: any) {
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO providers
        (id, user_id, business_name, service_type, bio, location, city,
         experience_years, offers_home_service, offers_salon_service,
         rating, review_count, booking_count, total_revenue,
         status, plan, is_available, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
               0,0,0,0,'pending','Free',true,NOW(),NOW())`,
      [
        id,
        userId,
        body?.business_name,
        body?.service_type,
        body?.bio ?? null,
        body?.location,
        body?.city,
        body?.experience_years ?? 0,
        body?.offers_home_service ?? true,
        body?.offers_salon_service ?? true,
      ],
    );
    return this.reload(id);
  }

  async updateOwned(providerId: string, userId: string, data: any) {
    const provider = await this.db.queryOne<any>(
      `SELECT id FROM providers WHERE id = $1 AND user_id = $2`,
      [providerId, userId],
    );
    if (!provider) throw new NotFoundException('Provider not found');
    return this.applyUpdate(providerId, data);
  }

  async listServices(providerId: string) {
    return this.servicesFor(providerId);
  }

  async addService(providerId: string, userId: string, body: any) {
    const owned = await this.db.queryOne(
      `SELECT 1 FROM providers WHERE id = $1 AND user_id = $2`,
      [providerId, userId],
    );
    if (!owned) throw new ForbiddenException('Not your provider profile');
    return this.insertService(providerId, body);
  }

  // --- Admin status actions ---

  async approve(providerId: string, actor?: AuthUser) {
    await this.setStatus(
      providerId,
      'verified',
      null,
      'Account Approved!',
      'Congratulations! Your account has been approved. You can now start receiving orders.',
    );
    await this.auditStatus(actor, providerId, 'approved', 'Approved & verified the provider');
    return { message: 'Provider approved', status: 'verified' };
  }

  async reject(providerId: string, reason: string, actor?: AuthUser) {
    await this.setStatus(
      providerId,
      'rejected',
      reason || null,
      'Application Rejected',
      `Your application has been rejected.${reason ? ' Reason: ' + reason : ''} Please contact support.`,
    );
    await this.auditStatus(actor, providerId, 'rejected',
      `Rejected the provider${reason ? ` — ${reason}` : ''}`);
    return { message: 'Provider rejected', status: 'rejected' };
  }

  async suspend(providerId: string, reason: string, actor?: AuthUser) {
    await this.setStatus(
      providerId,
      'suspended',
      reason || null,
      'Account Suspended',
      `Your account has been suspended.${reason ? ' Reason: ' + reason : ''} Please contact support.`,
    );
    await this.auditStatus(actor, providerId, 'suspended',
      `Suspended the provider${reason ? ` — ${reason}` : ''}`);
    return { message: 'Provider suspended', status: 'suspended' };
  }

  async reactivate(providerId: string, actor?: AuthUser) {
    await this.setStatus(
      providerId,
      'verified',
      null,
      'Account Reactivated!',
      'Great news! Your account has been reactivated. You can now start receiving orders again.',
    );
    await this.auditStatus(actor, providerId, 'reactivated', 'Reactivated the provider');
    return { message: 'Provider reactivated', status: 'verified' };
  }

  // --- Availability (stored/parsed from bio JSON, mirrors Python MVP behavior) ---

  async getMyAvailability(userId: string) {
    const provider = await this.db.queryOne<any>(
      `SELECT bio FROM providers WHERE user_id = $1`,
      [userId],
    );
    if (!provider) throw new NotFoundException('Provider profile not found');
    let parsed: any = {};
    try {
      if (provider.bio && provider.bio.startsWith('{')) {
        parsed = JSON.parse(provider.bio);
      }
    } catch {
      parsed = {};
    }
    return parsed.availability ?? DEFAULT_AVAILABILITY;
  }

  async updateMyAvailability(userId: string, body: any) {
    const provider = await this.db.queryOne(
      `SELECT id FROM providers WHERE user_id = $1`,
      [userId],
    );
    if (!provider) throw new NotFoundException('Provider profile not found');
    const availability = {
      schedule: body?.schedule ?? {},
      buffer_minutes: body?.buffer_minutes ?? 30,
      blocked_dates: body?.blocked_dates ?? [],
    };
    return { status: 'saved', availability };
  }

  // --- helpers ---

  private async reload(providerId: string) {
    const row = await this.db.queryOne<any>(
      `SELECT ${PROVIDER_FIELDS} FROM providers WHERE id = $1`,
      [providerId],
    );
    return this.withDistance(row, null);
  }

  private async applyUpdate(providerId: string, data: any) {
    const allowed = [
      'business_name',
      'bio',
      'location',
      'is_available',
      'offers_home_service',
      'offers_salon_service',
    ];
    const sets: string[] = [];
    const params: any[] = [];
    for (const key of allowed) {
      if (data && data[key] !== undefined) {
        params.push(data[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    if (sets.length) {
      params.push(providerId);
      await this.db.query(
        `UPDATE providers SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params,
      );
    }
    return this.reload(providerId);
  }

  private async insertService(providerId: string, body: any) {
    if (body?.price == null || !body?.name) {
      throw new BadRequestException('name and price are required');
    }
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO services (id, provider_id, name, description, price, duration_minutes, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,true,NOW())`,
      [
        id,
        providerId,
        body.name,
        body.description ?? null,
        body.price,
        body.duration_minutes ?? 60,
      ],
    );
    return this.db.queryOne(
      `SELECT ${SERVICE_FIELDS} FROM services WHERE id = $1`,
      [id],
    );
  }

  private async setStatus(
    providerId: string,
    status: string,
    reason: string | null,
    notifTitle: string,
    notifBody: string,
  ) {
    const provider = await this.db.queryOne<any>(
      `SELECT id, user_id FROM providers WHERE id = $1`,
      [providerId],
    );
    if (!provider) throw new NotFoundException('Provider not found');
    await this.db.query(
      `UPDATE providers SET status = $1, status_reason = $2, updated_at = NOW() WHERE id = $3`,
      [status, reason, providerId],
    );
    // In-app notification (push is best-effort; wired when notifications module lands).
    await this.db.query(
      `INSERT INTO notifications (id, user_id, title, description, type, is_read, created_at)
       VALUES ($1,$2,$3,$4,'system',false,NOW())`,
      [randomUUID(), provider.user_id, notifTitle, notifBody],
    );
  }
}
