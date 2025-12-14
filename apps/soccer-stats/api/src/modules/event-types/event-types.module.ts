import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventType } from '../../entities/event-type.entity';
import { AuthModule } from '../auth/auth.module';

import { EventTypesService } from './event-types.service';
import { EventTypesResolver } from './event-types.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([EventType]), AuthModule],
  providers: [EventTypesService, EventTypesResolver],
  exports: [EventTypesService],
})
export class EventTypesModule {}
