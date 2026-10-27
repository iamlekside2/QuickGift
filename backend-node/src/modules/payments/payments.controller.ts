import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(AuthGuard)
  @Post('initialize')
  @HttpCode(200)
  initialize(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.payments.initialize(user.user_id, body);
  }

  @UseGuards(AuthGuard)
  @Post('verify/:reference')
  @HttpCode(200)
  verify(@Param('reference') reference: string, @CurrentUser() user: AuthUser) {
    return this.payments.verify(reference, user);
  }

  // Public — authenticated by the Paystack HMAC signature, not a JWT.
  @Post('webhook/paystack')
  @HttpCode(200)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(body ?? {}));
    return this.payments.webhook(raw, signature ?? '', body);
  }
}
