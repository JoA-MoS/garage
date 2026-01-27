import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';

import { PlayersResolver } from './players.resolver';
import { PlayersService } from './players.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, TeamPlayer])],
  providers: [PlayersResolver, PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
