import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TeamMember } from '../../entities/team-member.entity';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

import { TeamMembersResolver } from './team-members.resolver';
import { TeamMembersService } from './team-members.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamMember, Team, User]),
    forwardRef(() => AuthModule),
  ],
  providers: [TeamMembersResolver, TeamMembersService],
  exports: [TeamMembersService],
})
export class TeamMembersModule {}
