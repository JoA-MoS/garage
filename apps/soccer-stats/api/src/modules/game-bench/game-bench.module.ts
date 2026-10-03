import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventType } from '../../entities/event-type.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { TeamMember } from '../../entities/team-member.entity';

import { GameBenchService } from './game-bench.service';

/** Kept separate so calendar sync can use it without the games module. */
@Module({
  imports: [TypeOrmModule.forFeature([TeamMember, EventType, GameEvent])],
  providers: [GameBenchService],
  exports: [GameBenchService],
})
export class GameBenchModule {}
