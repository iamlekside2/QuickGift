import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('orders')
  orders(@Query() q: Record<string, string>) {
    return this.admin.listOrders(q);
  }

  @Get('users')
  users(@Query() q: Record<string, string>) {
    return this.admin.listUsers(q);
  }

  @Get('providers')
  providers(@Query() q: Record<string, string>) {
    return this.admin.listProviders(q);
  }

  @Get('bookings')
  bookings(@Query() q: Record<string, string>) {
    return this.admin.listBookings(q);
  }

  @Get('payments')
  payments(@Query() q: Record<string, string>) {
    return this.admin.listPayments(q);
  }

  @Get('transactions')
  transactions(@Query() q: Record<string, string>) {
    return this.admin.listTransactions(q);
  }

  // payouts/stats declared before payouts/:id routes
  @Get('payouts/stats')
  payoutStats() {
    return this.admin.payoutStats();
  }

  @Get('payouts')
  payouts(@Query() q: Record<string, string>) {
    return this.admin.listPayouts(q);
  }

  @Patch('payouts/:id/release')
  releasePayout(@Param('id') id: string) {
    return this.admin.releasePayout(id);
  }

  @Patch('payouts/:id/cancel')
  cancelPayout(@Param('id') id: string) {
    return this.admin.cancelPayout(id);
  }

  @Get('deliveries')
  deliveries(@Query() q: Record<string, string>) {
    return this.admin.listDeliveries(q);
  }

  @Get('settings')
  settings() {
    return this.admin.settings();
  }

  @Get('analytics/revenue')
  revenue() {
    return this.admin.revenueAnalytics();
  }

  @Get('analytics/extended')
  extended() {
    return this.admin.extendedAnalytics();
  }

  @Get('withdrawals')
  withdrawals(@Query() q: Record<string, string>) {
    return this.admin.listWithdrawals(q);
  }

  @Patch('withdrawals/:id/complete')
  completeWithdrawal(@Param('id') id: string) {
    return this.admin.completeWithdrawal(id);
  }

  @Patch('withdrawals/:id/fail')
  failWithdrawal(@Param('id') id: string) {
    return this.admin.failWithdrawal(id);
  }
}
