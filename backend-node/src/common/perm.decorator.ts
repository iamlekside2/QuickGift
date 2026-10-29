import { SetMetadata } from '@nestjs/common';

export const PERM_KEY = 'required_permission';

/**
 * Marks a route with the permission a staff member must hold to call it.
 * Read by PermGuard. Routes with no @Perm are open to any admin-area staff
 * (they still pass AuthGuard + AdminGuard).
 */
export const Perm = (permission: string) => SetMetadata(PERM_KEY, permission);
