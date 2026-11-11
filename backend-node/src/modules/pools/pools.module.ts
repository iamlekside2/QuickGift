import { Module } from '@nestjs/common';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [OrdersModule, PaymentsModule],
  controllers: [PoolsController],
  providers: [PoolsService],
})
export class PoolsModule {}
