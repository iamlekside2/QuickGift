import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { PermGuard } from '../../common/perm.guard';
import { Perm } from '../../common/perm.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

const num = (v?: string) =>
  v === undefined || v === '' ? undefined : Number(v);

// IMPORTANT: '/me*' routes are declared before '/:id*' so they match first.
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  list(@Query() q: Record<string, string>) {
    return this.providers.listProviders({
      city: q.city,
      service_type: q.service_type,
      available:
        q.available === undefined ? undefined : q.available === 'true',
      search: q.search,
      min_rating: num(q.min_rating),
      sort: q.sort ?? 'rating',
      page: num(q.page) ?? 1,
      per_page: num(q.per_page) ?? 20,
      lat: num(q.lat),
      lng: num(q.lng),
      radius_km: num(q.radius_km) ?? 15,
    });
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getMy(@CurrentUser() user: AuthUser) {
    return this.providers.getMy(user.user_id);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  updateMy(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.providers.updateMy(user.user_id, body);
  }

  @UseGuards(AuthGuard)
  @Post('me/services')
  @HttpCode(200)
  addMyService(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.providers.addMyService(user.user_id, body);
  }

  @UseGuards(AuthGuard)
  @Get('me/availability')
  getMyAvailability(@CurrentUser() user: AuthUser) {
    return this.providers.getMyAvailability(user.user_id);
  }

  @UseGuards(AuthGuard)
  @Put('me/availability')
  updateMyAvailability(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.providers.updateMyAvailability(user.user_id, body);
  }

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(200)
  register(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.providers.register(user.user_id, body);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.providers.getProvider(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  updateOwned(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: any,
  ) {
    return this.providers.updateOwned(id, user.user_id, body);
  }

  @Get(':id/services')
  listServices(@Param('id') id: string) {
    return this.providers.listServices(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/services')
  @HttpCode(200)
  addService(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: any,
  ) {
    return this.providers.addService(id, user.user_id, body);
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('providers.manage')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.providers.approve(id, user);
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('providers.manage')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: AuthUser) {
    return this.providers.reject(id, body?.reason ?? '', user);
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('providers.manage')
  @Patch(':id/suspend')
  suspend(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: AuthUser) {
    return this.providers.suspend(id, body?.reason ?? '', user);
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('providers.manage')
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.providers.reactivate(id, user);
  }
}
