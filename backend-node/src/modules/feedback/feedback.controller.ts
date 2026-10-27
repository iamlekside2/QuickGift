import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.feedback.create(user.user_id, body);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get('admin/all')
  adminList(@Query() q: Record<string, string>) {
    return this.feedback.adminList(q);
  }
}
