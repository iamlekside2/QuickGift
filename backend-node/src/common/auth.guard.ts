import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { DatabaseService } from '../database/database.service';

/**
 * Requires a valid Bearer token; attaches { user_id, role } to the request.
 *
 * The role and active flag are re-read from the database on every request
 * rather than trusted from the (7-day) token, so deactivating, demoting or
 * removing an account takes effect immediately instead of when the token
 * expires.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly security: SecurityService,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Not authenticated');
    }
    const claims = this.security.decodeToken(token);
    const user = await this.db.queryOne<{ role: string; is_active: boolean }>(
      `SELECT role, is_active FROM users WHERE id = $1`,
      [claims.user_id],
    );
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Your session is no longer valid. Please sign in again.');
    }
    req.user = { user_id: claims.user_id, role: user.role };
    return true;
  }
}
