import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

// FastAPI returns 200 on these POSTs; NestJS defaults to 201, so pin 200.
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('check-phone')
  @HttpCode(200)
  checkPhone(@Body() body: { phone: string }) {
    return this.auth.checkPhone(body?.phone);
  }

  @Post('send-otp')
  @HttpCode(200)
  sendOtp(@Body() body: { phone: string }) {
    return this.auth.sendOtp(body?.phone);
  }

  @Post('verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() body: { phone: string; code: string }) {
    return this.auth.verifyOtp(body?.phone, body?.code);
  }

  @Post('register')
  @HttpCode(200)
  register(@Body() body: any) {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: any) {
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

  @UseGuards(AuthGuard)
  @Post('push-token')
  @HttpCode(200)
  pushToken(@CurrentUser() user: AuthUser, @Body() body: { token: string }) {
    return this.auth.registerPushToken(user.user_id, body?.token);
  }
}
