import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERM_KEY } from './perm.decorator';
import { roleHasPermission } from './permissions';

/**
 * Must run AFTER AuthGuard (sets req.user) and AdminGuard (ensures the user is
 * admin-area staff). If the route carries a @Perm('x'), the user's role must
 * grant 'x'. Owner/admin hold the '*' wildcard so they pass everything. Routes
 * without @Perm are allowed for any staff member who got past AdminGuard.
 */
@Injectable()
export class PermGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string | undefined>(
      PERM_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    if (!roleHasPermission(req.user?.role, required)) {
      throw new ForbiddenException(
        'You do not have permission to do that. Ask an administrator for access.',
      );
    }
    return true;
  }
}
