import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../entities/user.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { TeamMembersModule } from '../team-members/team-members.module';

import { PlayersResolver } from './players.resolver';
import { PlayersService } from './players.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TeamMember]),
    forwardRef(() => TeamMembersModule),
  ],
  providers: [PlayersResolver, PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
