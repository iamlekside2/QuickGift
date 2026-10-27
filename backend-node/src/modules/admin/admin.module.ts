import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminSeedController } from './admin-seed.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, AdminSeedController],
  providers: [AdminService],
})
export class AdminModule {}
