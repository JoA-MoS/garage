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
    // Re-export UsersModule so modules importing AuthModule have access to
    // UsersService (needed by ClerkAuthGuard for internal user lookup)
    UsersModule,
  ],
})
export class AuthModule {}
