import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { NotifyService } from '../../common/notify.service';

// Nigeria is UTC+1 all year (no daylight saving). "Today" and the quiet hours
// below are worked out on the Lagos calendar, not the server's.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
// Longest each month can be (29 Feb is a valid birthday).
const MONTH_MAX = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MAX_PER_USER = 100;
const SWEEP_EVERY_MS = 30 * 60 * 1000;
// Nudges are only sent between 08:00 and 20:00 Lagos time.
const QUIET_BEFORE_HOUR = 8;
const QUIET_FROM_HOUR = 20;

interface ReminderRow {
  id: string;
  user_id: string;
  occasion: string;
  person_name: string;
  month: number;
  day: number;
  days_before: number;
  is_active: boolean;
  last_notified_for: string | null;
  created_at: Date;
}

/** Today's date on the Lagos calendar as UTC-midnight milliseconds. */
function lagosToday(): number {
  const now = new Date(Date.now() + LAGOS_OFFSET_MS);
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The next time month/day comes round, today included. A 29 February date
 * falls on the 28th in years that have no 29th.
 */
export function nextOccurrence(month: number, day: number, today = lagosToday()) {
  const year = new Date(today).getUTCFullYear();
  for (const y of [year, year + 1]) {
    const d = Math.min(day, daysInMonth(y, month));
    const at = Date.UTC(y, month - 1, d);
    if (at >= today) {
      return {
        date: new Date(at).toISOString().slice(0, 10),
        days_left: Math.round((at - today) / DAY_MS),
      };
    }
  }
  // Unreachable: next year's date is always in the future.
  return { date: new Date(today).toISOString().slice(0, 10), days_left: 0 };
}

/**
 * Occasion reminders: a person, an occasion and a day of the year. They repeat
 * every year. A few days before each one the owner gets an in-app notification
 * and (when they have an email on file) an email, so there is time to send a
 * gift.
 */
@Injectable()
export class RemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RemindersService.name);
  private timer: NodeJS.Timeout | null = null;
  private first: NodeJS.Timeout | null = null;
  private sweeping = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly notifier: NotifyService,
  ) {}

  async onModuleInit() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id                VARCHAR PRIMARY KEY,
        user_id           VARCHAR NOT NULL,
        occasion          VARCHAR(40) NOT NULL,
        person_name       VARCHAR(80) NOT NULL,
        month             INT NOT NULL,
        day               INT NOT NULL,
        days_before       INT NOT NULL DEFAULT 3,
        is_active         BOOLEAN NOT NULL DEFAULT true,
        last_notified_for DATE,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS ix_reminders_user ON reminders (user_id)`,
    );
    // Check shortly after boot (the host may have been asleep), then regularly.
    this.first = setTimeout(() => void this.sweep(), 60 * 1000);
    this.timer = setInterval(() => void this.sweep(), SWEEP_EVERY_MS);
    this.first.unref?.();
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.first) clearTimeout(this.first);
    if (this.timer) clearInterval(this.timer);
  }

  private present(row: ReminderRow) {
    const next = nextOccurrence(row.month, row.day);
    return {
      id: row.id,
      occasion: row.occasion,
      person_name: row.person_name,
      month: row.month,
      day: row.day,
      days_before: row.days_before,
      is_active: row.is_active,
      next_date: next.date,
      days_left: next.days_left,
      created_at: row.created_at,
    };
  }

  /** Validates the fields that are present; returns only those. */
  private clean(data: any, partial: boolean) {
    const out: Record<string, any> = {};
    const has = (k: string) => data && data[k] !== undefined && data[k] !== null;

    if (has('occasion') || !partial) {
      const occasion = String(data?.occasion ?? '').trim();
      if (!occasion) throw new BadRequestException('Please choose an occasion');
      out.occasion = occasion.slice(0, 40);
    }
    if (has('person_name') || !partial) {
      const person = String(data?.person_name ?? '').trim();
      if (!person) throw new BadRequestException('Please enter who the reminder is for');
      out.person_name = person.slice(0, 80);
    }
    if (has('month') || has('day') || !partial) {
      const month = Number(data?.month);
      const day = Number(data?.day);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new BadRequestException('Please choose a month');
      }
      if (!Number.isInteger(day) || day < 1 || day > MONTH_MAX[month - 1]) {
        throw new BadRequestException('That day does not exist in the month you chose');
      }
      out.month = month;
      out.day = day;
    }
    if (has('days_before')) {
      const n = Number(data.days_before);
      if (!Number.isInteger(n) || n < 0 || n > 30) {
        throw new BadRequestException('Remind me must be between 0 and 30 days before');
      }
      out.days_before = n;
    }
    if (has('is_active')) out.is_active = !!data.is_active;
    return out;
  }

  private async mine(id: string, userId: string): Promise<ReminderRow> {
    const row = await this.db.queryOne<ReminderRow>(
      `SELECT * FROM reminders WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    if (!row) throw new NotFoundException('Reminder not found');
    return row;
  }

  async list(userId: string) {
    const rows = await this.db.query<ReminderRow>(
      `SELECT * FROM reminders WHERE user_id = $1`,
      [userId],
    );
    return rows
      .map((r) => this.present(r))
      .sort((a, b) => a.days_left - b.days_left || a.person_name.localeCompare(b.person_name));
  }

  async create(userId: string, data: any) {
    const v = this.clean(data, false);
    const count = await this.db.queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM reminders WHERE user_id = $1`,
      [userId],
    );
    if ((count?.n ?? 0) >= MAX_PER_USER) {
      throw new BadRequestException(`You can keep up to ${MAX_PER_USER} reminders`);
    }
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO reminders (id, user_id, occasion, person_name, month, day, days_before, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
      [id, userId, v.occasion, v.person_name, v.month, v.day, v.days_before ?? 3, v.is_active ?? true],
    );
    return this.present(await this.mine(id, userId));
  }

  async update(id: string, userId: string, data: any) {
    const current = await this.mine(id, userId);
    // month and day are validated together, so fill in whichever was left out.
    const merged = { ...data };
    if (data?.month !== undefined || data?.day !== undefined) {
      merged.month = data?.month ?? current.month;
      merged.day = data?.day ?? current.day;
    }
    const v = this.clean(merged, true);
    const sets: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(v)) {
      params.push(value);
      sets.push(`${key} = $${params.length}`);
    }
    // A changed date or lead time is a new occasion as far as nudging goes.
    if (v.month !== undefined || v.days_before !== undefined) {
      sets.push(`last_notified_for = NULL`);
    }
    if (sets.length) {
      params.push(id, userId);
      await this.db.query(
        `UPDATE reminders SET ${sets.join(', ')}, updated_at = NOW()
         WHERE id = $${params.length - 1} AND user_id = $${params.length}`,
        params,
      );
    }
    return this.present(await this.mine(id, userId));
  }

  async remove(id: string, userId: string) {
    await this.mine(id, userId);
    await this.db.query(`DELETE FROM reminders WHERE id = $1 AND user_id = $2`, [id, userId]);
    return { status: 'deleted' };
  }

  private when(daysLeft: number): string {
    if (daysLeft <= 0) return 'today';
    if (daysLeft === 1) return 'tomorrow';
    return `in ${daysLeft} days`;
  }

  /**
   * Sends the nudge for every reminder that has come due. Each occurrence is
   * claimed with a conditional UPDATE first, so it is sent once even if two
   * sweeps overlap. `force` skips the quiet-hours check (manual run).
   */
  async sweep(force = false): Promise<{ sent: number; skipped?: string }> {
    if (this.sweeping) return { sent: 0, skipped: 'already running' };
    const hour = new Date(Date.now() + LAGOS_OFFSET_MS).getUTCHours();
    if (!force && (hour < QUIET_BEFORE_HOUR || hour >= QUIET_FROM_HOUR)) {
      return { sent: 0, skipped: 'quiet hours' };
    }
    this.sweeping = true;
    let sent = 0;
    try {
      const today = lagosToday();
      const rows = await this.db.query<ReminderRow>(
        `SELECT r.* FROM reminders r JOIN users u ON u.id = r.user_id
         WHERE r.is_active = true AND u.is_active = true`,
      );
      for (const r of rows) {
        const next = nextOccurrence(r.month, r.day, today);
        if (next.days_left > r.days_before) continue;
        if (r.last_notified_for === next.date) continue;
        const claimed = await this.db.queryOne(
          `UPDATE reminders SET last_notified_for = $1
           WHERE id = $2 AND last_notified_for IS DISTINCT FROM $1 RETURNING id`,
          [next.date, r.id],
        );
        if (!claimed) continue;
        const dateLabel = new Date(next.date + 'T00:00:00Z').toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          timeZone: 'UTC',
        });
        const what = `${r.person_name}'s ${r.occasion}`;
        await this.notifier
          .notify(
            r.user_id,
            `Reminder: ${what} is ${this.when(next.days_left)}`,
            `${what} is on ${dateLabel}. Open QuickGift to send a gift so it arrives on time.`,
            'system',
          )
          .catch((err) => this.logger.warn(`reminder notify failed: ${err?.message}`));
        sent++;
      }
    } catch (err: any) {
      this.logger.error(`reminder sweep failed: ${err?.message}`);
    } finally {
      this.sweeping = false;
    }
    if (sent) this.logger.log(`sent ${sent} occasion reminder(s)`);
    return { sent };
  }
}
