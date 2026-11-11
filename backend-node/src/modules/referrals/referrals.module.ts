import { Module } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';

// ReferralService itself lives in the global CommonModule, because sign-up,
// orders and bookings all call into it.
@Module({
  controllers: [ReferralsController],
})
export class ReferralsModule {}
