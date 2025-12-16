import { Module, forwardRef } from '@nestjs/common';

import { TeamMembersModule } from '../team-members/team-members.module';

import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkService } from './clerk.service';
import { TeamAccessGuard } from './team-access.guard';

@Module({
  imports: [forwardRef(() => TeamMembersModule)],
  providers: [ClerkService, ClerkAuthGuard, TeamAccessGuard],
  exports: [ClerkService, ClerkAuthGuard, TeamAccessGuard],
})
export class AuthModule {}
