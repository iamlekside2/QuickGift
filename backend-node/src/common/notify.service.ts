import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { MailService } from './mail.service';

/**
 * Mirrors app/core/notify.py — creates an in-app notification record and, when
 * the user has an email on file, emails them the same update (transactional:
 * order/booking/dispute/payment/status changes).
 */
@Injectable()
export class NotifyService {
  constructor(
    private readonly db: DatabaseService,
    private readonly mail: MailService,
  ) {}

  async notify(
    userId: string,
    title: string,
    body: string,
    type = 'system',
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO notifications (id, user_id, title, description, type, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())`,
      [randomUUID(), userId, title, body, type],
    );
    // Best-effort email of the same update. Fire-and-forget so a mail issue
    // never blocks or fails the in-app notification.
    this.emailUser(userId, title, body).catch(() => undefined);
  }

  /** Emails the user the notification, only if mail is configured and they have an address. */
  private async emailUser(userId: string, title: string, body: string): Promise<void> {
    if (!this.mail.enabled) return;
    const u = await this.db.queryOne<{ email: string | null; full_name: string }>(
      `SELECT email, full_name FROM users WHERE id = $1`,
      [userId],
    );
    if (u?.email) {
      await this.mail.sendUserNotification(u.email, u.full_name, title, body);
    }
  }
}
