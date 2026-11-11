import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { RateLimiter, clientIp } from '../../common/rate-limit';

// Per-address damping on the unauthenticated endpoints (on top of the
// per-phone OTP limits and per-account login lockout in AuthService).
// Generous on purpose: Nigerian mobile carriers put many customers behind one
// shared address, so this only stops outright hammering.
const authIpLimiter = new RateLimiter(300, 15 * 60 * 1000);

function throttle(req: any) {
  if (!authIpLimiter.allow(clientIp(req))) {
    throw new HttpException(
      'Too many requests. Please wait a few minutes and try again.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

// FastAPI returns 200 on these POSTs; NestJS defaults to 201, so pin 200.
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('check-phone')
  @HttpCode(200)
  checkPhone(@Body() body: { phone: string }, @Req() req: any) {
    throttle(req);
    return this.auth.checkPhone(body?.phone);
  }

  @Post('send-otp')
  @HttpCode(200)
  sendOtp(@Body() body: { phone: string; email?: string }, @Req() req: any) {
    throttle(req);
    return this.auth.sendOtp(body?.phone, body?.email);
  }

  @Post('verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() body: { phone: string; code: string }, @Req() req: any) {
    throttle(req);
    return this.auth.verifyOtp(body?.phone, body?.code);
  }

  @Post('register')
  @HttpCode(200)
  register(@Body() body: any, @Req() req: any) {
    throttle(req);
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: any, @Req() req: any) {
    throttle(req);
    return this.auth.login(body);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.auth.getMe(user.user_id);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.auth.updateMe(user.user_id, body);
  }

  // Set a password (code-only accounts) or change the existing one.
  @UseGuards(AuthGuard)
  @Post('password')
  @HttpCode(200)
  setPassword(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.auth.setPassword(user.user_id, body);
  }

  // Delete my account (Play Store / App Store require this to work in-app).
  @UseGuards(AuthGuard)
  @Delete('me')
  @HttpCode(200)
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.auth.deleteMe(user.user_id);
  }

  @UseGuards(AuthGuard)
  @Post('push-token')
  @HttpCode(200)
  pushToken(@CurrentUser() user: AuthUser, @Body() body: { token: string }) {
    return this.auth.registerPushToken(user.user_id, body?.token);
  }
}
