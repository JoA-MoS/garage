import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CalendarSyncResultType {
  @Field(() => ID)
  sourceId!: string;

  @Field(() => Int)
  created!: number;

  @Field(() => Int)
  updated!: number;

  @Field(() => Int)
  skipped!: number;

  @Field(() => [String])
  errors!: string[];
}
