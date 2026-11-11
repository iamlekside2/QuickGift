import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { PermGuard } from '../../common/perm.guard';
import { Perm } from '../../common/perm.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { PromoService } from '../../common/promo.service';
import { RateLimiter } from '../../common/rate-limit';

// Stops a signed-in customer guessing codes: 20 checks per 10 minutes each.
const validateLimiter = new RateLimiter(20, 10 * 60 * 1000);

@UseGuards(AuthGuard)
@Controller('promos')
export class PromosController {
  constructor(private readonly promos: PromoService) {}

  /** What would this code take off my cart? Does not spend the code. */
  @Post('validate')
  @HttpCode(200)
  validate(@CurrentUser() user: AuthUser, @Body() body: { code?: string; subtotal?: number }) {
    if (!validateLimiter.allow(user.user_id)) {
      throw new HttpException(
        'Too many attempts. Please wait a few minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return this.promos.preview(user.user_id, body?.code, body?.subtotal);
  }

  // ---- staff ----

  @Get('admin')
  @UseGuards(AdminGuard, PermGuard)
  @Perm('settings.manage')
  adminList(@Query() q: Record<string, string>) {
    return this.promos.adminList(q);
  }

  @Post('admin')
  @HttpCode(200)
  @UseGuards(AdminGuard, PermGuard)
  @Perm('settings.manage')
  adminCreate(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.promos.adminCreate(body, user);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard, PermGuard)
  @Perm('settings.manage')
  adminUpdate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.promos.adminUpdate(id, body, user);
  }
}
