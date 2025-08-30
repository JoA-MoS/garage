import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { Player } from '../../entities/player.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { EventType } from '../../entities/event-type.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { GameParticipation } from '../../entities/game-participation.entity';

import { GamesResolver } from './games.resolver';
import { GamesService } from './games.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Game,
      Team,
      Player,
      GameTeam,
      TeamPlayer,
      EventType,
      GameEvent,
      GameParticipation,
    ]),
  ],
  providers: [
    GamesResolver,
    GamesService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [GamesService],
})
export class GamesModule {}
