import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';

/**
 * Admin-only views over the landing-page captures. Shares the `admin` prefix
 * with AdminController (different sub-paths, no route collision).
 */
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class ApplicationsAdminController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get('provider-applications')
  listApplications(@Query() q: Record<string, string>) {
    return this.applications.listApplications(q);
  }

  @Patch('provider-applications/:id')
  updateApplication(@Param('id') id: string, @Body() body: any) {
    return this.applications.updateApplicationStatus(id, body?.status);
  }

  @Get('waitlist')
  listWaitlist(@Query() q: Record<string, string>) {
    return this.applications.listWaitlist(q);
  }
}
