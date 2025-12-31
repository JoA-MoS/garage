import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../entities/user.entity';
import { Game } from '../../entities/game.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { AuthModule } from '../auth/auth.module';

import { MyResolver } from './my.resolver';
import { MyService } from './my.service';

/**
 * Module for the `my` query - implements the Viewer pattern.
 *
 * This module provides user-scoped data access through a single
 * GraphQL entry point, following patterns established by GitHub,
 * Shopify, and Facebook.
 *
 * @see FEATURE_ROADMAP.md Issue #183
 */
@Module({
  imports: [
    // Team entity not needed - teams are loaded via TeamMember relations
    TypeOrmModule.forFeature([User, Game, TeamMember, GameTeam]),
    forwardRef(() => AuthModule),
  ],
  providers: [MyResolver, MyService],
  exports: [MyService],
})
export class MyModule {}
