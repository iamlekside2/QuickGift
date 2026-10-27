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
import { BookingsService } from './bookings.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@UseGuards(AuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.bookings.createBooking(user, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: Record<string, string>) {
    return this.bookings.listBookings(user, q);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookings.getBooking(id, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { status: string },
  ) {
    return this.bookings.updateStatus(id, user, body?.status);
  }
}
