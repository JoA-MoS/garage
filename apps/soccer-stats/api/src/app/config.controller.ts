import { Controller, Get, InternalServerErrorException } from '@nestjs/common';

import { getClerkPublishableKey } from './environment';

/**
 * Public configuration endpoint that serves runtime configuration
 * to the client application. This endpoint is unauthenticated as it
 * only serves public information (like the Clerk publishable key).
 */
@Controller('config')
export class ConfigController {
  @Get('public')
  getPublicConfig() {
    const clerkPublishableKey = getClerkPublishableKey();
    
    if (!clerkPublishableKey) {
      throw new InternalServerErrorException(
        'CLERK_PUBLISHABLE_KEY environment variable is not set'
      );
    }

    return {
      clerkPublishableKey,
    };
  }
}
