import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { paging } from '../../common/paging';

const CONV_FIELDS = `id, buyer_id, provider_id, provider_name, last_message, last_message_at, created_at`;
const MSG_FIELDS = `id, conversation_id, sender_role, text, created_at`;
const MAX_MESSAGE = 2000;

/**
 * Buyer ↔ provider chat. `conversations.provider_id` holds the provider's
 * USER id (the same id space as `buyer_id`), so membership checks compare like
 * with like and the provider actually sees their conversations.
 */
@Injectable()
export class ChatsService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    // Older rows stored the provider *profile* id here, which made every
    // conversation invisible to the provider. Convert them once; afterwards no
    // row matches a provider profile id, so this is a no-op.
    await this.db.query(
      `UPDATE conversations c SET provider_id = p.user_id
       FROM providers p WHERE c.provider_id = p.id`,
    );
  }

  private text(value: unknown): string {
    const t = String(value ?? '').trim();
    if (!t) throw new BadRequestException('Message cannot be empty');
    return t.slice(0, MAX_MESSAGE);
  }

  async listConversations(userId: string, q: any) {
    const { perPage, offset } = paging(q, 30);
    const fields = CONV_FIELDS.split(',')
      .map((f) => 'c.' + f.trim())
      .join(', ');
    return this.db.query(
      `SELECT ${fields}, u.full_name AS buyer_name
       FROM conversations c LEFT JOIN users u ON u.id = c.buyer_id
       WHERE c.buyer_id = $1 OR c.provider_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, perPage, offset],
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
    const text = this.text(req?.text);
    const role = userId === conv.buyer_id ? 'buyer' : 'provider';
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO messages (id, conversation_id, sender_role, text, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [id, convId, role, text],
    );
    await this.db.query(
      `UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2`,
      [text, convId],
    );
    return this.db.queryOne(`SELECT ${MSG_FIELDS} FROM messages WHERE id = $1`, [id]);
  }

  /**
   * Opens the conversation between the caller and a provider, creating it only
   * if one does not already exist (so tapping "chat" twice does not fork the
   * thread). `provider_id` may be the provider's profile id or their user id.
   */
  async createConversation(userId: string, req: any) {
    const given = String(req?.provider_id ?? '').trim();
    if (!given) throw new BadRequestException('provider_id is required');
    const provider = await this.db.queryOne<any>(
      `SELECT user_id, business_name FROM providers WHERE id = $1 OR user_id = $1 LIMIT 1`,
      [given],
    );
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.user_id === userId) {
      throw new BadRequestException('You cannot start a chat with yourself');
    }

    const initial = req?.initial_message ? this.text(req.initial_message) : null;

    let conv = await this.db.queryOne<any>(
      `SELECT id FROM conversations WHERE buyer_id = $1 AND provider_id = $2
       ORDER BY created_at ASC LIMIT 1`,
      [userId, provider.user_id],
    );
    if (!conv) {
      const id = randomUUID();
      await this.db.query(
        `INSERT INTO conversations (id, buyer_id, provider_id, provider_name, last_message, last_message_at, created_at)
         VALUES ($1,$2,$3,$4,NULL,NULL,NOW())`,
        [id, userId, provider.user_id, provider.business_name || 'Provider'],
      );
      conv = { id };
    }
    if (initial) {
      await this.db.query(
        `INSERT INTO messages (id, conversation_id, sender_role, text, created_at)
         VALUES ($1,$2,'buyer',$3,NOW())`,
        [randomUUID(), conv.id, initial],
      );
      await this.db.query(
        `UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2`,
        [initial, conv.id],
      );
    }
    return this.db.queryOne(`SELECT ${CONV_FIELDS} FROM conversations WHERE id = $1`, [conv.id]);
  }
}
