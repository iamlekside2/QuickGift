import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';

const CONV_FIELDS = `id, buyer_id, provider_id, provider_name, last_message, last_message_at, created_at`;
const MSG_FIELDS = `id, conversation_id, sender_role, text, created_at`;

@Injectable()
export class ChatsService {
  constructor(private readonly db: DatabaseService) {}

  async listConversations(userId: string, q: any) {
    const page = Number(q.page ?? 1);
    const perPage = Number(q.per_page ?? 30);
    return this.db.query(
      `SELECT ${CONV_FIELDS} FROM conversations
       WHERE buyer_id = $1 OR provider_id = $1
       ORDER BY last_message_at DESC NULLS LAST, created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, perPage, (page - 1) * perPage],
    );
  }

  private async assertMember(convId: string, userId: string) {
    const conv = await this.db.queryOne<any>(
      `SELECT id, buyer_id, provider_id FROM conversations
       WHERE id = $1 AND (buyer_id = $2 OR provider_id = $2)`,
      [convId, userId],
    );
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async getMessages(convId: string, userId: string) {
    await this.assertMember(convId, userId);
    // Last 100, returned in chronological order.
    return this.db.query(
      `SELECT ${MSG_FIELDS} FROM (
         SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 100
       ) m ORDER BY created_at ASC`,
      [convId],
    );
  }

  async sendMessage(convId: string, userId: string, req: any) {
    const conv = await this.assertMember(convId, userId);
    const role = userId === conv.buyer_id ? 'buyer' : 'provider';
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO messages (id, conversation_id, sender_role, text, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [id, convId, role, req?.text],
    );
    await this.db.query(
      `UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2`,
      [req?.text, convId],
    );
    // Push to the other participant is best-effort (wired with the push helper later).
    return this.db.queryOne(`SELECT ${MSG_FIELDS} FROM messages WHERE id = $1`, [id]);
  }

  async createConversation(userId: string, req: any) {
    const id = randomUUID();
    const hasInitial = !!req?.initial_message;
    await this.db.query(
      `INSERT INTO conversations (id, buyer_id, provider_id, provider_name, last_message, last_message_at, created_at)
       VALUES ($1,$2,$3,$4,$5, ${hasInitial ? 'NOW()' : 'NULL'}, NOW())`,
      [id, userId, req?.provider_id, req?.provider_name, req?.initial_message ?? null],
    );
    if (hasInitial) {
      await this.db.query(
        `INSERT INTO messages (id, conversation_id, sender_role, text, created_at)
         VALUES ($1,$2,'buyer',$3,NOW())`,
        [randomUUID(), id, req.initial_message],
      );
    }
    return this.db.queryOne(`SELECT ${CONV_FIELDS} FROM conversations WHERE id = $1`, [id]);
  }
}
