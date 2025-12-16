import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameEvent } from '../../entities/game-event.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { Game } from '../../entities/game.entity';
import { TeamMembersModule } from '../team-members/team-members.module';
import { UsersModule } from '../users/users.module';

import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkService } from './clerk.service';
import { TeamAccessGuard } from './team-access.guard';
import { GameEventAccessGuard } from './game-event-access.guard';
import { GameAccessGuard } from './game-access.guard';

@Module({
  imports: [
    forwardRef(() => TeamMembersModule),
    TypeOrmModule.forFeature([GameEvent, GameTeam, Game]),
    UsersModule,
  ],
  providers: [
    ClerkService,
    ClerkAuthGuard,
    TeamAccessGuard,
    GameEventAccessGuard,
    GameAccessGuard,
  ],
  exports: [
    ClerkService,
    ClerkAuthGuard,
    TeamAccessGuard,
    GameEventAccessGuard,
    GameAccessGuard,
  ],
})
export class AuthModule {}
