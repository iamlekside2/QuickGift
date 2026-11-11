import { Module } from '@nestjs/common';
import { PromosController } from './promos.controller';

// PromoService lives in the global CommonModule: order creation calls it too.
@Module({
  controllers: [PromosController],
})
export class PromosModule {}
