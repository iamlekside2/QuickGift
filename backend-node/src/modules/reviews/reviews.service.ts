import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { NotifyService } from '../../common/notify.service';

const REVIEW_FIELDS = `id, user_id, user_name, target_type, target_id, order_id, booking_id, rating, comment, created_at`;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifier: NotifyService,
  ) {}

  private async recomputeRating(
    client: PoolClient,
    targetType: string,
    targetId: string,
    ratingFallback: number,
    countFallback: number,
  ) {
    if (targetType !== 'product' && targetType !== 'provider') return;
    const row = (
      await client.query(
        `SELECT AVG(rating) AS avg, COUNT(id) AS count FROM reviews WHERE target_type = $1 AND target_id = $2`,
        [targetType, targetId],
      )
    ).rows[0];
    const avg = row.avg != null ? Number(row.avg) : ratingFallback;
    const count = Number(row.count) || countFallback;
    const rating = Math.round((avg ?? 0) * 10) / 10;
    const table = targetType === 'product' ? 'products' : 'providers';
    await client.query(`UPDATE ${table} SET rating = $1, review_count = $2 WHERE id = $3`, [
      rating,
      count,
      targetId,
    ]);
  }

  async create(userId: string, req: any) {
    const rating = Number(req?.rating);
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Self-review guard for providers
    let provider: any = null;
    if (req.target_type === 'provider') {
      provider = await this.db.queryOne<any>(
        `SELECT id, user_id FROM providers WHERE id = $1`,
        [req.target_id],
      );
      if (provider && provider.user_id === userId) {
        throw new BadRequestException('You cannot review yourself');
      }
    }

    const dup = await this.db.queryOne(
      `SELECT 1 FROM reviews WHERE user_id = $1 AND target_type = $2 AND target_id = $3`,
      [userId, req.target_type, req.target_id],
    );
    if (dup) {
      throw new BadRequestException('You have already reviewed this item');
    }

    const user = await this.db.queryOne<any>(
      `SELECT full_name FROM users WHERE id = $1`,
      [userId],
    );
    const userName = user?.full_name ?? 'User';
    const reviewId = randomUUID();

    let product: any = null;
    await this.db.transaction(async (client) => {
      await client.query(
        `INSERT INTO reviews (id, user_id, user_name, target_type, target_id, order_id, booking_id, rating, comment, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
        [
          reviewId,
          userId,
          userName,
          req.target_type,
          req.target_id,
          req.order_id ?? null,
          req.booking_id ?? null,
          rating,
          req.comment ?? null,
        ],
      );
      await this.recomputeRating(client, req.target_type, req.target_id, rating, 1);
      if (req.target_type === 'product') {
        product = (
          await client.query(`SELECT id, name, vendor_id FROM products WHERE id = $1`, [
            req.target_id,
          ])
        ).rows[0];
      }
    });

    // Notify the owner (best-effort, outside the transaction)
    const stars = '⭐'.repeat(Math.trunc(rating));
    if (req.target_type === 'provider' && provider) {
      const snippet = req.comment ? `: "${String(req.comment).slice(0, 50)}"` : '';
      await this.notifier
        .notify(provider.user_id, 'New Review!', `${userName} left a ${stars} review${snippet}`, 'review')
        .catch(() => undefined);
    } else if (req.target_type === 'product' && product?.vendor_id) {
      const vendor = await this.db.queryOne<any>(
        `SELECT user_id FROM providers WHERE id = $1`,
        [product.vendor_id],
      );
      if (vendor) {
        await this.notifier
          .notify(vendor.user_id, 'New Product Review!', `${userName} reviewed ${product.name} ${stars}`, 'review')
          .catch(() => undefined);
      }
    }

    return this.db.queryOne(`SELECT ${REVIEW_FIELDS} FROM reviews WHERE id = $1`, [reviewId]);
  }

  async list(targetType: string, targetId: string, q: any) {
    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 20);
    return this.db.query(
      `SELECT ${REVIEW_FIELDS} FROM reviews
       WHERE target_type = $1 AND target_id = $2
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [targetType, targetId, perPage, (page - 1) * perPage],
    );
  }

  async remove(reviewId: string) {
    const review = await this.db.queryOne<any>(
      `SELECT target_type, target_id FROM reviews WHERE id = $1`,
      [reviewId],
    );
    if (!review) throw new NotFoundException('Review not found');

    await this.db.transaction(async (client) => {
      await client.query(`DELETE FROM reviews WHERE id = $1`, [reviewId]);
      await this.recomputeRating(client, review.target_type, review.target_id, 0, 0);
    });

    return { message: 'Review deleted', review_id: reviewId };
  }
}
