import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { GameEventsService } from './game-events.service';
import { GameEventsResolver } from './game-events.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEvent, EventType, GameTeam, Game, Team]),
    AuthModule,
    UsersModule,
  ],
  providers: [
    GameEventsService,
    GameEventsResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [GameEventsService],
})
export class GameEventsModule {}
