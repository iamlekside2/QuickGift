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
import { DisputesService } from './disputes.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(200)
  raise(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.disputes.raise(user.user_id, body);
  }

  @UseGuards(AuthGuard)
  @Get()
  listMy(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.disputes.listMy(user.user_id, status);
  }

  // admin routes declared before ':id/respond' param route (distinct, but kept tidy)
  @UseGuards(AuthGuard, AdminGuard)
  @Get('admin/all')
  adminList(@Query() q: Record<string, string>) {
    return this.disputes.adminList(q);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get('admin/:id')
  adminGet(@Param('id') id: string) {
    return this.disputes.adminGet(id);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch('admin/:id/resolve')
  adminResolve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.disputes.adminResolve(user.user_id, id, body);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/respond')
  respond(@Param('id') id: string, @Body() body: any) {
    return this.disputes.respond(id, body);
  }
}
