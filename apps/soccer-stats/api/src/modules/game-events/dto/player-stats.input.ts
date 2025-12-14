import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class PlayerStatsInput {
  @Field(() => ID, { description: 'Required: Team ID to get player stats for' })
  teamId: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Optional: Filter to a single game',
  })
  gameId?: string;

  @Field({
    nullable: true,
    description:
      'Optional: Start date for date range filter (e.g., season start)',
  })
  startDate?: Date;

  @Field({
    nullable: true,
    description: 'Optional: End date for date range filter (e.g., season end)',
  })
  endDate?: Date;
}
