import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface BusinessSettings {
  gift_commission: number;
  beauty_commission: number;
  min_order_amount: number;
  payout_hold_hours: number;
  maintenance_mode: boolean;
  platform_name: string;
  support_email: string | null;
  support_phone: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Editable, DB-backed business settings (single row, id = 1). Seeded from the
 * old env defaults on first boot. Order/booking commission and the minimum
 * order amount read from here, so changing them in the admin takes effect live.
 * Integration keys (Paystack/Brevo/etc.) stay in the environment and are only
 * surfaced read-only.
 */
@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache: BusinessSettings | null = null;
  private cachedAt = 0;
  private readonly TTL_MS = 15000;

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id                INT PRIMARY KEY DEFAULT 1,
        gift_commission   NUMERIC NOT NULL DEFAULT 10,
        beauty_commission NUMERIC NOT NULL DEFAULT 10,
        min_order_amount  NUMERIC NOT NULL DEFAULT 0,
        payout_hold_hours INT     NOT NULL DEFAULT 24,
        maintenance_mode  BOOLEAN NOT NULL DEFAULT false,
        platform_name     TEXT    NOT NULL DEFAULT 'QuickGift',
        support_email     TEXT,
        support_phone     TEXT,
        updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT app_settings_singleton CHECK (id = 1)
      )
    `);
    const gift = Number(process.env.GIFT_COMMISSION_PERCENT ?? '10');
    const beauty = Number(process.env.BEAUTY_COMMISSION_PERCENT ?? '10');
    await this.db.query(
      `INSERT INTO app_settings (id, gift_commission, beauty_commission)
       VALUES (1, $1, $2) ON CONFLICT (id) DO NOTHING`,
      [gift, beauty],
    );
    this.logger.log('app_settings ready');
  }

  private coerce(row: any): BusinessSettings {
    return {
      gift_commission: Number(row.gift_commission),
      beauty_commission: Number(row.beauty_commission),
      min_order_amount: Number(row.min_order_amount),
      payout_hold_hours: Number(row.payout_hold_hours),
      maintenance_mode: !!row.maintenance_mode,
      platform_name: row.platform_name,
      support_email: row.support_email,
      support_phone: row.support_phone,
    };
  }

  /** Cached read of the settings row (short TTL; busted on update). */
  async get(): Promise<BusinessSettings> {
    if (this.cache && Date.now() - this.cachedAt < this.TTL_MS) return this.cache;
    const row = await this.db.queryOne(`SELECT * FROM app_settings WHERE id = 1`);
    this.cache = this.coerce(row ?? {});
    this.cachedAt = Date.now();
    return this.cache;
  }

  async getGiftCommission(): Promise<number> {
    return (await this.get()).gift_commission;
  }

  async getBeautyCommission(): Promise<number> {
    return (await this.get()).beauty_commission;
  }

  async getMinOrderAmount(): Promise<number> {
    return (await this.get()).min_order_amount;
  }

  async update(data: any): Promise<BusinessSettings> {
    const sets: string[] = [];
    const params: any[] = [];
    const push = (col: string, val: any) => {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    };

    const pct = (v: any, label: string) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        throw new BadRequestException(`${label} must be between 0 and 100`);
      }
      return n;
    };

    if (data.gift_commission !== undefined) push('gift_commission', pct(data.gift_commission, 'Gift commission'));
    if (data.beauty_commission !== undefined) push('beauty_commission', pct(data.beauty_commission, 'Services commission'));
    if (data.min_order_amount !== undefined) {
      const n = Number(data.min_order_amount);
      if (!Number.isFinite(n) || n < 0) throw new BadRequestException('Minimum order amount must be 0 or more');
      push('min_order_amount', n);
    }
    if (data.payout_hold_hours !== undefined) {
      const n = Math.round(Number(data.payout_hold_hours));
      if (!Number.isFinite(n) || n < 0 || n > 720) throw new BadRequestException('Payout hold must be between 0 and 720 hours');
      push('payout_hold_hours', n);
    }
    if (data.maintenance_mode !== undefined) push('maintenance_mode', !!data.maintenance_mode);
    if (data.platform_name !== undefined) {
      const name = String(data.platform_name).trim();
      if (!name) throw new BadRequestException('Platform name cannot be empty');
      push('platform_name', name.slice(0, 80));
    }
    if (data.support_email !== undefined) {
      const email = String(data.support_email).trim();
      if (email && !EMAIL_RE.test(email)) throw new BadRequestException('Support email is not valid');
      push('support_email', email || null);
    }
    if (data.support_phone !== undefined) {
      push('support_phone', String(data.support_phone).trim().slice(0, 40) || null);
    }

    if (sets.length) {
      await this.db.query(
        `UPDATE app_settings SET ${sets.join(', ')}, updated_at = NOW() WHERE id = 1`,
        params,
      );
      this.cache = null; // bust cache
    }
    return this.get();
  }

  /** Admin view: editable settings + read-only integration status. */
  async adminView() {
    const settings = await this.get();
    const live = (process.env.PAYSTACK_LIVE || 'false').toLowerCase() === 'true';
    return {
      settings,
      integrations: {
        payments: {
          provider: 'Paystack',
          mode: live ? 'live' : 'test',
          configured: !!(live ? process.env.PAYSTACK_LIVE_SECRET_KEY : process.env.PAYSTACK_TEST_SECRET_KEY),
        },
        email: {
          provider: 'Brevo',
          configured: !!process.env.BREVO_API_KEY,
          from: process.env.MAIL_FROM_EMAIL || null,
        },
        sms: {
          provider: 'Termii',
          configured: !!process.env.TERMII_API_KEY,
        },
        media: {
          provider: 'Cloudinary',
          configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
        },
        delivery: {
          provider: 'Kwik',
          mode: process.env.KWIK_ENV || 'test',
          configured: !!process.env.KWIK_EMAIL,
        },
        admin_notify_email: process.env.ADMIN_NOTIFY_EMAIL || process.env.MAIL_FROM_EMAIL || null,
      },
    };
  }
}
