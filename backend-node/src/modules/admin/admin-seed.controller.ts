import { Controller, HttpCode, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

// Separate controller: /admin/seed is gated by the SECRET_KEY query param, not a JWT.
@Controller('admin')
export class AdminSeedController {
  constructor(private readonly admin: AdminService) {}

  @Post('seed')
  @HttpCode(200)
  seed(@Query('secret') secret: string) {
    return this.admin.seed(secret ?? '');
  }
}
