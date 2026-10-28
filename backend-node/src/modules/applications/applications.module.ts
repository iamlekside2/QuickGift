import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsAdminController } from './applications-admin.controller';
import { ApplicationsService } from './applications.service';
import { MailService } from '../../common/mail.service';

@Module({
  controllers: [ApplicationsController, ApplicationsAdminController],
  providers: [ApplicationsService, MailService],
})
export class ApplicationsModule {}
