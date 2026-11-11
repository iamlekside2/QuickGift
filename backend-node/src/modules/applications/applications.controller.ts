import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { RateLimiter, clientIp } from '../../common/rate-limit';

// These endpoints are public and each submission emails the admin inbox, so
// cap how fast one address can hit them. The cap is loose because mobile
// carriers share one address between many people.
const formLimiter = new RateLimiter(60, 60 * 60 * 1000);

function throttle(req: any) {
  if (!formLimiter.allow(clientIp(req))) {
    throw new HttpException(
      'Too many submissions. Please try again later.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Public, unauthenticated endpoints hit by the landing page (quickgift.ng).
 * CORS is open (see main.ts), so the static site can POST here directly.
 */
@Controller()
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post('provider-applications')
  @HttpCode(201)
  applyProvider(@Body() body: any, @Req() req: any) {
    throttle(req);
    return this.applications.createProviderApplication(body);
  }

  @Post('waitlist')
  @HttpCode(201)
  joinWaitlist(@Body() body: any, @Req() req: any) {
    throttle(req);
    return this.applications.joinWaitlist(body);
  }
}
