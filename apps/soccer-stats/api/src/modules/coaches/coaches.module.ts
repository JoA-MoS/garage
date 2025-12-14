import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../entities/user.entity';
import { TeamCoach } from '../../entities/team-coach.entity';
import { TeamsModule } from '../teams/teams.module';

import { CoachesService } from './coaches.service';
import { CoachesResolver } from './coaches.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TeamCoach]),
    TeamsModule, // Import to access TeamsService
  ],
  providers: [CoachesResolver, CoachesService],
  exports: [CoachesService],
})
export class CoachesModule {}
