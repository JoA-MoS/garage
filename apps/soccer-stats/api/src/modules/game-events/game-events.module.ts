import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEvent, EventType, GameTeam, Game, Team]),
    AuthModule,
    UsersModule,
    GamesModule,
  ],
  providers: [GameEventsService, GameEventsResolver],
  exports: [GameEventsService],
})
export class GameEventsModule {}
