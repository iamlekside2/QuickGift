import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { hashSync, compareSync } from 'bcryptjs';

/**
 * Mirrors the FastAPI app/core/security.py: HS256 JWT, bcrypt passwords,
 * 6-digit OTP, Nigerian phone validation.
 */
@Injectable()
export class SecurityService {
  private readonly secret = process.env.SECRET_KEY || 'dev-only-insecure-key';
  private readonly algorithm: jwt.Algorithm = 'HS256';
  private readonly expiresInSeconds = 60 * 60 * 24 * 7; // ACCESS_TOKEN_EXPIRE_MINUTES = 7 days
  private readonly otpLength = 6;

  hashPassword(password: string): string {
    return hashSync(password, 12);
  }

  verifyPassword(plain: string, hashed: string): boolean {
    try {
      return compareSync(plain, hashed);
    } catch {
      return false;
    }
  }

  createAccessToken(data: { sub: string; role: string }): string {
    return jwt.sign({ sub: data.sub, role: data.role }, this.secret, {
      algorithm: this.algorithm,
      expiresIn: this.expiresInSeconds,
    });
  }

  /** Returns { user_id, role } or throws 401 — matches get_current_user. */
  decodeToken(token: string): { user_id: string; role: string } {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
      }) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const userId = payload.sub as string | undefined;
    if (!userId) throw new UnauthorizedException('Invalid token');
    return { user_id: userId, role: (payload.role as string) || 'user' };
  }

  generateOtp(): string {
    let code = '';
    for (let i = 0; i < this.otpLength; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  validateNigerianPhone(phone: string): boolean {
    const cleaned = (phone || '').replace(/ /g, '').replace(/-/g, '');
    return /^(\+234|234|0)[789][01]\d{8}$/.test(cleaned);
  }
}
