import { Module } from '@nestjs/common';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [OrdersModule, PaymentsModule],
  controllers: [PoolsController],
  providers: [PoolsService],
  // DisputesService sends a dispute refund on a group gift back to its contributors.
  exports: [PoolsService],
})
export class PoolsModule {}
