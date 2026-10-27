import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';

const FEEDBACK_FIELDS = `id, user_id, user_name, category, rating, message, app_version, status, created_at`;
const VALID_CATEGORIES = new Set([
  'bug',
  'service',
  'suggestion',
  'complaint',
  'other',
]);

@Injectable()
export class FeedbackService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, req: any) {
    const message = String(req?.message ?? '').trim();
    if (!message) throw new BadRequestException('Message is required');
    if (message.length > 2000) {
      throw new BadRequestException('Message is too long (max 2000 characters)');
    }
    const rating = req?.rating ?? null;
    if (rating !== null && (rating < 1 || rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    const category = VALID_CATEGORIES.has(req?.category) ? req.category : 'other';

    const user = await this.db.queryOne<any>(
      `SELECT full_name FROM users WHERE id = $1`,
      [userId],
    );
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO feedback (id, user_id, user_name, category, rating, message, app_version, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'new',NOW())`,
      [
        id,
        userId,
        user?.full_name ?? null,
        category,
        rating,
        message,
        req?.app_version ?? null,
      ],
    );
    return this.db.queryOne(`SELECT ${FEEDBACK_FIELDS} FROM feedback WHERE id = $1`, [id]);
  }

  async adminList(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    if (q.status) {
      params.push(q.status);
      where.push(`status = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = await this.db.queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM feedback ${whereSql}`,
      params,
    );
    const total = totalRow ? Number(totalRow.count) : 0;

    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 20);
    params.push(perPage, (page - 1) * perPage);
    const items = await this.db.query(
      `SELECT ${FEEDBACK_FIELDS} FROM feedback ${whereSql}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { items, total, page, per_page: perPage };
  }
}
