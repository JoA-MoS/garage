import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class DependentEvent {
  @Field(() => ID)
  id: string;

  @Field()
  eventType: string;

  @Field(() => String, { nullable: true, description: 'Period identifier' })
  period?: string;

  @Field(() => Int, { description: 'Seconds elapsed within the period' })
  periodSecond: number;

  @Field({ nullable: true })
  playerName?: string;

  @Field({ nullable: true })
  description?: string;
}

@ObjectType()
export class DependentEventsResult {
  @Field(() => [DependentEvent])
  dependentEvents: DependentEvent[];

  @Field(() => Int)
  count: number;

  @Field()
  canDelete: boolean;

  @Field({ nullable: true })
  warningMessage?: string;
}
