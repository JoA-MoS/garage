import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class TeamPlayerWithJersey {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  position: string;

  @Field(() => Int)
  jersey: number;

  @Field(() => Int, { nullable: true })
  depthRank?: number;

  @Field()
  isActive: boolean;
}
