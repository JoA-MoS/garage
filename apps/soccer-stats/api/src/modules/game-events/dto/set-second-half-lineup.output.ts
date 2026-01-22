import { ObjectType, Field, Int } from '@nestjs/graphql';

import { GameEvent } from '../../../entities/game-event.entity';

@ObjectType()
export class SecondHalfLineupResult {
  @Field(() => [GameEvent], { description: 'All created events' })
  events: GameEvent[];

  @Field(() => Int, { description: 'Players subbed out from first half' })
  substitutionsOut: number;

  @Field(() => Int, { description: 'Players subbed in for second half' })
  substitutionsIn: number;
}
