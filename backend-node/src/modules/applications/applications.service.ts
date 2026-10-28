import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { MailService } from '../../common/mail.service';

// Columns selected back to the admin dashboard.
const APP_FIELDS = `id, full_name, business_name, service_type, city, phone, email,
  portfolio_url, message, status, created_at`;
const WAITLIST_FIELDS = `id, email, phone, role, source, created_at`;

const VALID_APP_STATUS = new Set(['new', 'contacted', 'approved', 'rejected']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);

/**
 * Public landing-page capture: provider applications and waitlist signups go
 * straight into the DB and surface in the admin dashboard. No auth — these
 * forms are filled by anonymous visitors on quickgift.ng.
 *
 * Tables are created idempotently on boot so a fresh deploy (e.g. Neon in
 * production) gets them without a manual psql step. They're also declared in
 * db/schema.sql for documentation / fresh installs.
 */
@Injectable()
export class ApplicationsService implements OnModuleInit {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly mail: MailService,
  ) {}

  async onModuleInit() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS provider_applications (
        id            UUID PRIMARY KEY,
        full_name     TEXT NOT NULL,
        business_name TEXT,
        service_type  TEXT,
        city          TEXT,
        phone         TEXT NOT NULL,
        email         TEXT,
        portfolio_url TEXT,
        message       TEXT,
        status        TEXT NOT NULL DEFAULT 'new',
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS waitlist_signups (
        id         UUID PRIMARY KEY,
        email      TEXT,
        phone      TEXT,
        role       TEXT NOT NULL DEFAULT 'customer',
        source     TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // People can now join with an email OR a phone/WhatsApp number, so email is
    // no longer mandatory. Bring existing (production) tables up to date.
    await this.db.query(
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS phone TEXT`,
    );
    await this.db.query(
      `ALTER TABLE waitlist_signups ALTER COLUMN email DROP NOT NULL`,
    );
    // Unique index (not a NOT NULL constraint) dedupes real emails while
    // allowing many phone-only rows, which carry a NULL email.
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_uniq ON waitlist_signups(email)`,
    );
    this.logger.log('provider_applications + waitlist_signups tables ready');
  }

  // ── Public: provider application from the landing page ──────────────
  async createProviderApplication(req: any) {
    const full_name = str(req?.full_name ?? req?.name, 120);
    const phone = str(req?.phone ?? req?.whatsapp, 40);
    if (!full_name) throw new BadRequestException('Your name is required');
    if (!phone) throw new BadRequestException('A phone number is required');

    const email = str(req?.email, 160);
    if (email && !EMAIL_RE.test(email)) {
      throw new BadRequestException('Please enter a valid email address');
    }

    const id = randomUUID();
    await this.db.query(
      `INSERT INTO provider_applications
         (id, full_name, business_name, service_type, city, phone, email, portfolio_url, message, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'new',NOW())`,
      [
        id,
        full_name,
        str(req?.business_name ?? req?.business, 160) || null,
        str(req?.service_type ?? req?.category, 80) || null,
        str(req?.city, 80) || null,
        phone,
        email || null,
        str(req?.portfolio_url ?? req?.instagram, 300) || null,
        str(req?.message, 1000) || null,
      ],
    );
    void this.mail.sendAdminNotification('New provider application', [
      `Name: ${full_name}`,
      `Business: ${str(req?.business_name ?? req?.business, 160) || '—'}`,
      `Service: ${str(req?.service_type ?? req?.category, 80) || '—'}`,
      `City: ${str(req?.city, 80) || '—'}`,
      `Phone: ${phone}`,
      `Email: ${email || '—'}`,
    ]);
    return { ok: true, id };
  }

  // ── Public: waitlist signup from the landing page ───────────────────
  async joinWaitlist(req: any) {
    const email = str(req?.email, 160).toLowerCase();
    const phone = str(req?.phone ?? req?.whatsapp ?? req?.contact, 40);
    if (email && !EMAIL_RE.test(email)) {
      throw new BadRequestException('Please enter a valid email address');
    }
    if (!email && !phone) {
      throw new BadRequestException('Please enter an email address or phone number');
    }
    const role = req?.role === 'provider' ? 'provider' : 'customer';
    const id = randomUUID();
    const source = str(req?.source, 80) || 'landing';
    if (email) {
      // Idempotent on email: a repeat keeps the first signup, refreshes role
      // and backfills a phone number if one is supplied this time.
      // `xmax = 0` in the RETURNING row is true only for a fresh INSERT (not an
      // ON CONFLICT update), so we email a confirmation just once per address.
      const row = await this.db.queryOne<{ inserted: boolean }>(
        `INSERT INTO waitlist_signups (id, email, phone, role, source, created_at)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (email) DO UPDATE SET
           role = EXCLUDED.role,
           phone = COALESCE(EXCLUDED.phone, waitlist_signups.phone)
         RETURNING (xmax = 0) AS inserted`,
        [id, email, phone || null, role, source],
      );
      if (row?.inserted) {
        // Fire-and-forget: send() never throws, so the signup response is not
        // blocked on the mail provider and a mail failure can't fail the join.
        void this.mail.sendWaitlistConfirmation(email, role);
        void this.mail.sendAdminNotification('New waitlist signup', [
          `Email: ${email}`,
          `Role: ${role}`,
          `Source: ${source}`,
        ]);
      }
    } else {
      // Phone-only signup (no email to dedupe on).
      await this.db.query(
        `INSERT INTO waitlist_signups (id, email, phone, role, source, created_at)
         VALUES ($1,NULL,$2,$3,$4,NOW())`,
        [id, phone, role, source],
      );
      void this.mail.sendAdminNotification('New waitlist signup', [
        `Phone: ${phone}`,
        `Role: ${role}`,
        `Source: ${source}`,
      ]);
    }
    return { ok: true };
  }

  // ── Admin: list provider applications ───────────────────────────────
  async listApplications(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status && VALID_APP_STATUS.has(q.status)) {
      params.push(q.status);
      where.push(`status = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = await this.db.queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM provider_applications ${whereSql}`,
      params,
    );
    const total = totalRow ? Number(totalRow.count) : 0;

    const page = Math.max(1, Number(q.page ?? 1));
    const perPage = Math.max(1, Number(q.per_page ?? 20));
    params.push(perPage, (page - 1) * perPage);
    const items = await this.db.query(
      `SELECT ${APP_FIELDS} FROM provider_applications ${whereSql}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { items, total, page, per_page: perPage };
  }

  // ── Admin: move an application through the pipeline ──────────────────
  async updateApplicationStatus(id: string, status: string) {
    if (!VALID_APP_STATUS.has(status)) {
      throw new BadRequestException('Invalid status');
    }
    const row = await this.db.queryOne(
      `UPDATE provider_applications SET status = $2 WHERE id = $1
       RETURNING ${APP_FIELDS}`,
      [id, status],
    );
    if (!row) throw new BadRequestException('Application not found');
    return row;
  }

  // ── Admin: delete a provider application ────────────────────────────
  async deleteApplication(id: string) {
    const row = await this.db.queryOne(
      `DELETE FROM provider_applications WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!row) throw new BadRequestException('Application not found');
    return { ok: true };
  }

  // ── Admin: delete a waitlist signup ─────────────────────────────────
  async deleteWaitlist(id: string) {
    const row = await this.db.queryOne(
      `DELETE FROM waitlist_signups WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!row) throw new BadRequestException('Signup not found');
    return { ok: true };
  }

  // ── Admin: list waitlist signups ────────────────────────────────────
  async listWaitlist(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.role === 'provider' || q.role === 'customer') {
      params.push(q.role);
      where.push(`role = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = await this.db.queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM waitlist_signups ${whereSql}`,
      params,
    );
    const total = totalRow ? Number(totalRow.count) : 0;

    const page = Math.max(1, Number(q.page ?? 1));
    const perPage = Math.max(1, Number(q.per_page ?? 20));
    params.push(perPage, (page - 1) * perPage);
    const items = await this.db.query(
      `SELECT ${WAITLIST_FIELDS} FROM waitlist_signups ${whereSql}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { items, total, page, per_page: perPage };
  }
}
