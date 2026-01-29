import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Game } from '../../entities/game.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';
import { User } from '../../entities/user.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { TeamMemberRole } from '../../entities/team-member-role.entity';
import { GamesModule } from '../games/games.module';

import { DataLoadersService } from './dataloaders.service';

/**
 * Module providing DataLoader infrastructure for batching GraphQL queries.
 *
 * Usage:
 * 1. Import this module in AppModule
 * 2. Inject DataLoadersService in GraphQL context factory
 * 3. Call createLoaders() per-request to get fresh loaders
 * 4. Access loaders in resolvers via @Context()
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Game,
      GameFormat,
      Team,
      GameTeam,
      GameEvent,
      EventType,
      User,
      TeamMember,
      TeamMemberRole,
    ]),
    forwardRef(() => GamesModule), // For GameTimingService
  ],
  providers: [DataLoadersService],
  exports: [DataLoadersService],
})
export class DataLoadersModule {}
