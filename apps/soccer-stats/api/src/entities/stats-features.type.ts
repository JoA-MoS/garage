import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsBoolean } from 'class-validator';

/**
 * Feature flags controlling what statistics are tracked during a game.
 *
 * Dependency rules (enforced at the UI layer):
 * - trackScorer requires trackGoals
 * - trackAssists requires trackScorer (which requires trackGoals)
 * - trackPositions requires trackSubstitutions
 */
@ObjectType('StatsFeatures')
export class StatsFeatures {
  @Field({ description: 'Record that a goal occurred' })
  trackGoals: boolean;

  @Field({ description: 'Record who scored each goal (requires trackGoals)' })
  trackScorer: boolean;

  @Field({ description: 'Record who assisted each goal (requires trackScorer)' })
  trackAssists: boolean;

  @Field({ description: 'Record player substitutions (in/out) for play time' })
  trackSubstitutions: boolean;

  @Field({
    description:
      'Record player positions during substitutions (requires trackSubstitutions)',
  })
  trackPositions: boolean;
}

@InputType('StatsFeaturesInput')
export class StatsFeaturesInput {
  @Field()
  @IsBoolean()
  trackGoals: boolean;

  @Field()
  @IsBoolean()
  trackScorer: boolean;

  @Field()
  @IsBoolean()
  trackAssists: boolean;

  @Field()
  @IsBoolean()
  trackSubstitutions: boolean;

  @Field()
  @IsBoolean()
  trackPositions: boolean;
}

/** All features enabled — the default when no override is set */
export const DEFAULT_STATS_FEATURES: StatsFeatures = {
  trackGoals: true,
  trackScorer: true,
  trackAssists: true,
  trackSubstitutions: true,
  trackPositions: true,
};
