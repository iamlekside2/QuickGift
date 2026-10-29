import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { PermGuard } from '../../common/perm.guard';
import { Perm } from '../../common/perm.decorator';

/**
 * Admin-only views over the landing-page captures. Shares the `admin` prefix
 * with AdminController (different sub-paths, no route collision).
 */
@UseGuards(AuthGuard, AdminGuard, PermGuard)
@Controller('admin')
export class ApplicationsAdminController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get('provider-applications')
  @Perm('applications.view')
  listApplications(@Query() q: Record<string, string>) {
    return this.applications.listApplications(q);
  }

  @Patch('provider-applications/:id')
  @Perm('applications.manage')
  updateApplication(@Param('id') id: string, @Body() body: any) {
    return this.applications.updateApplicationStatus(id, body?.status);
  }

  @Delete('provider-applications/:id')
  @Perm('applications.manage')
  deleteApplication(@Param('id') id: string) {
    return this.applications.deleteApplication(id);
  }

  @Get('waitlist')
  @Perm('applications.view')
  listWaitlist(@Query() q: Record<string, string>) {
    return this.applications.listWaitlist(q);
  }

  @Delete('waitlist/:id')
  @Perm('applications.manage')
  deleteWaitlist(@Param('id') id: string) {
    return this.applications.deleteWaitlist(id);
  }
}
