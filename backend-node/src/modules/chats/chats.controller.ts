import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@UseGuards(AuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: Record<string, string>) {
    return this.chats.listConversations(user.user_id, q);
  }

  @Get(':id/messages')
  messages(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.chats.getMessages(id, user.user_id);
  }

  @Post(':id/messages')
  @HttpCode(200)
  send(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: any,
  ) {
    return this.chats.sendMessage(id, user.user_id, body);
  }

  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.chats.createConversation(user.user_id, body);
  }
}
