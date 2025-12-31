import { Module, forwardRef } from '@nestjs/common';

import { TeamMembersModule } from '../team-members/team-members.module';
import { UsersModule } from '../users/users.module';

import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkService } from './clerk.service';
import { OptionalClerkAuthGuard } from './optional-clerk-auth.guard';
import { TeamAccessGuard } from './team-access.guard';

@Module({
  imports: [forwardRef(() => TeamMembersModule), forwardRef(() => UsersModule)],
  providers: [
    ClerkService,
    ClerkAuthGuard,
    OptionalClerkAuthGuard,
    TeamAccessGuard,
  ],
  exports: [
    ClerkService,
    ClerkAuthGuard,
    OptionalClerkAuthGuard,
    TeamAccessGuard,
  ],
})
export class AuthModule {}
