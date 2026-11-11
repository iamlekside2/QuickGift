import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { SettingsService } from './settings.service';
import { NotifyService } from './notify.service';
import { creditWallet, ledgerRef } from './ledger';

// No 0/O/1/I/L: codes get read out and typed by hand.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
}

/**
 * Refer a friend.
 *
 * Every customer has a personal code. A friend who signs up with it is linked
 * to the referrer (one referrer per account, set once at sign-up). Nothing is
 * paid at sign-up. When the friend's first qualifying order is DELIVERED (or
 * booking COMPLETED), both wallets are credited once.
 *
 * Why the reward waits for a delivered order, and the other guards:
 *  - wallet money can be transferred and withdrawn, so a sign-up bonus would
 *    be free cash for anyone who can create accounts;
 *  - the order must be paid, delivered and at least `referral_min_order`;
 *  - it must not be bought from a shop owned by the referrer or the friend
 *    (self-dealing);
 *  - one referrer can be rewarded at most `referral_max_rewards` times.
 * The claim is a conditional UPDATE, so two status changes racing each other
 * can never pay twice.
 */
@Injectable()
export class ReferralService implements OnModuleInit {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly settings: SettingsService,
    private readonly notifier: NotifyService,
  ) {}

  async onModuleInit() {
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(16)`,
    );
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_users_referral_code
       ON users (referral_code) WHERE referral_code IS NOT NULL`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id            VARCHAR PRIMARY KEY,
        referrer_id   VARCHAR NOT NULL,
        referred_id   VARCHAR NOT NULL UNIQUE,
        code          VARCHAR(16) NOT NULL,
        status        VARCHAR(16) NOT NULL DEFAULT 'pending',
        reward_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        rewarded_at   TIMESTAMP
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS ix_referrals_referrer ON referrals (referrer_id)`,
    );
  }

  private naira(n: number): string {
    return `₦${Math.round(n).toLocaleString('en-US')}`;
  }

  private firstName(fullName?: string | null): string {
    return String(fullName || '').trim().split(/\s+/)[0] || 'A friend';
  }

  /** "Ada O." — enough to recognise a friend, not their full identity. */
  private shortName(fullName?: string | null): string {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'A friend';
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
  }

  normalize(raw: unknown): string {
    return String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  }

  private newCode(): string {
    let s = 'QG';
    for (let i = 0; i < CODE_LENGTH; i++) s += ALPHABET[randomInt(ALPHABET.length)];
    return s;
  }

  /** The user's personal code, created the first time it is asked for. */
  async codeFor(userId: string): Promise<string> {
    const read = () =>
      this.db.queryOne<{ referral_code: string | null }>(
        `SELECT referral_code FROM users WHERE id = $1`,
        [userId],
      );
    const user = await read();
    if (!user) throw new NotFoundException('User not found');
    if (user.referral_code) return user.referral_code;

    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const set = await this.db.queryOne<{ referral_code: string }>(
          `UPDATE users SET referral_code = $1
           WHERE id = $2 AND referral_code IS NULL RETURNING referral_code`,
          [this.newCode(), userId],
        );
        if (set) return set.referral_code;
        // Another request gave this user a code in the meantime.
        const again = await read();
        if (again?.referral_code) return again.referral_code;
      } catch (err: any) {
        if (err?.code !== '23505') throw err; // unique clash: try another code
      }
    }
    throw new Error('Could not allocate a referral code');
  }

  private async rewardedCount(referrerId: string): Promise<number> {
    const row = await this.db.queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM referrals WHERE referrer_id = $1 AND status = 'rewarded'`,
      [referrerId],
    );
    return row?.n ?? 0;
  }

  /** The active customer who owns `code`, if the code can still be used. */
  private async usableReferrer(rawCode: unknown) {
    const code = this.normalize(rawCode);
    if (code.length < 4) return null;
    const cfg = await this.settings.get();
    if (!cfg.referral_enabled) return null;
    const referrer = await this.db.queryOne<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM users
       WHERE referral_code = $1 AND is_active = true AND role IN ('user', 'provider')`,
      [code],
    );
    if (!referrer) return null;
    if ((await this.rewardedCount(referrer.id)) >= cfg.referral_max_rewards) return null;
    return { ...referrer, code };
  }

  /** Public check used by the sign-up form before a code is sent. */
  async check(rawCode: unknown) {
    const cfg = await this.settings.get();
    const referrer = await this.usableReferrer(rawCode);
    if (!referrer) return { valid: false };
    return {
      valid: true,
      referrer_name: this.firstName(referrer.full_name),
      reward_amount: cfg.referral_reward,
    };
  }

  /**
   * Links a brand-new account to the owner of `rawCode`. Never throws: a bad
   * or unusable code must not stop someone creating their account.
   */
  async attach(referredId: string, rawCode: unknown): Promise<boolean> {
    try {
      if (!rawCode) return false;
      const referrer = await this.usableReferrer(rawCode);
      if (!referrer || referrer.id === referredId) return false;
      const row = await this.db.queryOne(
        `INSERT INTO referrals (id, referrer_id, referred_id, code, status, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())
         ON CONFLICT (referred_id) DO NOTHING RETURNING id`,
        [randomUUID(), referrer.id, referredId, referrer.code],
      );
      if (!row) return false;
      const cfg = await this.settings.get();
      const friend = await this.db.queryOne<{ full_name: string }>(
        `SELECT full_name FROM users WHERE id = $1`,
        [referredId],
      );
      await this.notifier
        .notify(
          referrer.id,
          'A friend joined with your code',
          `${this.firstName(friend?.full_name)} just signed up with your code. You each get ${this.naira(cfg.referral_reward)} when their first order is delivered.`,
          'system',
        )
        .catch(() => undefined);
      return true;
    } catch (err: any) {
      this.logger.warn(`attach failed: ${err?.message}`);
      return false;
    }
  }

  /** GET /referrals/me */
  async mine(userId: string) {
    const [code, cfg] = [await this.codeFor(userId), await this.settings.get()];
    const rows = await this.db.query<any>(
      `SELECT r.status, r.reward_amount, r.created_at, r.rewarded_at, u.full_name
       FROM referrals r LEFT JOIN users u ON u.id = r.referred_id
       WHERE r.referrer_id = $1 ORDER BY r.created_at DESC LIMIT 100`,
      [userId],
    );
    const rewarded = rows.filter((r) => r.status === 'rewarded');
    return {
      code,
      enabled: cfg.referral_enabled,
      reward_amount: cfg.referral_reward,
      min_order_amount: cfg.referral_min_order,
      total_referred: rows.length,
      rewarded_count: rewarded.length,
      pending_count: rows.filter((r) => r.status === 'pending').length,
      total_earned: rewarded.reduce((sum, r) => sum + Number(r.reward_amount || 0), 0),
      referrals: rows.map((r) => ({
        name: this.shortName(r.full_name),
        status: r.status,
        reward_amount: Number(r.reward_amount || 0),
        created_at: r.created_at,
        rewarded_at: r.rewarded_at,
      })),
    };
  }

  /**
   * Call after an order is delivered or a booking completed. Pays the referral
   * reward if this buyer was referred and has now earned it. Safe to call any
   * number of times and never throws into the caller's request.
   */
  async onPurchaseFulfilled(buyerId: string): Promise<void> {
    try {
      await this.rewardIfEarned(buyerId);
    } catch (err: any) {
      this.logger.error(`referral reward failed for ${buyerId}: ${err?.message}`);
    }
  }

  private async rewardIfEarned(buyerId: string): Promise<void> {
    const ref = await this.db.queryOne<ReferralRow>(
      `SELECT id, referrer_id, referred_id, status FROM referrals
       WHERE referred_id = $1 AND status = 'pending'`,
      [buyerId],
    );
    if (!ref) return;

    const cfg = await this.settings.get();
    const reward = Math.round(Number(cfg.referral_reward) * 100) / 100;
    if (!cfg.referral_enabled || !(reward > 0)) return; // stays pending

    // A real purchase from someone else's shop, paid and fulfilled.
    const parties = [ref.referrer_id, ref.referred_id];
    const earned = await this.db.queryOne(
      `SELECT 1 FROM orders o
        WHERE o.user_id = $1 AND o.status = 'delivered' AND o.payment_status = 'paid'
          AND o.total >= $2
          AND NOT EXISTS (
            SELECT 1 FROM order_items oi
              JOIN products p ON p.id = oi.product_id
              JOIN providers pr ON pr.id = p.vendor_id
             WHERE oi.order_id = o.id AND pr.user_id = ANY($3::text[]))
       UNION ALL
       SELECT 1 FROM bookings b
         JOIN providers pr ON pr.id = b.provider_id
        WHERE b.user_id = $1 AND b.status = 'completed' AND b.payment_status = 'paid'
          AND b.price >= $2 AND pr.user_id <> ALL($3::text[])
       LIMIT 1`,
      [buyerId, cfg.referral_min_order, parties],
    );
    if (!earned) return;

    const referrer = await this.db.queryOne<{ is_active: boolean; full_name: string }>(
      `SELECT is_active, full_name FROM users WHERE id = $1`,
      [ref.referrer_id],
    );
    const friend = await this.db.queryOne<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id = $1`,
      [buyerId],
    );

    const outcome = await this.db.transaction(async (client) => {
      // Serialise this referrer's rewards so the cap cannot be overshot.
      await client.query(`SELECT 1 FROM users WHERE id = $1 FOR UPDATE`, [ref.referrer_id]);
      const done = (
        await client.query(
          `SELECT count(*)::int AS n FROM referrals WHERE referrer_id = $1 AND status = 'rewarded'`,
          [ref.referrer_id],
        )
      ).rows[0].n as number;
      if (done >= cfg.referral_max_rewards) {
        await client.query(
          `UPDATE referrals SET status = 'capped' WHERE id = $1 AND status = 'pending'`,
          [ref.id],
        );
        return 'capped' as const;
      }
      const claimed = (
        await client.query(
          `UPDATE referrals SET status = 'rewarded', reward_amount = $1, rewarded_at = NOW()
           WHERE id = $2 AND status = 'pending' RETURNING id`,
          [reward, ref.id],
        )
      ).rows[0];
      if (!claimed) return 'already' as const;

      await creditWallet(client, buyerId, reward, 'Referral welcome bonus', ledgerRef('REF'));
      // A referrer who has since deleted or lost their account is not paid.
      if (referrer?.is_active) {
        await creditWallet(
          client,
          ref.referrer_id,
          reward,
          `Referral bonus: ${this.shortName(friend?.full_name)}`,
          ledgerRef('REF'),
        );
      }
      return 'paid' as const;
    });
    if (outcome !== 'paid') return;

    await this.notifier
      .notify(
        buyerId,
        'Referral bonus added',
        `${this.naira(reward)} has been added to your wallet as a welcome bonus for joining with a friend's code.`,
        'payment',
      )
      .catch(() => undefined);
    if (referrer?.is_active) {
      await this.notifier
        .notify(
          ref.referrer_id,
          'You earned a referral bonus',
          `${this.firstName(friend?.full_name)}'s first order was delivered. ${this.naira(reward)} has been added to your wallet.`,
          'payment',
        )
        .catch(() => undefined);
    }
  }
}
