import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from './current-user.decorator';

const AUDIT_FIELDS = `id, entity, actor_id, actor_name, actor_email, action,
  target_id, target_name, target_email, details, created_at`;

/**
 * Single writer/reader for the admin audit trail (who did what, to what, when).
 * Shared across modules (admin, providers, …) so every sensitive action is
 * recorded through one path and the table has a single owner.
 */
@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS staff_audit_logs (
        id          UUID PRIMARY KEY,
        actor_id    UUID,
        actor_name  TEXT,
        actor_email TEXT,
        action      TEXT NOT NULL,
        target_id   UUID,
        target_name TEXT,
        target_email TEXT,
        details     TEXT,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(
      `ALTER TABLE staff_audit_logs ADD COLUMN IF NOT EXISTS entity TEXT NOT NULL DEFAULT 'staff'`,
    );
    await this.db.query(
      `ALTER TABLE staff_audit_logs ALTER COLUMN target_id TYPE TEXT USING target_id::text`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS ix_staff_audit_created ON staff_audit_logs(created_at DESC)`,
    );
  }

  /** Best-effort write — never throws, so it can't fail the real action. */
  async log(
    actor: AuthUser | undefined,
    action: string,
    target: { id?: string; full_name?: string | null; email?: string | null },
    details: string,
    entity = 'staff',
  ) {
    try {
      let actorName: string | null = null;
      let actorEmail: string | null = null;
      if (actor?.user_id) {
        const a = await this.db.queryOne<{ full_name: string; email: string | null }>(
          `SELECT full_name, email FROM users WHERE id = $1`,
          [actor.user_id],
        );
        actorName = a?.full_name ?? null;
        actorEmail = a?.email ?? null;
      }
      await this.db.query(
        `INSERT INTO staff_audit_logs
           (id, entity, actor_id, actor_name, actor_email, action, target_id, target_name, target_email, details, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
        [
          randomUUID(),
          entity,
          actor?.user_id ?? null,
          actorName,
          actorEmail,
          action,
          target.id ?? null,
          target.full_name ?? null,
          target.email ?? null,
          details,
        ],
      );
    } catch (err) {
      this.logger.error(`audit log failed: ${(err as Error)?.message}`);
    }
  }

  /** Paginated feed; `staffOnly` powers the Team Activity tab, else all/entity. */
  async list(q: any, opts: { staffOnly?: boolean } = {}) {
    const page = Math.max(1, Number(q?.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(q?.per_page ?? 40)));
    const where: string[] = [];
    const params: any[] = [];
    if (opts.staffOnly) {
      where.push(`entity = 'staff'`);
    } else if (q?.entity) {
      params.push(q.entity);
      where.push(`entity = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalRow = await this.db.queryOne<{ v: number }>(
      `SELECT count(*)::int AS v FROM staff_audit_logs ${whereSql}`,
      params,
    );
    const total = totalRow ? Number(totalRow.v) : 0;
    const p = [...params, perPage, (page - 1) * perPage];
    const items = await this.db.query(
      `SELECT ${AUDIT_FIELDS} FROM staff_audit_logs ${whereSql}
       ORDER BY created_at DESC LIMIT $${p.length - 1} OFFSET $${p.length}`,
      p,
    );
    return { items, total, page, per_page: perPage };
  }
}
