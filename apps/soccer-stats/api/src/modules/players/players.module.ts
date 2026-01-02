import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamsModule } from '../teams/teams.module';

import { PlayersResolver } from './players.resolver';
import { PlayersService } from './players.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Team, TeamPlayer]),
    forwardRef(() => TeamsModule),
  ],
  providers: [PlayersResolver, PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
