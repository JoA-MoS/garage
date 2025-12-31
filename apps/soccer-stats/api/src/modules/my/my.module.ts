import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TeamMembersModule } from '../team-members/team-members.module';
import { GamesModule } from '../games/games.module';

import { MyResolver } from './my.resolver';

/**
 * Module for the `my` query - implements the Viewer pattern.
 *
 * This module provides user-scoped data access through a single
 * GraphQL entry point, following patterns established by GitHub,
 * Shopify, and Facebook.
 *
 * Domain queries are delegated to their respective services:
 * - User queries → UsersService (via UsersModule)
 * - Team queries → TeamMembersService (via TeamMembersModule)
 * - Game queries → GamesService (via GamesModule)
 *
 * @see FEATURE_ROADMAP.md Issue #183
 */
@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => TeamMembersModule),
    forwardRef(() => GamesModule),
  ],
  providers: [MyResolver],
})
export class MyModule {}
