import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { SecurityService, isDeployed, signingSecret } from '../../common/security.service';
import { NotifyService } from '../../common/notify.service';
import { AuditService } from '../../common/audit.service';
import { creditWallet, ledgerRef } from '../../common/ledger';
import { paging } from '../../common/paging';
import {
  ADMIN_ROLES,
  ELEVATED_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  isAdminRole,
} from '../../common/permissions';
import { AuthUser } from '../../common/current-user.decorator';

const USER_SAFE_FIELDS = `id, full_name, email, phone, avatar_url, city, address, lat, lng, role, is_active, wallet_balance, created_at, updated_at`;
const STAFF_SAFE_FIELDS = `id, full_name, email, phone, role, is_active, created_at, updated_at`;
const PAID_PAYOUT_STATUSES = ['held', 'released', 'paid'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly security: SecurityService,
    private readonly notifier: NotifyService,
    private readonly audit: AuditService,
  ) {}

  private async num(sql: string, params: any[] = []): Promise<number> {
    const row = await this.db.queryOne<{ v: number }>(sql, params);
    return row ? Number((row as any).v) : 0;
  }

  /** Generic paginated `SELECT *` list → {items, total, page, per_page}. */
  private async list(table: string, where: string[], params: any[], q: any) {
    const { page, perPage, offset } = paging(q);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = await this.num(
      `SELECT count(*)::int AS v FROM ${table} ${whereSql}`,
      params,
    );
    const p = [...params, perPage, offset];
    const items = await this.db.query(
      `SELECT * FROM ${table} ${whereSql} ORDER BY created_at DESC LIMIT $${p.length - 1} OFFSET $${p.length}`,
      p,
    );
    return { items, total, page, per_page: perPage };
  }

  /**
   * Paginated list over a joined FROM clause, so the console can show names
   * instead of raw ids. `select`/`from`/`orderBy` are fixed strings written
   * here (never request data); every request value is a bound parameter.
   */
  private async listJoined(
    opts: { select: string; from: string; orderBy: string },
    where: string[],
    params: any[],
    q: any,
  ) {
    const { page, perPage, offset } = paging(q);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = await this.num(
      `SELECT count(*)::int AS v FROM ${opts.from} ${whereSql}`,
      params,
    );
    const p = [...params, perPage, offset];
    const items = await this.db.query(
      `SELECT ${opts.select} FROM ${opts.from} ${whereSql}
       ORDER BY ${opts.orderBy} LIMIT $${p.length - 1} OFFSET $${p.length}`,
      p,
    );
    return { items, total, page, per_page: perPage };
  }

  /** `%term%` for ILIKE, with LIKE wildcards in the term escaped. */
  private like(term: unknown): string {
    return '%' + String(term).trim().replace(/[\\%_]/g, (c) => '\\' + c) + '%';
  }

  // ---- seed (secret-gated) ----
  async seed(secret: string) {
    if (!secret) throw new ForbiddenException('Secret required');
    const expected = Buffer.from(signingSecret());
    const given = Buffer.from(String(secret));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new ForbiddenException('Invalid secret');
    }
    const results: string[] = [];
    const admin = await this.db.queryOne(`SELECT 1 FROM users WHERE email = 'admin@quickgift.ng'`);
    if (!admin) {
      // Never create a deployed owner with a well-known password: use
      // ADMIN_INITIAL_PASSWORD if provided, else generate one and show it once.
      const initial =
        process.env.ADMIN_INITIAL_PASSWORD ||
        (isDeployed() ? randomBytes(12).toString('base64url') : 'admin123');
      await this.db.query(
        `INSERT INTO users (id, full_name, phone, email, password_hash, role, city, is_active, wallet_balance, created_at, updated_at)
         VALUES ($1,'QuickGift Admin','+2348000000000','admin@quickgift.ng',$2,'owner','Lagos',true,0,NOW(),NOW())`,
        [randomUUID(), this.security.hashPassword(initial)],
      );
      results.push('Owner account created');
      if (!process.env.ADMIN_INITIAL_PASSWORD && isDeployed()) {
        results.push(`Temporary owner password (shown once, change it now): ${initial}`);
      }
    } else {
      results.push('Admin user: already exists');
    }
    // Promote the founding account to Owner so it can manage the full team,
    // but only if nobody is an Owner yet (don't override an existing hierarchy).
    const owners = await this.num(`SELECT count(*)::int AS v FROM users WHERE role = 'owner'`);
    if (owners === 0) {
      const promoted = await this.db.queryOne(
        `UPDATE users SET role = 'owner', updated_at = NOW()
         WHERE email = 'admin@quickgift.ng' AND role = 'admin' RETURNING id`,
      );
      if (promoted) results.push('Founding admin promoted to Owner');
    }
    for (const [label, table] of [
      ['Categories', 'categories'],
      ['Occasions', 'occasions'],
      ['Products', 'products'],
      ['Providers', 'providers'],
    ] as const) {
      const c = await this.num(`SELECT count(*)::int AS v FROM ${table}`);
      results.push(`${label}: already has ${c}`);
    }
    return { status: 'ok', results };
  }

  // ---- dashboard ----
  async dashboard() {
    const orderRevenue = await this.num(`SELECT coalesce(sum(total),0)::float AS v FROM orders WHERE payment_status='paid'`);
    const bookingRevenue = await this.num(`SELECT coalesce(sum(price),0)::float AS v FROM bookings WHERE payment_status='paid'`);
    const orderCommission = await this.num(`SELECT coalesce(sum(commission),0)::float AS v FROM orders WHERE payment_status='paid'`);
    const bookingCommission = await this.num(`SELECT coalesce(sum(commission),0)::float AS v FROM bookings WHERE payment_status='paid'`);
    return {
      revenue: { total: orderRevenue + bookingRevenue, gifts: orderRevenue, beauty: bookingRevenue },
      commission: { total: orderCommission + bookingCommission, gifts: orderCommission, beauty: bookingCommission },
      counts: {
        orders: await this.num(`SELECT count(*)::int AS v FROM orders`),
        bookings: await this.num(`SELECT count(*)::int AS v FROM bookings`),
        users: await this.num(`SELECT count(*)::int AS v FROM users`),
        providers: await this.num(`SELECT count(*)::int AS v FROM providers`),
        products: await this.num(`SELECT count(*)::int AS v FROM products`),
      },
      pending: {
        orders: await this.num(`SELECT count(*)::int AS v FROM orders WHERE status='pending'`),
        providers: await this.num(`SELECT count(*)::int AS v FROM providers WHERE status='pending'`),
        bookings: await this.num(`SELECT count(*)::int AS v FROM bookings WHERE status='pending'`),
      },
    };
  }

  // ---- entity lists ----
  listOrders(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`o.status = $${params.length}`); }
    if (q.order_type) { params.push(q.order_type); where.push(`o.order_type = $${params.length}`); }
    if (q.search) {
      params.push(this.like(q.search));
      const i = params.length;
      where.push(`(o.order_number ILIKE $${i} OR o.recipient_name ILIKE $${i} OR u.full_name ILIKE $${i} OR u.phone ILIKE $${i})`);
    }
    return this.listJoined(
      {
        select: `o.*, u.full_name AS customer_name, u.phone AS customer_phone,
                 (SELECT count(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count`,
        from: `orders o LEFT JOIN users u ON u.id = o.user_id`,
        orderBy: `o.created_at DESC`,
      },
      where,
      params,
      q,
    );
  }

  async listUsers(q: any) {
    // Staff/admin accounts live on the Team screen, not in the customer list.
    const where: string[] = [`role NOT IN (${ADMIN_ROLES.map((_, i) => `$${i + 1}`).join(', ')})`];
    const params: any[] = [...ADMIN_ROLES];
    if (q.search) {
      params.push(`%${q.search}%`);
      const i = params.length;
      where.push(`(full_name ILIKE $${i} OR email ILIKE $${i} OR phone ILIKE $${i})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { page, perPage, offset } = paging(q);
    const total = await this.num(`SELECT count(*)::int AS v FROM users ${whereSql}`, params);
    const p = [...params, perPage, offset];
    const items = await this.db.query(
      `SELECT ${USER_SAFE_FIELDS} FROM users ${whereSql} ORDER BY created_at DESC LIMIT $${p.length - 1} OFFSET $${p.length}`,
      p,
    );
    return { items, total, page, per_page: perPage };
  }

  // ---- delete users (for clearing out test/fake accounts) ----
  async deleteUser(id: string, actingUserId?: string) {
    const victim = await this.db.queryOne<{ full_name: string; email: string | null }>(
      `SELECT full_name, email FROM users WHERE id = $1`,
      [id],
    );
    const res = await this.removeUser(id, actingUserId);
    if (!res.ok) throw new BadRequestException(res.reason);
    await this.writeAudit(
      { user_id: actingUserId, role: '' } as AuthUser,
      'deleted',
      { id, full_name: victim?.full_name, email: victim?.email },
      `Removed user ${victim?.full_name || ''}`.trim(),
      'user',
    );
    return { ok: true };
  }

  async bulkDeleteUsers(ids: string[], actingUserId?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No user ids provided');
    }
    if (ids.length > 200) {
      throw new BadRequestException('Too many at once (max 200 per request)');
    }
    let deleted = 0;
    const skipped: Array<{ id: string; reason: string }> = [];
    for (const uid of ids) {
      const res = await this.removeUser(uid, actingUserId);
      if (res.ok) deleted++;
      else skipped.push({ id: uid, reason: res.reason! });
    }
    await this.writeAudit(
      { user_id: actingUserId, role: '' } as AuthUser,
      'bulk_deleted',
      {},
      `Bulk removed ${deleted} user${deleted === 1 ? '' : 's'}` +
        (skipped.length ? ` (${skipped.length} skipped)` : ''),
      'user',
    );
    return { ok: true, deleted, skipped };
  }

  /**
   * Hard-deletes a user and ALL their dependent rows in one transaction.
   * Guards against deleting admin accounts or the acting admin's own account.
   * Covers every table with a FK to users(id) plus the provider sub-tree, so a
   * fake/test account with orders, bookings, chats etc. can be fully removed.
   */
  private async removeUser(
    id: string,
    actingUserId?: string,
    allowStaff = false,
  ): Promise<{ ok: boolean; reason?: string }> {
    if (actingUserId && id === actingUserId) {
      return { ok: false, reason: 'You cannot delete your own account' };
    }
    const u = await this.db.queryOne<{ id: string; role: string }>(
      `SELECT id, role FROM users WHERE id = $1`,
      [id],
    );
    if (!u) return { ok: false, reason: 'User not found' };
    // Staff/admin accounts are only removable via the Team screen (allowStaff),
    // never through the general Users list.
    if (!allowStaff && isAdminRole(u.role)) {
      return { ok: false, reason: 'Staff accounts can only be removed from the Team screen' };
    }
    try {
      await this.db.transaction(async (client) => {
        // Only touch tables that actually exist in this database, so a schema
        // that lacks an optional table (e.g. a fresh/dev DB) doesn't abort the
        // whole delete. Missing tables simply have nothing to clean up.
        const del = async (table: string, clause: string) => {
          const reg = await client.query(
            `SELECT to_regclass($1) AS t`,
            [`public.${table}`],
          );
          if (!reg.rows[0]?.t) return;
          await client.query(`DELETE FROM ${table} WHERE ${clause}`, [id]);
        };

        const prov = (
          await client.query(`SELECT id FROM providers WHERE user_id = $1`, [id])
        ).rows[0];

        // Conversations (as buyer or provider) and their messages
        await del(
          'messages',
          `conversation_id IN (SELECT id FROM conversations WHERE buyer_id = $1 OR provider_id = $1)`,
        );
        await del('conversations', `buyer_id = $1 OR provider_id = $1`);

        // Order chain (as the customer)
        await del(
          'deliveries',
          `user_id = $1 OR order_id IN (SELECT id FROM orders WHERE user_id = $1)`,
        );
        await del('disputes', `buyer_id = $1`);
        await del(
          'order_items',
          `order_id IN (SELECT id FROM orders WHERE user_id = $1)`,
        );
        await del('orders', `user_id = $1`);

        // Bookings made by the user, money + notifications, audit authored
        await del('bookings', `user_id = $1`);
        await del('payouts', `user_id = $1`);
        await del('transactions', `user_id = $1`);
        await del('bank_accounts', `user_id = $1`);
        await del('notifications', `user_id = $1`);
        await del('status_logs', `changed_by = $1`);

        // Provider sub-tree (if this user is also a provider)
        if (prov) {
          const pdel = async (table: string, clause: string) => {
            const reg = await client.query(
              `SELECT to_regclass($1) AS t`,
              [`public.${table}`],
            );
            if (!reg.rows[0]?.t) return;
            await client.query(`DELETE FROM ${table} WHERE ${clause}`, [prov.id]);
          };
          await pdel('bookings', `provider_id = $1`);
          await pdel('payouts', `provider_id = $1`);
          await pdel('status_logs', `provider_id = $1`);
          await pdel('portfolios', `provider_id = $1`);
          await pdel('services', `provider_id = $1`);
          await pdel('providers', `id = $1`);
        }

        // OTPs tied to the phone, then the user
        await client.query(
          `DELETE FROM otps WHERE phone = (SELECT phone FROM users WHERE id = $1)`,
          [id],
        );
        await client.query(`DELETE FROM users WHERE id = $1`, [id]);
      });
      return { ok: true };
    } catch (err) {
      this.logger.error(`removeUser(${id}) failed: ${(err as Error)?.message}`);
      return { ok: false, reason: 'Could not remove — user has linked records' };
    }
  }

  // ---- edit user ----
  async updateUser(id: string, data: any, actor?: AuthUser) {
    const u = await this.db.queryOne<{ id: string; role: string; full_name: string; email: string | null }>(
      `SELECT id, role, full_name, email FROM users WHERE id = $1`,
      [id],
    );
    if (!u) throw new NotFoundException('User not found');
    // Staff accounts are managed only from the Team screen (team.manage), never
    // through the general Users list, so one can't be edited or minted here.
    if (isAdminRole(u.role)) {
      throw new BadRequestException('Manage staff accounts from the Team screen');
    }
    if (data?.role !== undefined && !['user', 'provider'].includes(data.role)) {
      throw new BadRequestException('Invalid role');
    }
    if (data?.email) {
      const dup = await this.db.queryOne(
        `SELECT 1 FROM users WHERE email = $1 AND id <> $2`, [data.email, id]);
      if (dup) throw new BadRequestException('Email already in use by another user');
    }
    if (data?.phone) {
      const dup = await this.db.queryOne(
        `SELECT 1 FROM users WHERE phone = $1 AND id <> $2`, [data.phone, id]);
      if (dup) throw new BadRequestException('Phone already in use by another user');
    }

    const allowed = ['full_name', 'email', 'phone', 'city', 'address', 'role', 'is_active'];
    const sets: string[] = [];
    const params: any[] = [];
    for (const k of allowed) {
      if (data && data[k] !== undefined) {
        params.push(data[k] === '' ? null : data[k]);
        sets.push(`${k} = $${params.length}`);
      }
    }
    if (sets.length) {
      params.push(id);
      await this.db.query(
        `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params,
      );
      // Changing a customer's phone/email changes where their login code is
      // sent, so always leave a trail of who did it.
      const changed = allowed.filter((k) => data && data[k] !== undefined);
      await this.writeAudit(
        actor,
        'updated',
        { id, full_name: u.full_name, email: u.email },
        `Edited user: ${changed.join(', ')}`,
        'user',
      );
    }
    return this.db.queryOne(`SELECT ${USER_SAFE_FIELDS} FROM users WHERE id = $1`, [id]);
  }

  // ======================================================================
  //  Team (workers) — staff accounts that can sign into the admin console.
  //  A worker is just a users row whose role is one of ADMIN_ROLES. They log
  //  in with email + password at /auth/login. Only team.manage holders
  //  (owner/admin) reach these; assigning or touching an elevated role
  //  (owner/admin) additionally requires the actor to be an owner.
  // ======================================================================

  /** Roles an admin can assign, with labels/descriptions for the UI. */
  staffRoles() {
    return ADMIN_ROLES.map((value) => ({
      value,
      label: ROLE_LABELS[value],
      description: ROLE_DESCRIPTIONS[value],
      elevated: ELEVATED_ROLES.includes(value),
    }));
  }

  async listStaff() {
    const roles = ADMIN_ROLES.map((_, i) => `$${i + 1}`).join(', ');
    const items = await this.db.query(
      `SELECT ${STAFF_SAFE_FIELDS} FROM users WHERE role IN (${roles})
       ORDER BY
         CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
         created_at DESC`,
      [...ADMIN_ROLES],
    );
    return { items, total: items.length };
  }

  private assertCanTouchRole(actorRole: string | undefined, targetRole: string) {
    // Only an owner may create, change to, or act on an owner/admin account.
    if (ELEVATED_ROLES.includes(targetRole) && actorRole !== 'owner') {
      throw new ForbiddenException(
        'Only an Owner can manage Owner or Administrator accounts',
      );
    }
  }

  async createStaff(data: any, actor?: AuthUser) {
    const full_name = String(data?.full_name ?? '').trim();
    const email = String(data?.email ?? '').trim().toLowerCase();
    const phone = String(data?.phone ?? '').trim();
    const password = String(data?.password ?? '');
    const role = String(data?.role ?? '').trim();

    if (!full_name) throw new BadRequestException('Full name is required');
    if (!EMAIL_RE.test(email)) {
      throw new BadRequestException('A valid email is required');
    }
    if (!phone) throw new BadRequestException('A phone number is required');
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    if (!isAdminRole(role)) throw new BadRequestException('Invalid role');
    this.assertCanTouchRole(actor?.role, role);

    const emailDup = await this.db.queryOne(`SELECT 1 FROM users WHERE email = $1`, [email]);
    if (emailDup) throw new BadRequestException('That email is already in use');
    const phoneDup = await this.db.queryOne(`SELECT 1 FROM users WHERE phone = $1`, [phone]);
    if (phoneDup) throw new BadRequestException('That phone number is already in use');

    const id = randomUUID();
    await this.db.query(
      `INSERT INTO users (id, full_name, phone, email, password_hash, role, is_active, wallet_balance, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, 0, NOW(), NOW())`,
      [id, full_name, phone, email, this.security.hashPassword(password), role],
    );
    await this.writeAudit(actor, 'created', { id, full_name, email },
      `Created worker as ${this.roleName(role)}`);
    return this.db.queryOne(`SELECT ${STAFF_SAFE_FIELDS} FROM users WHERE id = $1`, [id]);
  }

  private async loadStaff(id: string) {
    const u = await this.db.queryOne<{
      id: string;
      role: string;
      is_active: boolean;
      full_name: string;
      email: string | null;
    }>(
      `SELECT id, role, is_active, full_name, email FROM users WHERE id = $1`,
      [id],
    );
    if (!u || !isAdminRole(u.role)) throw new NotFoundException('Staff member not found');
    return u;
  }

  // ---- audit trail ----
  private roleName(role: string) {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
  }

  /** Delegate to the shared audit writer (kept as a thin wrapper for call sites). */
  private writeAudit(
    actor: AuthUser | undefined,
    action: string,
    target: { id?: string; full_name?: string | null; email?: string | null },
    details: string,
    entity = 'staff',
  ) {
    return this.audit.log(actor, action, target, details, entity);
  }

  /** Team-only audit feed (Team page Activity tab). */
  listStaffAudit(q: any) {
    return this.audit.list(q, { staffOnly: true });
  }

  /** All sensitive admin actions, optionally filtered by entity. */
  listAudit(q: any) {
    return this.audit.list(q);
  }

  private async countOwners(excludeId?: string): Promise<number> {
    return this.num(
      `SELECT count(*)::int AS v FROM users WHERE role = 'owner'${excludeId ? ' AND id <> $1' : ''}`,
      excludeId ? [excludeId] : [],
    );
  }

  async updateStaff(id: string, data: any, actor: AuthUser) {
    const target = await this.loadStaff(id);
    const isSelf = actor?.user_id === id;

    // Guard the current role, then the new role if it's changing.
    this.assertCanTouchRole(actor?.role, target.role);

    const sets: string[] = [];
    const params: any[] = [];
    const changes: string[] = [];

    if (data?.full_name !== undefined) {
      const name = String(data.full_name).trim();
      if (!name) throw new BadRequestException('Full name cannot be empty');
      params.push(name);
      sets.push(`full_name = $${params.length}`);
      if (name !== target.full_name) changes.push(`Name: ${target.full_name} → ${name}`);
    }

    if (data?.role !== undefined && data.role !== target.role) {
      const newRole = String(data.role).trim();
      if (!isAdminRole(newRole)) throw new BadRequestException('Invalid role');
      if (isSelf) throw new BadRequestException('You cannot change your own role');
      this.assertCanTouchRole(actor?.role, newRole);
      if (target.role === 'owner' && (await this.countOwners(id)) === 0) {
        throw new BadRequestException('There must be at least one Owner');
      }
      params.push(newRole);
      sets.push(`role = $${params.length}`);
      changes.push(`Role: ${this.roleName(target.role)} → ${this.roleName(newRole)}`);
    }

    if (data?.is_active !== undefined) {
      const active = !!data.is_active;
      if (active !== target.is_active) {
        if (!active && isSelf) {
          throw new BadRequestException('You cannot deactivate your own account');
        }
        if (!active && target.role === 'owner' && (await this.countOwners(id)) === 0) {
          throw new BadRequestException('There must be at least one active Owner');
        }
        params.push(active);
        sets.push(`is_active = $${params.length}`);
        changes.push(active ? 'Activated' : 'Deactivated');
      }
    }

    if (sets.length) {
      params.push(id);
      await this.db.query(
        `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params,
      );
      await this.writeAudit(
        actor,
        'updated',
        { id, full_name: target.full_name, email: target.email },
        changes.join('; ') || 'Updated',
      );
    }
    return this.db.queryOne(`SELECT ${STAFF_SAFE_FIELDS} FROM users WHERE id = $1`, [id]);
  }

  async resetStaffPassword(id: string, password: string, actor: AuthUser) {
    const target = await this.loadStaff(id);
    this.assertCanTouchRole(actor?.role, target.role);
    if (!password || String(password).length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    await this.db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [this.security.hashPassword(String(password)), id],
    );
    await this.writeAudit(
      actor,
      'password_reset',
      { id, full_name: target.full_name, email: target.email },
      'Reset the sign-in password',
    );
    return { ok: true };
  }

  async deleteStaff(id: string, actor: AuthUser) {
    const target = await this.loadStaff(id);
    if (actor?.user_id === id) {
      throw new BadRequestException('You cannot remove your own account');
    }
    this.assertCanTouchRole(actor?.role, target.role);
    if (target.role === 'owner' && (await this.countOwners(id)) === 0) {
      throw new BadRequestException('There must be at least one Owner');
    }
    const res = await this.removeUser(id, actor?.user_id, true);
    if (!res.ok) throw new BadRequestException(res.reason);
    await this.writeAudit(
      actor,
      'deleted',
      { id, full_name: target.full_name, email: target.email },
      `Removed worker (${this.roleName(target.role)})`,
    );
    return { ok: true };
  }

  // ---- edit provider ----
  async updateProvider(id: string, data: any) {
    const p = await this.db.queryOne(`SELECT id FROM providers WHERE id = $1`, [id]);
    if (!p) throw new NotFoundException('Provider not found');

    const allowed = [
      'business_name', 'service_type', 'bio', 'location', 'city',
      'experience_years', 'plan', 'is_available',
      'offers_home_service', 'offers_salon_service',
    ];
    const sets: string[] = [];
    const params: any[] = [];
    for (const k of allowed) {
      if (data && data[k] !== undefined) {
        params.push(data[k] === '' ? null : data[k]);
        sets.push(`${k} = $${params.length}`);
      }
    }
    if (sets.length) {
      params.push(id);
      await this.db.query(
        `UPDATE providers SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params,
      );
    }
    return this.db.queryOne(`SELECT * FROM providers WHERE id = $1`, [id]);
  }

  // ---- products ----
  /** Every product regardless of status, for the console (the public list is active-only). */
  listProducts(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`p.status = $${params.length}`); }
    if (q.category_id) { params.push(q.category_id); where.push(`p.category_id = $${params.length}`); }
    if (q.search) {
      params.push(this.like(q.search));
      const i = params.length;
      where.push(`(p.name ILIKE $${i} OR p.vendor_name ILIKE $${i})`);
    }
    return this.listJoined(
      {
        select: `p.*, c.name AS category_name`,
        from: `products p LEFT JOIN categories c ON c.id = p.category_id`,
        orderBy: `p.created_at DESC`,
      },
      where,
      params,
      q,
    );
  }

  /**
   * Removes a product. One that has ever been ordered is archived (hidden from
   * the store) instead of deleted: deleting it would also erase the line items
   * of paid orders, which are the financial record.
   */
  async deleteProduct(id: string, actor?: AuthUser) {
    const p = await this.db.queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM products WHERE id = $1`,
      [id],
    );
    if (!p) throw new NotFoundException('Product not found');
    const ordered = await this.db.queryOne(
      `SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1`,
      [id],
    );
    if (ordered) {
      await this.db.query(
        `UPDATE products SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
        [id],
      );
      await this.writeAudit(actor, 'archived', { id, full_name: p.name },
        `Archived product "${p.name}" (it has order history, so it was hidden rather than deleted)`, 'product');
      return { ok: true, archived: true };
    }
    await this.db.query(`DELETE FROM products WHERE id = $1`, [id]);
    await this.writeAudit(actor, 'deleted', { id, full_name: p.name },
      `Removed product "${p.name}"`, 'product');
    return { ok: true, archived: false };
  }

  async clearProducts(actor?: AuthUser) {
    const result = await this.db.transaction(async (client) => {
      const archived = (
        await client.query(
          `UPDATE products SET status = 'inactive', updated_at = NOW()
           WHERE id IN (SELECT DISTINCT product_id FROM order_items) AND status <> 'inactive'`,
        )
      ).rowCount ?? 0;
      const deleted = (
        await client.query(
          `DELETE FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM order_items)`,
        )
      ).rowCount ?? 0;
      return { archived, deleted };
    });
    await this.writeAudit(actor, 'cleared', {},
      `Cleared products (${result.deleted} removed, ${result.archived} archived because they have order history)`, 'product');
    return { ok: true, ...result };
  }

  // ---- create / edit products ----
  async createProduct(data: any) {
    const name = String(data?.name ?? '').trim();
    if (!name) throw new BadRequestException('Product name is required');
    const price = Number(data?.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('A valid price is required');
    }
    const category_id = String(data?.category_id ?? '').trim();
    if (!category_id) throw new BadRequestException('Category is required');
    const cat = await this.db.queryOne(`SELECT 1 FROM categories WHERE id = $1`, [category_id]);
    if (!cat) throw new BadRequestException('Invalid category');

    const id = randomUUID();
    const compare = data?.compare_price !== undefined && data?.compare_price !== '' && data?.compare_price !== null
      ? Number(data.compare_price) : null;
    if (compare !== null && (!Number.isFinite(compare) || compare < 0)) {
      throw new BadRequestException('Compare-at price is not valid');
    }
    const status = ['active', 'inactive', 'draft'].includes(data?.status) ? data.status : 'active';

    await this.db.query(
      `INSERT INTO products
         (id, name, description, price, compare_price, category_id, vendor_name, vendor_id,
          image_url, images, rating, review_count, order_count, status, is_featured, tags, city, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,$8,NULL,0,0,0,$9,$10,$11,$12,NOW(),NOW())`,
      [
        id, name,
        String(data?.description ?? '').trim() || null,
        price,
        compare,
        category_id,
        String(data?.vendor_name ?? '').trim() || 'QuickGift',
        String(data?.image_url ?? '').trim() || null,
        status,
        !!data?.is_featured,
        String(data?.tags ?? '').trim() || null,
        String(data?.city ?? '').trim() || null,
      ],
    );
    return this.db.queryOne(`SELECT * FROM products WHERE id = $1`, [id]);
  }

  async updateProduct(id: string, data: any) {
    const p = await this.db.queryOne(`SELECT id FROM products WHERE id = $1`, [id]);
    if (!p) throw new NotFoundException('Product not found');
    if (data?.category_id) {
      const cat = await this.db.queryOne(`SELECT 1 FROM categories WHERE id = $1`, [data.category_id]);
      if (!cat) throw new BadRequestException('Invalid category');
    }
    const allowed = [
      'name', 'description', 'price', 'compare_price', 'category_id',
      'vendor_name', 'image_url', 'status', 'is_featured', 'tags', 'city',
    ];
    const sets: string[] = [];
    const params: any[] = [];
    for (const k of allowed) {
      if (data && data[k] !== undefined) {
        let v: any = data[k];
        if (k === 'price' || k === 'compare_price') {
          v = v === '' || v === null ? null : Number(v);
          if (v !== null && (!Number.isFinite(v) || v < 0)) {
            throw new BadRequestException('Price is not valid');
          }
          if (k === 'price' && v === null) throw new BadRequestException('Price is required');
        } else if (k === 'status') {
          if (!['active', 'inactive', 'draft'].includes(v)) {
            throw new BadRequestException('Invalid status');
          }
        } else if (k === 'name') {
          v = String(v).trim();
          if (!v) throw new BadRequestException('Product name is required');
        }
        else if (k === 'is_featured') v = !!v;
        else if (v === '') v = null;
        params.push(v);
        sets.push(`${k} = $${params.length}`);
      }
    }
    if (sets.length) {
      params.push(id);
      await this.db.query(
        `UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params,
      );
    }
    return this.db.queryOne(`SELECT * FROM products WHERE id = $1`, [id]);
  }

  listProviders(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return this.db.query(`SELECT * FROM providers ${whereSql} ORDER BY created_at DESC`, params);
  }

  listBookings(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`b.status = $${params.length}`); }
    if (q.search) {
      params.push(this.like(q.search));
      const i = params.length;
      where.push(`(b.booking_number ILIKE $${i} OR u.full_name ILIKE $${i} OR pr.business_name ILIKE $${i} OR b.service_name ILIKE $${i})`);
    }
    return this.listJoined(
      {
        select: `b.*, u.full_name AS client_name, u.phone AS client_phone, pr.business_name AS provider_name`,
        from: `bookings b LEFT JOIN users u ON u.id = b.user_id LEFT JOIN providers pr ON pr.id = b.provider_id`,
        orderBy: `b.created_at DESC`,
      },
      where,
      params,
      q,
    );
  }

  listPayments(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    return this.list('payments', where, params, q);
  }

  listTransactions(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.type) { params.push(q.type); where.push(`t.type = $${params.length}`); }
    if (q.search) {
      params.push(this.like(q.search));
      const i = params.length;
      where.push(`(t.reference ILIKE $${i} OR t.description ILIKE $${i} OR u.full_name ILIKE $${i})`);
    }
    return this.listJoined(
      {
        select: `t.*, u.full_name AS user_name, u.phone AS user_phone`,
        from: `transactions t LEFT JOIN users u ON u.id = t.user_id`,
        orderBy: `t.created_at DESC`,
      },
      where,
      params,
      q,
    );
  }

  listReferrals(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`r.status = $${params.length}`); }
    if (q.search) {
      params.push(this.like(q.search));
      const i = params.length;
      where.push(`(ru.full_name ILIKE $${i} OR fu.full_name ILIKE $${i} OR r.code ILIKE $${i} OR ru.phone ILIKE $${i} OR fu.phone ILIKE $${i})`);
    }
    return this.listJoined(
      {
        select: `r.id, r.code, r.status, r.reward_amount, r.created_at, r.rewarded_at,
                 ru.full_name AS referrer_name, ru.phone AS referrer_phone,
                 fu.full_name AS friend_name, fu.phone AS friend_phone`,
        from: `referrals r
               LEFT JOIN users ru ON ru.id = r.referrer_id
               LEFT JOIN users fu ON fu.id = r.referred_id`,
        orderBy: `r.created_at DESC`,
      },
      where,
      params,
      q,
    );
  }

  listPayouts(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`po.status = $${params.length}`); }
    if (q.search) {
      params.push(this.like(q.search));
      const i = params.length;
      where.push(`(pr.business_name ILIKE $${i} OR o.order_number ILIKE $${i} OR b.booking_number ILIKE $${i})`);
    }
    return this.listJoined(
      {
        select: `po.*, pr.business_name AS provider_name, o.order_number, b.booking_number`,
        from: `payouts po
               LEFT JOIN providers pr ON pr.id = po.provider_id
               LEFT JOIN orders o ON o.id = po.order_id
               LEFT JOIN bookings b ON b.id = po.booking_id`,
        orderBy: `po.created_at DESC`,
      },
      where,
      params,
      q,
    );
  }

  listDeliveries(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    return this.list('deliveries', where, params, q);
  }

  // ---- payouts ----
  /**
   * Releases a held payout to the provider's wallet exactly once. The status
   * flip is the first statement and is conditional, so a double-click or two
   * staff members releasing together cannot credit the provider twice.
   */
  async releasePayout(payoutId: string, actor?: AuthUser) {
    const result = await this.db.transaction(async (client) => {
      const payout = (
        await client.query(
          `UPDATE payouts SET status = 'paid', paid_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND status = 'held' RETURNING *`,
          [payoutId],
        )
      ).rows[0];
      if (!payout) {
        const cur = (await client.query(`SELECT status FROM payouts WHERE id = $1`, [payoutId])).rows[0];
        if (!cur) throw new NotFoundException('Payout not found');
        throw new BadRequestException(`Cannot release payout in '${cur.status}' status`);
      }
      if (payout.hold_until && new Date(payout.hold_until).getTime() > Date.now()) {
        throw new BadRequestException(
          'This payout is still in its hold period and cannot be released yet.',
        );
      }
      // Never pay out for something that was refunded or cancelled.
      const table = payout.order_id ? 'orders' : 'bookings';
      const target = (
        await client.query(`SELECT status, payment_status FROM ${table} WHERE id = $1`, [
          payout.order_id ?? payout.booking_id,
        ])
      ).rows[0];
      if (!target || target.payment_status !== 'paid' || ['cancelled', 'declined'].includes(target.status)) {
        throw new BadRequestException(
          'The order or booking behind this payout is no longer paid, so it cannot be released.',
        );
      }
      const provider = (
        await client.query(`SELECT id, user_id FROM providers WHERE id = $1`, [payout.provider_id])
      ).rows[0];
      if (!provider) throw new BadRequestException('The provider for this payout no longer exists');
      const kind = payout.order_id ? 'order' : 'booking';
      const balance = await creditWallet(
        client,
        provider.user_id,
        Number(payout.amount),
        `Payout for ${kind} ${payout.order_id || payout.booking_id}`,
        ledgerRef('PO'),
      );
      if (balance === null) throw new BadRequestException('The provider account no longer exists');
      await client.query(
        `UPDATE providers SET total_revenue = total_revenue + $1 WHERE id = $2`,
        [payout.amount, provider.id],
      );
      return { payout, providerUserId: provider.user_id as string };
    });

    const amt = `₦${Math.round(Number(result.payout.amount)).toLocaleString('en-US')}`;
    await this.notifier
      .notify(result.providerUserId, 'Payment Received!', `${amt} has been credited to your wallet.`, 'payment')
      .catch(() => undefined);
    await this.writeAudit(actor, 'released', { id: payoutId, full_name: amt },
      `Released ${amt} payout`, 'payout');
    return { status: 'ok', payout_id: payoutId, amount: result.payout.amount };
  }

  async cancelPayout(payoutId: string, actor?: AuthUser) {
    const payout = await this.db.queryOne<any>(
      `UPDATE payouts SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status IN ('held','pending') RETURNING amount`,
      [payoutId],
    );
    if (!payout) {
      const cur = await this.db.queryOne<any>(`SELECT status FROM payouts WHERE id = $1`, [payoutId]);
      if (!cur) throw new NotFoundException('Payout not found');
      throw new BadRequestException(
        cur.status === 'paid' ? 'Cannot cancel an already paid payout' : `Payout is already ${cur.status}`,
      );
    }
    const amt = `₦${Math.round(Number(payout.amount) || 0).toLocaleString('en-US')}`;
    await this.writeAudit(actor, 'cancelled', { id: payoutId, full_name: amt },
      `Cancelled ${amt} payout`, 'payout');
    return { status: 'ok', payout_id: payoutId };
  }

  async payoutStats() {
    return {
      held: await this.num(`SELECT coalesce(sum(amount),0)::float AS v FROM payouts WHERE status='held'`),
      released: await this.num(`SELECT coalesce(sum(amount),0)::float AS v FROM payouts WHERE status='released'`),
      paid: await this.num(`SELECT coalesce(sum(amount),0)::float AS v FROM payouts WHERE status='paid'`),
      total_commission: await this.num(`SELECT coalesce(sum(commission),0)::float AS v FROM payouts WHERE status IN ('held','released','paid')`),
      pending_count: await this.num(`SELECT count(*)::int AS v FROM payouts WHERE status IN ('held','released')`),
    };
  }

  // ---- analytics ----
  async revenueAnalytics() {
    const rows: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const name = start.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const startS = start.toISOString();
      const endS = end.toISOString();
      const gifts = await this.num(
        `SELECT coalesce(sum(total),0)::float AS v FROM orders WHERE payment_status='paid' AND created_at >= $1 AND created_at < $2`,
        [startS, endS],
      );
      const beauty = await this.num(
        `SELECT coalesce(sum(price),0)::float AS v FROM bookings WHERE payment_status='paid' AND created_at >= $1 AND created_at < $2`,
        [startS, endS],
      );
      rows.push({ name, gifts, beauty });
    }
    return rows;
  }

  /** Wallet withdrawals awaiting (or done with) a bank transfer by staff. */
  listWithdrawals(q: any) {
    const where: string[] = [`t.type = 'debit'`, `t.reference LIKE 'WDR-%'`];
    const params: any[] = [];
    if (q.status) { params.push(q.status); where.push(`t.status = $${params.length}`); }
    return this.listJoined(
      {
        select: `t.*, u.full_name AS user_name, u.phone AS user_phone`,
        from: `transactions t LEFT JOIN users u ON u.id = t.user_id`,
        orderBy: `t.created_at DESC`,
      },
      where,
      params,
      q,
    );
  }

  /** Claims a pending withdrawal row (and only a withdrawal) for a new status. */
  private async claimWithdrawal(client: any, txId: string, status: 'completed' | 'failed') {
    const tx = (
      await client.query(
        `UPDATE transactions SET status = $1
         WHERE id = $2 AND status = 'pending' AND type = 'debit' AND reference LIKE 'WDR-%'
         RETURNING user_id, amount, reference`,
        [status, txId],
      )
    ).rows[0];
    if (tx) return tx;
    const cur = (
      await client.query(
        `SELECT status FROM transactions WHERE id = $1 AND type = 'debit' AND reference LIKE 'WDR-%'`,
        [txId],
      )
    ).rows[0];
    if (!cur) throw new NotFoundException('Withdrawal not found');
    throw new BadRequestException(`Withdrawal is already ${cur.status}`);
  }

  async completeWithdrawal(txId: string, actor?: AuthUser) {
    const tx = await this.db.transaction((client) => this.claimWithdrawal(client, txId, 'completed'));
    const amt = `₦${Math.round(Number(tx.amount) || 0).toLocaleString('en-US')}`;
    await this.notifier
      .notify(tx.user_id, 'Withdrawal Sent', `Your withdrawal of ${amt} has been sent to your bank.`, 'payment')
      .catch(() => undefined);
    await this.writeAudit(actor, 'completed', { id: txId, full_name: amt },
      `Marked ${amt} withdrawal completed`, 'withdrawal');
    return { status: 'completed', transaction_id: txId };
  }

  async failWithdrawal(txId: string, actor?: AuthUser) {
    // Claim first, then return the money — two concurrent "fail" clicks cannot
    // both refund.
    const tx = await this.db.transaction(async (client) => {
      const claimed = await this.claimWithdrawal(client, txId, 'failed');
      await creditWallet(
        client,
        claimed.user_id,
        Number(claimed.amount),
        'Withdrawal reversed',
        `${claimed.reference}-RV`,
      );
      return claimed;
    });
    const amt = `₦${Math.round(Number(tx.amount) || 0).toLocaleString('en-US')}`;
    await this.notifier
      .notify(tx.user_id, 'Withdrawal Failed', `Your withdrawal of ${amt} could not be completed and has been returned to your wallet.`, 'payment')
      .catch(() => undefined);
    await this.writeAudit(actor, 'failed', { id: txId, full_name: amt },
      `Marked ${amt} withdrawal failed (refunded to wallet)`, 'withdrawal');
    return { status: 'failed', transaction_id: txId, refunded: true };
  }

  async extendedAnalytics() {
    const statusRows = await this.db.query<{ status: string; count: number }>(
      `SELECT status, count(*)::int AS count FROM orders GROUP BY status`,
    );
    const breakdown: Record<string, number> = {
      pending: 0, confirmed: 0, in_transit: 0, delivered: 0, cancelled: 0,
    };
    for (const r of statusRows) {
      if (r.status in breakdown) breakdown[r.status] = Number(r.count);
    }
    const totalOrders = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const successRate = Math.round((breakdown.delivered / Math.max(totalOrders, 1)) * 1000) / 10;
    const cancelRate = Math.round((breakdown.cancelled / Math.max(totalOrders, 1)) * 1000) / 10;

    const topRaw = await this.db.query<any>(
      `SELECT provider_id, sum(amount)::float AS total_revenue, count(id)::int AS order_count
       FROM payouts WHERE status IN ('held','released','paid')
       GROUP BY provider_id ORDER BY sum(amount) DESC LIMIT 10`,
    );
    const topProviders: any[] = [];
    for (const row of topRaw) {
      const prov = await this.db.queryOne<any>(
        `SELECT id, business_name, service_type, rating FROM providers WHERE id = $1`,
        [row.provider_id],
      );
      if (prov) {
        topProviders.push({
          id: prov.id,
          business_name: prov.business_name,
          service_type: prov.service_type,
          revenue: Number(row.total_revenue),
          orders: Number(row.order_count),
          rating: prov.rating,
        });
      }
    }

    const pendingWithdrawals = await this.num(
      `SELECT coalesce(sum(amount),0)::float AS v FROM transactions WHERE description LIKE '%Withdrawal%' AND status='pending'`,
    );
    const platformFee = await this.num(
      `SELECT coalesce(sum(commission),0)::float AS v FROM payouts WHERE status IN ('held','released','paid')`,
    );

    return {
      order_status_breakdown: breakdown,
      success_rate: successRate,
      cancel_rate: cancelRate,
      top_providers: topProviders,
      pending_withdrawals: pendingWithdrawals,
      platform_fee_earned: platformFee,
    };
  }
}
