import { Global, Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SmsService } from './sms.service';
import { NotifyService } from './notify.service';
import { MailService } from './mail.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';

/** Shared, app-wide providers (security, SMS, email, notifications, guards). */
@Global()
@Module({
  providers: [SecurityService, SmsService, NotifyService, MailService, AuthGuard, AdminGuard],
  exports: [SecurityService, SmsService, NotifyService, MailService, AuthGuard, AdminGuard],
})
export class CommonModule {}
