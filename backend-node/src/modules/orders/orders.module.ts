import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { GiftClaimController } from './gift-claim.controller';
import { GiftClaimService } from './gift-claim.service';

@Module({
  controllers: [OrdersController, GiftClaimController],
  providers: [OrdersService, GiftClaimService],
})
export class OrdersModule {}
