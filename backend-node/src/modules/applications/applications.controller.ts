import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApplicationsService } from './applications.service';

/**
 * Public, unauthenticated endpoints hit by the landing page (quickgift.ng).
 * CORS is open (see main.ts), so the static site can POST here directly.
 */
@Controller()
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post('provider-applications')
  @HttpCode(201)
  applyProvider(@Body() body: any) {
    return this.applications.createProviderApplication(body);
  }

  @Post('waitlist')
  @HttpCode(201)
  joinWaitlist(@Body() body: any) {
    return this.applications.joinWaitlist(body);
  }
}
