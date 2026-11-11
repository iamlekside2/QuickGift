import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  // WalletService uses it to record and settle wallet top-ups.
  exports: [PaymentsService],
})
export class PaymentsModule {}
