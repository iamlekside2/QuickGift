import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  user_id: string;
  role: string;
}

/** @CurrentUser() → { user_id, role } set by AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
