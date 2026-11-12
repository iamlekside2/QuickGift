import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { PoolsModule } from '../pools/pools.module';

@Module({
  imports: [PoolsModule],
  controllers: [DisputesController],
  providers: [DisputesService],
})
export class DisputesModule {}
