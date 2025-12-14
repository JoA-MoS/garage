import { Resolver, Query, Args, ID } from '@nestjs/graphql';

import { EventType, EventCategory } from '../../entities/event-type.entity';
import { Public } from '../auth/public.decorator';

import { EventTypesService } from './event-types.service';

@Resolver(() => EventType)
export class EventTypesResolver {
  constructor(private readonly eventTypesService: EventTypesService) {}

  @Query(() => [EventType], { name: 'eventTypes' })
  @Public()
  findAll(): Promise<EventType[]> {
    return this.eventTypesService.findAll();
  }

  @Query(() => EventType, { name: 'eventType', nullable: true })
  @Public()
  findOne(
    @Args('id', { type: () => ID }) id: string
  ): Promise<EventType | null> {
    return this.eventTypesService.findOne(id);
  }

  @Query(() => EventType, { name: 'eventTypeByName', nullable: true })
  @Public()
  findByName(@Args('name') name: string): Promise<EventType | null> {
    return this.eventTypesService.findByName(name);
  }

  @Query(() => [EventType], { name: 'eventTypesByCategory' })
  @Public()
  findByCategory(
    @Args('category', { type: () => String }) category: EventCategory
  ): Promise<EventType[]> {
    return this.eventTypesService.findByCategory(category);
  }
}
