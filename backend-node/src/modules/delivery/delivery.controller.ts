import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@UseGuards(AuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Post('quote')
  @HttpCode(200)
  quote(@Body() body: any) {
    return this.delivery.quote(body);
  }

  @Post('create')
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.delivery.create(user, body);
  }

  @Get('track/:orderId')
  track(@Param('orderId') orderId: string, @CurrentUser() user: AuthUser) {
    return this.delivery.track(orderId, user);
  }

  @Post('cancel/:orderId')
  @HttpCode(200)
  cancel(@Param('orderId') orderId: string, @CurrentUser() user: AuthUser) {
    return this.delivery.cancel(orderId, user);
  }
}
