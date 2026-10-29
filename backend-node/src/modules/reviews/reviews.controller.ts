import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { PermGuard } from '../../common/perm.guard';
import { Perm } from '../../common/perm.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.reviews.create(user.user_id, body);
  }

  @Get(':targetType/:targetId')
  list(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query() q: Record<string, string>,
  ) {
    return this.reviews.list(targetType, targetId, q);
  }

  @UseGuards(AuthGuard, AdminGuard, PermGuard)
  @Perm('providers.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviews.remove(id);
  }
}
