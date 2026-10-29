import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { PermGuard } from '../../common/perm.guard';
import { Perm } from '../../common/perm.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@UseGuards(AuthGuard, AdminGuard, PermGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('orders')
  @Perm('orders.view')
  orders(@Query() q: Record<string, string>) {
    return this.admin.listOrders(q);
  }

  @Get('users')
  @Perm('users.view')
  users(@Query() q: Record<string, string>) {
    return this.admin.listUsers(q);
  }

  // ── Team (workers) ──────────────────────────────────────────────
  // Declared before the generic users routes; all gated by team.manage.
  @Get('team')
  @Perm('team.manage')
  team() {
    return this.admin.listStaff();
  }

  @Get('team/roles')
  @Perm('team.manage')
  teamRoles() {
    return this.admin.staffRoles();
  }

  @Get('team/audit')
  @Perm('team.manage')
  teamAudit(@Query() q: Record<string, string>) {
    return this.admin.listStaffAudit(q);
  }

  @Post('team')
  @Perm('team.manage')
  createStaff(@Body() body: any, @CurrentUser() user: AuthUser) {
    return this.admin.createStaff(body, user);
  }

  @Patch('team/:id')
  @Perm('team.manage')
  updateStaff(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthUser,
  ) {
    return this.admin.updateStaff(id, body, user);
  }

  @Post('team/:id/password')
  @Perm('team.manage')
  resetStaffPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.admin.resetStaffPassword(id, body?.password, user);
  }

  @Delete('team/:id')
  @Perm('team.manage')
  deleteStaff(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.admin.deleteStaff(id, user);
  }

  // Bulk delete must be declared before the ':id' route so it isn't swallowed.
  @Post('users/bulk-delete')
  @Perm('users.manage')
  bulkDeleteUsers(
    @Body() body: { ids: string[] },
    @CurrentUser() user: AuthUser,
  ) {
    return this.admin.bulkDeleteUsers(body?.ids || [], user?.user_id);
  }

  @Patch('users/:id')
  @Perm('users.manage')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateUser(id, body);
  }

  @Delete('users/:id')
  @Perm('users.manage')
  deleteUser(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.admin.deleteUser(id, user?.user_id);
  }

  @Patch('providers/:id')
  @Perm('providers.manage')
  updateProvider(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateProvider(id, body);
  }

  @Post('products/clear')
  @Perm('products.manage')
  clearProducts() {
    return this.admin.clearProducts();
  }

  @Post('products')
  @Perm('products.manage')
  createProduct(@Body() body: any) {
    return this.admin.createProduct(body);
  }

  @Patch('products/:id')
  @Perm('products.manage')
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateProduct(id, body);
  }

  @Delete('products/:id')
  @Perm('products.manage')
  deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(id);
  }

  @Get('providers')
  @Perm('providers.view')
  providers(@Query() q: Record<string, string>) {
    return this.admin.listProviders(q);
  }

  @Get('bookings')
  @Perm('bookings.view')
  bookings(@Query() q: Record<string, string>) {
    return this.admin.listBookings(q);
  }

  @Get('payments')
  @Perm('finance.view')
  payments(@Query() q: Record<string, string>) {
    return this.admin.listPayments(q);
  }

  @Get('transactions')
  @Perm('finance.view')
  transactions(@Query() q: Record<string, string>) {
    return this.admin.listTransactions(q);
  }

  // payouts/stats declared before payouts/:id routes
  @Get('payouts/stats')
  @Perm('finance.view')
  payoutStats() {
    return this.admin.payoutStats();
  }

  @Get('payouts')
  @Perm('finance.view')
  payouts(@Query() q: Record<string, string>) {
    return this.admin.listPayouts(q);
  }

  @Patch('payouts/:id/release')
  @Perm('finance.manage')
  releasePayout(@Param('id') id: string) {
    return this.admin.releasePayout(id);
  }

  @Patch('payouts/:id/cancel')
  @Perm('finance.manage')
  cancelPayout(@Param('id') id: string) {
    return this.admin.cancelPayout(id);
  }

  @Get('deliveries')
  @Perm('orders.view')
  deliveries(@Query() q: Record<string, string>) {
    return this.admin.listDeliveries(q);
  }

  @Get('settings')
  settings() {
    return this.admin.settings();
  }

  @Get('analytics/revenue')
  @Perm('finance.view')
  revenue() {
    return this.admin.revenueAnalytics();
  }

  @Get('analytics/extended')
  extended() {
    return this.admin.extendedAnalytics();
  }

  @Get('withdrawals')
  @Perm('finance.view')
  withdrawals(@Query() q: Record<string, string>) {
    return this.admin.listWithdrawals(q);
  }

  @Patch('withdrawals/:id/complete')
  @Perm('finance.manage')
  completeWithdrawal(@Param('id') id: string) {
    return this.admin.completeWithdrawal(id);
  }

  @Patch('withdrawals/:id/fail')
  @Perm('finance.manage')
  failWithdrawal(@Param('id') id: string) {
    return this.admin.failWithdrawal(id);
  }
}
