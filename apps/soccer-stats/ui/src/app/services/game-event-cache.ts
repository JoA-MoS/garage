import type { ApolloCache, Reference } from '@apollo/client';

import {
  LineupEventFragmentDoc,
  type LineupEventFragment,
} from '@garage/soccer-stats/graphql-codegen';

/**
 * Cache writes for lineup mutations. The live roster is derived from
 * `GameTeam.events` (see use-live-game-state.ts), so a mutation that returns
 * its new events can update the screen from its own response instead of
 * refetching the server's roster.
 */

type CacheEvent = { id?: string | null; __typename?: string };

/**
 * Writes each event (the fields in the LineupEvent fragment) and appends it to
 * the game team's events unless it is already listed. Writing an existing
 * event refreshes its fields - e.g. the server's `createdAt` replaces the one
 * the subscription handler stamped locally - without listing it twice.
 */
export function addEventsToGameTeam(
  cache: ApolloCache,
  gameTeamId: string,
  events: ReadonlyArray<object | null | undefined> | null | undefined,
): void {
  if (!events?.length) return;

  const refs: Reference[] = [];
  for (const event of events) {
    const { id } = (event ?? {}) as CacheEvent;
    if (!event || !id) continue;
    const ref = cache.writeFragment({
      data: { __typename: 'GameEvent', ...event } as LineupEventFragment,
      fragment: LineupEventFragmentDoc,
    });
    if (ref) refs.push(ref);
  }
  if (refs.length === 0) return;

  cache.modify({
    id: cache.identify({ __typename: 'GameTeam', id: gameTeamId }),
    fields: {
      events(value) {
        const existing = (value ?? []) as readonly Reference[];
        const present = new Set(existing.map((ref) => ref.__ref));
        const added = refs.filter((ref) => {
          if (present.has(ref.__ref)) return false;
          present.add(ref.__ref);
          return true;
        });
        return added.length === 0 ? existing : [...existing, ...added];
      },
    },
  });
}

/** Drops a deleted event from the game team's events and the cache. */
export function removeEventFromGameTeam(
  cache: ApolloCache,
  gameTeamId: string,
  eventId: string,
): void {
  const eventCacheId = cache.identify({ __typename: 'GameEvent', id: eventId });
  if (!eventCacheId) return;

  cache.modify({
    id: cache.identify({ __typename: 'GameTeam', id: gameTeamId }),
    fields: {
      events(value) {
        const existing = (value ?? []) as readonly Reference[];
        return existing.filter((ref) => ref.__ref !== eventCacheId);
      },
    },
  });
  cache.evict({ id: eventCacheId });
  cache.gc();
}

/**
 * Makes each game team's cached events match a fresh server response, dropping
 * events deleted on the server. Needed because the GameTeam.events merge
 * policy only ever adds, so a refetch alone never removes a deleted event
 * (including the partner a substitution or swap delete removes without
 * announcing it).
 */
export function pruneDeletedGameEvents(
  cache: ApolloCache,
  game:
    | {
        teams?: ReadonlyArray<{
          id: string;
          events?: ReadonlyArray<{ id: string }> | null;
        }> | null;
      }
    | null
    | undefined,
): void {
  for (const team of game?.teams ?? []) {
    if (!team.events) continue;
    const serverIds = new Set(team.events.map((e) => e.id));
    cache.modify({
      id: cache.identify({ __typename: 'GameTeam', id: team.id }),
      fields: {
        events(value, { readField }) {
          const existing = (value ?? []) as readonly Reference[];
          const kept = existing.filter((ref) =>
            serverIds.has(readField('id', ref) as string),
          );
          return kept.length === existing.length ? existing : kept;
        },
      },
    });
  }
}
