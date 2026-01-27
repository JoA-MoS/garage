import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { EventType } from '../../entities/event-type.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { AuthModule } from '../auth/auth.module';
import { GameEventsModule } from '../game-events/game-events.module';

import { GamesResolver } from './games.resolver';
import { GamesService } from './games.service';
import { GameTimingService } from './game-timing.service';
import { GameFieldsResolver } from './game-fields.resolver';
import { GameTeamResolver } from './game-team.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Game,
      Team,
      User,
      GameTeam,
      TeamConfiguration,
      EventType,
      GameEvent,
      GameFormat,
    ]),
    AuthModule,
    forwardRef(() => GameEventsModule), // Circular dependency with GameEventsModule
  ],
  providers: [
    GamesResolver,
    GamesService,
    GameTimingService,
    // Field resolvers using DataLoaders for N+1 prevention
    GameFieldsResolver,
    GameTeamResolver,
  ],
  exports: [GamesService, GameTimingService],
})
export class GamesModule {}
