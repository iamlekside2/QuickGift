import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { ReferralService } from '../../common/referral.service';
import { RateLimiter, clientIp } from '../../common/rate-limit';

// The code check is public (the sign-up form calls it before an account
// exists), so damp guessing: 30 checks per address per 15 minutes.
const checkLimiter = new RateLimiter(30, 15 * 60 * 1000);

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralService) {}

  /** My code, the current reward, and the friends I have referred. */
  @UseGuards(AuthGuard)
  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.referrals.mine(user.user_id);
  }

  /** Is this code usable? Tells the sign-up form before the OTP is sent. */
  @Post('check')
  @HttpCode(200)
  check(@Body() body: { code?: string }, @Req() req: any) {
    if (!checkLimiter.allow(clientIp(req))) {
      throw new HttpException(
        'Too many attempts. Please wait a few minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return this.referrals.check(body?.code);
  }
}
