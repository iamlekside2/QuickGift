import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { PermGuard } from '../../common/perm.guard';
import { Perm } from '../../common/perm.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

// All order routes require auth. 'my-vendor-orders' is declared before ':id'.
@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.orders.createOrder(user.user_id, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: Record<string, string>) {
    return this.orders.listOrders(user.user_id, q);
  }

  @Get('my-vendor-orders')
  vendorOrders(
    @CurrentUser() user: AuthUser,
    @Query() q: Record<string, string>,
  ) {
    return this.orders.listVendorOrders(user.user_id, q);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.cancelOrder(id, user);
  }

  @Patch(':id/provider-status')
  providerStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { status: string },
  ) {
    return this.orders.providerUpdateStatus(id, user.user_id, body?.status);
  }

  @UseGuards(AdminGuard, PermGuard)
  @Perm('orders.manage')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.orders.updateStatus(id, body?.status);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.getOrder(id, user);
  }
}
