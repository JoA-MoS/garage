import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../entities/user.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { TeamsModule } from '../teams/teams.module';
import { TeamMembersModule } from '../team-members/team-members.module';

import { CoachesService } from './coaches.service';
import { CoachesResolver } from './coaches.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TeamMember]),
    forwardRef(() => TeamsModule),
    forwardRef(() => TeamMembersModule),
  ],
  providers: [CoachesResolver, CoachesService],
  exports: [CoachesService],
})
export class CoachesModule {}
