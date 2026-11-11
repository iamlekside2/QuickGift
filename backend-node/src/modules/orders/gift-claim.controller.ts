import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GiftClaimService } from './gift-claim.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { RateLimiter, clientIp } from '../../common/rate-limit';

// The claim page is public (the recipient has no account). The token is long
// and random, but damp guessing and form spam per address anyway.
const viewLimiter = new RateLimiter(60, 15 * 60 * 1000);
const confirmLimiter = new RateLimiter(15, 15 * 60 * 1000);

function limit(limiter: RateLimiter, req: any) {
  if (!limiter.allow(clientIp(req))) {
    throw new HttpException(
      'Too many attempts. Please wait a few minutes and try again.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

@Controller()
export class GiftClaimController {
  constructor(private readonly claims: GiftClaimService) {}

  @Get('gifts/claim/:token')
  view(@Param('token') token: string, @Req() req: any) {
    limit(viewLimiter, req);
    return this.claims.view(token);
  }

  @Post('gifts/claim/:token')
  @HttpCode(200)
  confirm(@Param('token') token: string, @Body() body: any, @Req() req: any) {
    limit(confirmLimiter, req);
    return this.claims.confirm(token, body);
  }

  /** The buyer enters the address themselves instead of sharing the link. */
  @UseGuards(AuthGuard)
  @Post('orders/:id/address')
  @HttpCode(200)
  setAddress(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.claims.setByBuyer(id, user.user_id, body);
  }
}
