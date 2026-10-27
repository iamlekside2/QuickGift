import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

const NOTIF_FIELDS = `id, user_id, title, description, type, is_read, created_at`;

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: string, q: any) {
    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 20);
    return this.db.query(
      `SELECT ${NOTIF_FIELDS} FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, perPage, (page - 1) * perPage],
    );
  }

  async markRead(id: string, userId: string) {
    const notif = await this.db.queryOne(
      `SELECT id FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    if (!notif) throw new NotFoundException('Notification not found');
    await this.db.query(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
    return this.db.queryOne(`SELECT ${NOTIF_FIELDS} FROM notifications WHERE id = $1`, [id]);
  }

  async markAllRead(userId: string) {
    await this.db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    return { message: 'All notifications marked as read' };
  }
}
