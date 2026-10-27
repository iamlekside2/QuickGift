import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';

/**
 * Mirrors app/core/notify.py — creates an in-app notification record.
 * (Expo push is best-effort and gets wired when the notifications module lands.)
 */
@Injectable()
export class NotifyService {
  constructor(private readonly db: DatabaseService) {}

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
  }
}
