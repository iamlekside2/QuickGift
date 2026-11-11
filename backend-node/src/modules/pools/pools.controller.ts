import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PoolsService } from './pools.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { PermGuard } from '../../common/perm.guard';
import { Perm } from '../../common/perm.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { RateLimiter, clientIp } from '../../common/rate-limit';

// The contribution page is public (friends have no account).
const viewLimiter = new RateLimiter(120, 15 * 60 * 1000);
const payLimiter = new RateLimiter(20, 15 * 60 * 1000);

function limit(limiter: RateLimiter, req: any) {
  if (!limiter.allow(clientIp(req))) {
    throw new HttpException(
      'Too many attempts. Please wait a few minutes and try again.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

// Fixed paths are declared before ':id' so they are matched first.
@Controller('pools')
export class PoolsController {
  constructor(private readonly pools: PoolsService) {}

  // ---- organiser ----

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.pools.create(user.user_id, body);
  }

  @UseGuards(AuthGuard)
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.pools.mine(user.user_id);
  }

  // ---- public contribution page ----

  @Get('public/:code')
  publicView(@Param('code') code: string, @Req() req: any) {
    limit(viewLimiter, req);
    return this.pools.publicView(code);
  }

  @Post('public/:code/contribute')
  @HttpCode(200)
  contribute(@Param('code') code: string, @Body() body: any, @Req() req: any) {
    limit(payLimiter, req);
    return this.pools.contribute(code, body);
  }

  @Post('public/:code/verify')
  @HttpCode(200)
  verify(@Param('code') code: string, @Body() body: { reference?: string }, @Req() req: any) {
    limit(viewLimiter, req);
    return this.pools.verify(code, String(body?.reference ?? ''));
  }

  // ---- staff ----

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('finance.view')
  @Get('admin')
  adminList(@Query() q: Record<string, string>) {
    return this.pools.adminList(q);
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('settings.manage')
  @Post('admin/sweep')
  @HttpCode(200)
  sweep() {
    return this.pools.sweep();
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('finance.manage')
  @Post('admin/contributions/:id/retry-refund')
  @HttpCode(200)
  retryRefund(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.pools.adminRetryRefund(id, user);
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('finance.view')
  @Get('admin/:id')
  adminDetail(@Param('id') id: string) {
    return this.pools.adminDetail(id);
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('finance.manage')
  @Post('admin/:id/cancel')
  @HttpCode(200)
  adminCancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.pools.adminCancel(id, user);
  }

  // ---- organiser, by id ----

  @UseGuards(AuthGuard)
  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.pools.detail(id, user.user_id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.pools.cancelByOrganiser(id, user.user_id);
  }
}
