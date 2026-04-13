import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class TeamStatsInput {
  @Field(() => ID, { description: 'Team ID to get stats for' })
  teamId: string;

  @Field({
    nullable: true,
    description: 'Start date for filtering (inclusive)',
  })
  startDate?: Date;

  @Field({
    nullable: true,
    description: 'End date for filtering (inclusive)',
  })
  endDate?: Date;
}
