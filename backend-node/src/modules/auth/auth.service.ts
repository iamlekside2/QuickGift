import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { SecurityService, isDeployed } from '../../common/security.service';
import { RateLimiter } from '../../common/rate-limit';
import { SmsService } from '../../common/sms.service';
import { MailService } from '../../common/mail.service';
import {
  isAdminRole,
  permissionsForRole,
  ROLE_LABELS,
} from '../../common/permissions';

// Read at call time: ConfigModule loads .env after this module is imported, so a
// module-level constant would miss a DEBUG value that only lives in .env.
const isDebug = () => process.env.DEBUG === 'true';
const INVALID_PHONE =
  'Invalid phone number. Please use a valid Nigerian number (e.g. +2348012345678, 08012345678).';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_OTP_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 6;

// Password guessing: 8 failures per account per 15 minutes, then locked out
// until the window passes.
const loginFailures = new RateLimiter(8, 15 * 60 * 1000);

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
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly security: SecurityService,
    private readonly sms: SmsService,
    private readonly mail: MailService,
  ) {}

  async onModuleInit() {
    // Wrong-guess counter per OTP (see consumeOtp).
    await this.db.query(
      `ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0`,
    );
    if (isDebug() && isDeployed()) {
      this.logger.warn(
        'DEBUG=true on a deployed API: login codes are returned in API responses, ' +
          'so anyone can sign in as any customer. Set DEBUG=false before going public.',
      );
    }
  }

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
    const isStaff = isAdminRole(user.role);
    return {
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      city: user.city,
      wallet_balance: user.wallet_balance,
      // Admin console RBAC: the permission list + friendly role label. Empty
      // for ordinary app users (role 'user'/'provider').
      is_staff: isStaff,
      role_label: isStaff ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] : null,
      permissions: permissionsForRole(user.role),
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

  /**
   * Checks `code` against the single live OTP for the phone, then burns it.
   * Each code allows at most MAX_OTP_ATTEMPTS wrong guesses before it is
   * invalidated, so the 6-digit space cannot be brute-forced.
   */
  private async consumeOtp(phone: string, code: string): Promise<void> {
    const otp = await this.db.queryOne<{
      id: string;
      code: string;
      expires_at: Date;
      attempts: number;
    }>(
      `SELECT id, code, expires_at, attempts FROM otps
       WHERE phone = $1 AND is_used = false
       ORDER BY created_at DESC LIMIT 1`,
      [phone],
    );
    if (!otp || new Date(otp.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (Number(otp.attempts) >= MAX_OTP_ATTEMPTS) {
      await this.db.query(`UPDATE otps SET is_used = true WHERE id = $1`, [otp.id]);
      throw new HttpException(
        'Too many incorrect attempts. Please request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (String(code ?? '').trim() !== otp.code) {
      await this.db.query(`UPDATE otps SET attempts = attempts + 1 WHERE id = $1`, [otp.id]);
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.db.query(`UPDATE otps SET is_used = true WHERE id = $1`, [otp.id]);
  }

  /** Staff sign in with email + password only; OTP login would bypass that. */
  private assertNotStaff(user: UserRow | null) {
    if (user && isAdminRole(user.role)) {
      throw new ForbiddenException(
        'Staff accounts sign in with email and password.',
      );
    }
  }

  async checkPhone(phone: string) {
    if (!this.security.validateNigerianPhone(phone)) {
      throw new BadRequestException(INVALID_PHONE);
    }
    const user = await this.loadUserByPhone(phone);
    return { exists: !!user && user.full_name !== 'QuickGift User' };
  }

  async sendOtp(phone: string, email?: string) {
    if (!this.security.validateNigerianPhone(phone)) {
      throw new BadRequestException(INVALID_PHONE);
    }
    const existing = await this.loadUserByPhone(phone);
    this.assertNotStaff(existing);
    if (existing && !existing.is_active) {
      throw new ForbiddenException(
        'Your account has been deactivated. Please contact support.',
      );
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

    // Only the newest code is valid — burn any earlier unused ones.
    await this.db.query(
      `UPDATE otps SET is_used = true WHERE phone = $1 AND is_used = false`,
      [phone],
    );
    const code = this.security.generateOtp();
    await this.db.query(
      `INSERT INTO otps (id, phone, code, is_used, attempts, created_at, expires_at)
       VALUES ($1, $2, $3, false, 0, NOW(), NOW() + interval '10 minutes')`,
      [randomUUID(), phone, code],
    );

    const smsSent = await this.sms.sendOtpSms(phone, code);

    // Where may the code be emailed?
    //  - An account that already exists: ONLY to the email on file. A
    //    caller-supplied address must never receive someone else's login code.
    //  - A brand-new sign-up: to the address the person is registering with.
    const isRegistered = !!existing && existing.full_name !== 'QuickGift User';
    let emailTarget: string | null = null;
    if (isRegistered) {
      emailTarget = existing!.email || null;
    } else if (email && EMAIL_RE.test(email.trim())) {
      emailTarget = email.trim().toLowerCase();
    }
    let emailSent = false;
    if (emailTarget) emailSent = await this.mail.sendOtp(emailTarget, code);

    if (!smsSent && !emailSent && !isDebug()) {
      // Never hand the code back to the caller: that would let anyone sign in
      // as any phone number. Fail instead and say what to do.
      throw new HttpException(
        isRegistered
          ? 'We could not send your verification code. Please contact support so we can add an email address to your account.'
          : 'We could not send a code to this number. Please add your email address so we can send it there.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const response: Record<string, any> = { message: 'OTP sent successfully' };
    if (emailSent) response.sent_to = 'email';
    else if (smsSent) response.sent_to = 'sms';
    // DEBUG is for local development / a closed beta only: it returns the code
    // to the caller, which means anyone can sign in as any customer.
    if (isDebug()) response.otp_dev = code;
    return response;
  }

  async verifyOtp(phone: string, code: string) {
    let user = await this.loadUserByPhone(phone);
    this.assertNotStaff(user);
    await this.consumeOtp(phone, code);

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
    const { phone, otp, password, city, role } = req || {};
    const full_name = String(req?.full_name ?? '').trim();
    const email = req?.email ? String(req.email).trim().toLowerCase() : null;
    if (!this.security.validateNigerianPhone(phone)) {
      throw new BadRequestException(INVALID_PHONE);
    }
    if (!full_name) throw new BadRequestException('Your name is required');
    if (email && !EMAIL_RE.test(email)) {
      throw new BadRequestException('Please enter a valid email address');
    }
    if (password && String(password).length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    // Check everything that can fail BEFORE spending the one-time code.
    const existing = await this.loadUserByPhone(phone);
    this.assertNotStaff(existing);
    if (existing && existing.full_name !== 'QuickGift User') {
      throw new BadRequestException(
        'This phone number is already registered. Please log in instead.',
      );
    }
    if (email) {
      const emailExists = await this.db.queryOne(
        `SELECT 1 FROM users WHERE email = $1 AND ($2::text IS NULL OR id <> $2)`,
        [email, existing?.id ?? null],
      );
      if (emailExists) throw new BadRequestException('Email already registered');
    }

    await this.consumeOtp(phone, otp);

    const allowed = ['user', 'provider'];
    const newRole = allowed.includes(role) ? role : 'user';
    const pwHash = password ? this.security.hashPassword(password) : null;

    let user: UserRow;

    if (existing) {
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

    // Welcome email, best-effort, only when the user signed up with an email.
    if (user.email) {
      void this.mail.sendWelcome(user.email, user.full_name);
    }

    return {
      access_token: this.token(user),
      token_type: 'bearer',
      user: this.userPayload(user, { profile_complete: profileComplete }),
    };
  }

  async login(req: any) {
    const identifier = String(req?.phone || req?.email || '').trim();
    if (!identifier) {
      throw new BadRequestException('Phone or email is required');
    }
    const limiterKey = identifier.toLowerCase();
    if (loginFailures.isBlocked(limiterKey)) {
      throw new HttpException(
        'Too many failed sign-in attempts. Please wait 15 minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const user = await this.db.queryOne<UserRow>(
      `SELECT id, full_name, email, phone, city, role, wallet_balance, is_active, password_hash
       FROM users WHERE phone = $1 OR lower(email) = lower($1)`,
      [identifier],
    );
    if (
      !user ||
      !user.password_hash ||
      !this.security.verifyPassword(String(req?.password ?? ''), user.password_hash)
    ) {
      loginFailures.record(limiterKey);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.is_active) {
      throw new ForbiddenException('Account deactivated');
    }
    loginFailures.reset(limiterKey);
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
    const user = await this.db.queryOne<{ role: string }>(
      `SELECT id, full_name, email, phone, city, lat, lng, avatar_url, role, wallet_balance
       FROM users WHERE id = $1`,
      [userId],
    );
    if (!user) throw new NotFoundException('User not found');
    const isStaff = isAdminRole(user.role);
    return {
      ...user,
      is_staff: isStaff,
      role_label: isStaff ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] : null,
      permissions: permissionsForRole(user.role),
    };
  }

  async updateMe(userId: string, data: any) {
    const exists = await this.db.queryOne(`SELECT 1 FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!exists) throw new NotFoundException('User not found');

    if (data?.email !== undefined && data.email !== null && data.email !== '') {
      const email = String(data.email).trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        throw new BadRequestException('Please enter a valid email address');
      }
      const taken = await this.db.queryOne(
        `SELECT 1 FROM users WHERE email = $1 AND id <> $2`,
        [email, userId],
      );
      if (taken) throw new BadRequestException('That email is already in use');
      data.email = email;
    }
    if (data?.full_name !== undefined && !String(data.full_name).trim()) {
      throw new BadRequestException('Name cannot be empty');
    }

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

  /**
   * Deletes the caller's own account. Personal data is erased and the account
   * can no longer sign in; order/payment rows are kept (anonymised) because
   * they are the financial record. Anything still in flight must be finished
   * first so no money or delivery is stranded.
   */
  async deleteMe(userId: string) {
    const user = await this.db.queryOne<any>(
      `SELECT id, role, wallet_balance FROM users WHERE id = $1`,
      [userId],
    );
    if (!user) throw new NotFoundException('User not found');
    if (isAdminRole(user.role)) {
      throw new ForbiddenException('Staff accounts are removed by an administrator.');
    }
    if (Number(user.wallet_balance) > 0) {
      throw new BadRequestException(
        'You still have money in your wallet. Please withdraw it before deleting your account.',
      );
    }
    const provider = await this.db.queryOne<any>(
      `SELECT id FROM providers WHERE user_id = $1`,
      [userId],
    );
    const busy = await this.db.queryOne(
      `SELECT 1 FROM orders WHERE user_id = $1 AND status IN ('pending','confirmed','in_transit') AND payment_status = 'paid'
       UNION ALL
       SELECT 1 FROM bookings WHERE (user_id = $1 OR provider_id = $2)
         AND status IN ('accepted','confirmed','in_progress') AND payment_status = 'paid'
       UNION ALL
       SELECT 1 FROM payouts WHERE user_id = $1 AND status IN ('pending','held')
       UNION ALL
       SELECT 1 FROM transactions WHERE user_id = $1 AND status = 'pending'
       LIMIT 1`,
      [userId, provider?.id ?? ''],
    );
    if (busy) {
      throw new BadRequestException(
        'You have orders, bookings or payments still in progress. Please wait for them to finish, then try again.',
      );
    }

    await this.db.transaction(async (client) => {
      // A unique, non-routable placeholder (phone is NOT NULL + unique).
      const tombstone = 'x' + userId.replace(/-/g, '').slice(0, 19);
      await client.query(
        `UPDATE users SET full_name = 'Deleted user', email = NULL, phone = $2,
                password_hash = NULL, push_token = NULL, avatar_url = NULL,
                address = NULL, city = NULL, lat = NULL, lng = NULL,
                is_active = false, updated_at = NOW()
         WHERE id = $1`,
        [userId, tombstone],
      );
      await client.query(`DELETE FROM bank_accounts WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM otps WHERE phone = $1`, [tombstone]);
      if (provider) {
        await client.query(
          `UPDATE providers SET status = 'suspended', status_reason = 'Account deleted',
                  is_available = false, updated_at = NOW() WHERE id = $1`,
          [provider.id],
        );
        await client.query(`UPDATE services SET is_active = false WHERE provider_id = $1`, [provider.id]);
        await client.query(
          `UPDATE products SET status = 'inactive', updated_at = NOW() WHERE vendor_id = $1`,
          [provider.id],
        );
      }
    });
    return { status: 'deleted' };
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
