import { Module } from '@nestjs/common';

import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkService } from './clerk.service';

@Module({
  providers: [ClerkService, ClerkAuthGuard],
  exports: [ClerkService, ClerkAuthGuard],
})
export class AuthModule {}
