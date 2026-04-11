import { ObjectType, Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

/**
 * Feature flags controlling what statistics are tracked during a game.
 *
 * Dependency rules (enforced at UI layer and validated on API input):
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

  @Field({
    description: 'Record who assisted each goal (requires trackScorer)',
  })
  trackAssists: boolean;

  @Field({ description: 'Record player substitutions (in/out) for play time' })
  trackSubstitutions: boolean;

  @Field({
    description:
      'Record player positions during substitutions (requires trackSubstitutions)',
  })
  trackPositions: boolean;
}

@ValidatorConstraint({ name: 'statsFeaturesConsistent', async: false })
class StatsFeaturesConsistencyConstraint
  implements ValidatorConstraintInterface
{
  // @Validate is a property decorator; access the full input via args.object
  validate(_value: unknown, args: ValidationArguments): boolean {
    const input = args.object as StatsFeaturesInput;
    if (input.trackScorer && !input.trackGoals) return false;
    if (input.trackAssists && !input.trackScorer) return false;
    if (input.trackPositions && !input.trackSubstitutions) return false;
    return true;
  }

  defaultMessage(): string {
    return (
      'Invalid stats feature combination: ' +
      'trackScorer requires trackGoals, ' +
      'trackAssists requires trackScorer, ' +
      'trackPositions requires trackSubstitutions'
    );
  }
}

@InputType('StatsFeaturesInput')
export class StatsFeaturesInput {
  // Cross-field dependency constraint applied here; validator inspects the full object
  @Field({ description: 'Record that a goal occurred' })
  @IsBoolean()
  @Validate(StatsFeaturesConsistencyConstraint)
  trackGoals: boolean;

  @Field({ description: 'Record who scored each goal (requires trackGoals)' })
  @IsBoolean()
  trackScorer: boolean;

  @Field({
    description: 'Record who assisted each goal (requires trackScorer)',
  })
  @IsBoolean()
  trackAssists: boolean;

  @Field({ description: 'Record player substitutions (in/out) for play time' })
  @IsBoolean()
  trackSubstitutions: boolean;

  @Field({
    description:
      'Record player positions during substitutions (requires trackSubstitutions)',
  })
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
