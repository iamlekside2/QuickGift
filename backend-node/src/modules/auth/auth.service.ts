import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { SecurityService } from '../../common/security.service';
import { SmsService } from '../../common/sms.service';

const DEBUG = process.env.DEBUG === 'true';
const INVALID_PHONE =
  'Invalid phone number. Please use a valid Nigerian number (e.g. +2348012345678, 08012345678).';

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  city: string | null;
  role: string;
  wallet_balance: number;
  is_active: boolean;
  password_hash?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly security: SecurityService,
    private readonly sms: SmsService,
  ) {}

  private async providerExists(userId: string): Promise<boolean> {
    const row = await this.db.queryOne(
      `SELECT 1 FROM providers WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    return !!row;
  }

  private token(user: { id: string; role: string }): string {
    return this.security.createAccessToken({ sub: user.id, role: user.role });
  }

  private userPayload(user: UserRow, extra: Record<string, any> = {}) {
    return {
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      city: user.city,
      wallet_balance: user.wallet_balance,
      ...extra,
    };
  }

  private async loadUserByPhone(phone: string): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(
      `SELECT id, full_name, email, phone, city, role, wallet_balance, is_active
       FROM users WHERE phone = $1`,
      [phone],
    );
  }

  private async loadUserById(id: string): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(
      `SELECT id, full_name, email, phone, city, role, wallet_balance, is_active
       FROM users WHERE id = $1`,
      [id],
    );
  }

  /** Validates the latest unused OTP for phone+code, then marks it used. */
  private async consumeOtp(phone: string, code: string): Promise<void> {
    const otp = await this.db.queryOne<{ id: string; expires_at: Date }>(
      `SELECT id, expires_at FROM otps
       WHERE phone = $1 AND code = $2 AND is_used = false
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code],
    );
    if (!otp || new Date(otp.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.db.query(`UPDATE otps SET is_used = true WHERE id = $1`, [otp.id]);
  }

  async checkPhone(phone: string) {
    if (!this.security.validateNigerianPhone(phone)) {
      throw new BadRequestException(INVALID_PHONE);
    }
    const user = await this.loadUserByPhone(phone);
    return { exists: !!user && user.full_name !== 'QuickGift User' };
  }

  async sendOtp(phone: string) {
    if (!this.security.validateNigerianPhone(phone)) {
      throw new BadRequestException(INVALID_PHONE);
    }
    const recent = await this.db.queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM otps
       WHERE phone = $1 AND created_at >= NOW() - interval '10 minutes'`,
      [phone],
    );
    if ((recent?.count ?? 0) >= 5) {
      throw new HttpException(
        'Too many OTP requests. Please wait a few minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const code = this.security.generateOtp();
    await this.db.query(
      `INSERT INTO otps (id, phone, code, is_used, created_at, expires_at)
       VALUES ($1, $2, $3, false, NOW(), NOW() + interval '10 minutes')`,
      [randomUUID(), phone, code],
    );
    const smsSent = await this.sms.sendOtpSms(phone, code);
    const response: Record<string, any> = { message: 'OTP sent successfully' };
    if (DEBUG || !smsSent) response.otp_dev = code;
    return response;
  }

  async verifyOtp(phone: string, code: string) {
    await this.consumeOtp(phone, code);

    let user = await this.loadUserByPhone(phone);
    let isNew = false;

    if (user && !user.is_active) {
      throw new ForbiddenException(
        'Your account has been deactivated. Please contact support.',
      );
    }
    if (!user) {
      const id = randomUUID();
      await this.db.query(
        `INSERT INTO users (id, full_name, phone, role, is_active, wallet_balance, created_at, updated_at)
         VALUES ($1, 'QuickGift User', $2, 'user', true, 0, NOW(), NOW())`,
        [id, phone],
      );
      user = await this.loadUserById(id);
      isNew = true;
    }

    const profileComplete =
      user!.role === 'provider' ? await this.providerExists(user!.id) : true;

    return {
      access_token: this.token(user!),
      token_type: 'bearer',
      user: this.userPayload(user!, {
        is_new_user: isNew,
        profile_complete: profileComplete,
      }),
    };
  }

  async register(req: any) {
    const { full_name, phone, otp, email, password, city, role } = req || {};
    if (!this.security.validateNigerianPhone(phone)) {
      throw new BadRequestException(INVALID_PHONE);
    }
    await this.consumeOtp(phone, otp);

    const allowed = ['user', 'provider'];
    const newRole = allowed.includes(role) ? role : 'user';
    const pwHash = password ? this.security.hashPassword(password) : null;

    const existing = await this.loadUserByPhone(phone);
    let user: UserRow;

    if (existing) {
      if (existing.full_name !== 'QuickGift User') {
        throw new BadRequestException(
          'This phone number is already registered. Please log in instead.',
        );
      }
      await this.db.query(
        `UPDATE users SET full_name = $1,
           email = COALESCE($2, email),
           password_hash = COALESCE($3, password_hash),
           city = COALESCE($4, city),
           role = $5, updated_at = NOW()
         WHERE id = $6`,
        [full_name, email ?? null, pwHash, city ?? null, newRole, existing.id],
      );
      user = (await this.loadUserById(existing.id))!;
    } else {
      if (email) {
        const emailExists = await this.db.queryOne(
          `SELECT 1 FROM users WHERE email = $1`,
          [email],
        );
        if (emailExists) {
          throw new BadRequestException('Email already registered');
        }
      }
      const id = randomUUID();
      await this.db.query(
        `INSERT INTO users (id, full_name, phone, email, password_hash, city, role, is_active, wallet_balance, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, 0, NOW(), NOW())`,
        [id, full_name, phone, email ?? null, pwHash, city ?? null, newRole],
      );
      user = (await this.loadUserById(id))!;
    }

    const profileComplete =
      user.role === 'provider' ? await this.providerExists(user.id) : true;

    return {
      access_token: this.token(user),
      token_type: 'bearer',
      user: this.userPayload(user, { profile_complete: profileComplete }),
    };
  }

  async login(req: any) {
    const identifier = req?.phone || req?.email;
    if (!identifier) {
      throw new BadRequestException('Phone or email is required');
    }
    const user = await this.db.queryOne<UserRow>(
      `SELECT id, full_name, email, phone, city, role, wallet_balance, is_active, password_hash
       FROM users WHERE phone = $1 OR email = $1`,
      [identifier],
    );
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!this.security.verifyPassword(req.password, user.password_hash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.is_active) {
      throw new ForbiddenException('Account deactivated');
    }
    const profileComplete =
      user.role === 'provider' ? await this.providerExists(user.id) : true;

    return {
      access_token: this.token(user),
      token_type: 'bearer',
      user: this.userPayload(user, { profile_complete: profileComplete }),
    };
  }

  /** GET /auth/me → UserResponse shape. */
  async getMe(userId: string) {
    const user = await this.db.queryOne(
      `SELECT id, full_name, email, phone, city, lat, lng, avatar_url, role, wallet_balance
       FROM users WHERE id = $1`,
      [userId],
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMe(userId: string, data: any) {
    const exists = await this.db.queryOne(`SELECT 1 FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!exists) throw new NotFoundException('User not found');

    const allowed = [
      'full_name',
      'email',
      'city',
      'address',
      'lat',
      'lng',
      'avatar_url',
    ];
    const sets: string[] = [];
    const params: any[] = [];
    for (const key of allowed) {
      if (data && data[key] !== undefined) {
        params.push(data[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    if (sets.length) {
      params.push(userId);
      await this.db.query(
        `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params,
      );
    }
    return this.getMe(userId);
  }

  async registerPushToken(userId: string, token: string) {
    const exists = await this.db.queryOne(`SELECT 1 FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!exists) throw new NotFoundException('User not found');
    await this.db.query(`UPDATE users SET push_token = $1 WHERE id = $2`, [
      token,
      userId,
    ]);
    return { message: 'Push token registered' };
  }
}
