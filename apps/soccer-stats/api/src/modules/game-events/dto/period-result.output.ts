import { ObjectType, Field, Int } from '@nestjs/graphql';

import { GameEvent } from '../../../entities/game-event.entity';

@ObjectType()
export class PeriodResult {
  @Field(() => GameEvent, {
    description: 'The PERIOD_START or PERIOD_END event',
  })
  periodEvent: GameEvent;

  @Field(() => [GameEvent], {
    description: 'Child substitution events (SUB_IN or SUB_OUT)',
  })
  substitutionEvents: GameEvent[];

  @Field(() => String, {
    description: 'Period identifier (e.g., "1", "2", "OT1")',
  })
  period: string;

  @Field(() => Int, { description: 'Number of substitution events created' })
  substitutionCount: number;
}
