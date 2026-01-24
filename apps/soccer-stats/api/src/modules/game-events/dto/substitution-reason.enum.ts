import { registerEnumType } from '@nestjs/graphql';

/**
 * Reason for an unbalanced substitution (player removed or added without paired event).
 * Used for scenarios like injuries, red cards, or late arrivals.
 */
export enum SubstitutionReason {
  INJURY = 'INJURY',
  RED_CARD = 'RED_CARD',
  LATE_ARRIVAL = 'LATE_ARRIVAL',
  TACTICAL = 'TACTICAL',
  OTHER = 'OTHER',
}

registerEnumType(SubstitutionReason, {
  name: 'SubstitutionReason',
  description:
    'Reason for an unbalanced substitution (removing or adding a player without a paired event)',
});
