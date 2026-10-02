import type { TypePolicies } from '@apollo/client';

export const cacheTypePolicies: TypePolicies = {
  GameTeam: {
    fields: {
      events: {
        // Merge incoming events with existing, deduplicating by cache reference.
        // Prevents cache.modify additions from being lost when a refetch or
        // subscribeToMore response replaces the array.
        merge(
          existing: Array<{ __ref: string }> = [],
          incoming: Array<{ __ref: string }>,
        ) {
          const refs = new Map(existing.map((ref) => [ref.__ref, ref]));
          for (const ref of incoming) {
            refs.set(ref.__ref, ref);
          }
          return [...refs.values()];
        },
      },
    },
  },
};
