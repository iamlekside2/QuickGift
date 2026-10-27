import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SecurityService } from './security.service';

/** Requires a valid Bearer token; attaches { user_id, role } to the request. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly security: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Not authenticated');
    }
    req.user = this.security.decodeToken(token); // { user_id, role }
    return true;
  }
}
