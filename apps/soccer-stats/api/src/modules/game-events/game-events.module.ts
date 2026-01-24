import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GamesModule } from '../games/games.module';

import { GameEventsService } from './game-events.service';
import { GameEventsResolver } from './game-events.resolver';
import {
  EventCoreService,
  LineupService,
  GoalService,
  SubstitutionService,
  StatsService,
  PeriodService,
  EventManagementService,
} from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEvent, EventType, GameTeam, Game, Team]),
    AuthModule,
    UsersModule,
    forwardRef(() => GamesModule), // Circular dependency with GamesModule
  ],
  providers: [
    // Core service (must be first - other services depend on it)
    EventCoreService,
    // Specialized services
    LineupService,
    GoalService,
    SubstitutionService,
    StatsService,
    PeriodService,
    EventManagementService,
    // Facade service (public API)
    GameEventsService,
    // GraphQL resolver
    GameEventsResolver,
  ],
  exports: [GameEventsService],
})
export class GameEventsModule {}
