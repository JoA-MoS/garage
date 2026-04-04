import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameEventsModule } from '../game-events/game-events.module';

import { TeamStatsResolver } from './team-stats.resolver';
import { TeamStatsService } from './team-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, GameTeam]),
    GameEventsModule,
  ],
  providers: [TeamStatsResolver, TeamStatsService],
  exports: [TeamStatsService],
})
export class TeamStatsModule {}
