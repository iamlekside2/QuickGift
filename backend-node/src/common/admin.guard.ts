import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isAdminRole } from './permissions';

/**
 * Must run AFTER AuthGuard (which sets req.user). Requires the user to be an
 * admin-area staff member (owner/admin or any limited role). Fine-grained
 * access within the console is enforced per-route by PermGuard + @Perm.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!isAdminRole(req.user?.role)) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
