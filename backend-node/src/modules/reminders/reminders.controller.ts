import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { PermGuard } from '../../common/perm.guard';
import { Perm } from '../../common/perm.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@UseGuards(AuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.reminders.list(user.user_id);
  }

  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.reminders.create(user.user_id, body);
  }

  /** Staff: send every due nudge now, ignoring the quiet hours. */
  @Post('admin/sweep')
  @HttpCode(200)
  @UseGuards(AdminGuard, PermGuard)
  @Perm('settings.manage')
  sweepNow() {
    return this.reminders.sweep(true);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.reminders.update(id, user.user_id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reminders.remove(id, user.user_id);
  }
}
