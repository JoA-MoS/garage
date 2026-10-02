import { useMemo } from 'react';

import {
  deriveGameRoster,
  type DerivedGameRoster,
  type RosterSourceEvent,
} from '@garage/soccer-stats/utils';

/**
 * Live game state derived on the client from the game's events, instead of
 * fetched from the server after every change (docs/event-outbox.md, phase 2).
 * Phase 3 adds the outbox's pending events to the same derivation.
 */

/** A child event as the game query returns it (nested under its parent). */
export interface LiveChildEvent {
  id: string;
  eventType: { name: string };
  playerId?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  position?: string | null;
  period?: string | null;
  periodSecond?: number | null;
  player?: { firstName?: string | null; lastName?: string | null } | null;
}

/** A team event as the game query returns it. */
export interface LiveGameEvent extends Omit<RosterSourceEvent, 'eventType'> {
  eventType: { name: string };
  childEvents?: readonly LiveChildEvent[] | null;
}

export interface LiveTeamData {
  id: string;
  events?: readonly LiveGameEvent[] | null;
  team?: {
    teamConfiguration?: { defaultFormation?: string | null } | null;
  } | null;
}

export type TeamRoster = DerivedGameRoster & { gameTeamId: string };

/**
 * Flattens a team's events for roster derivation.
 *
 * The subscription adds only a mutation's primary event to the cache, with
 * the rest nested in `childEvents` (a substitution's SUBSTITUTION_IN, a
 * period end's SUBSTITUTION_OUTs). Until a refetch brings them as top-level
 * events, they're added right after their parent with its time, which is
 * when the server wrote them.
 */
export function toRosterSourceEvents(
  events: readonly LiveGameEvent[] | null | undefined,
): RosterSourceEvent[] {
  if (!events) return [];
  const topLevelIds = new Set(events.map((e) => e.id));
  const result: RosterSourceEvent[] = [];

  for (const event of events) {
    result.push(event);
    for (const child of event.childEvents ?? []) {
      if (topLevelIds.has(child.id)) continue;
      result.push({
        ...child,
        period: child.period ?? event.period,
        periodSecond: child.periodSecond ?? event.periodSecond,
        createdAt: event.createdAt,
        parentEventId: event.id,
      });
    }
  }
  return result;
}

/**
 * Confirmed events plus the outbox's pending ones, appended after them (they
 * happened later). A pending event is dropped once its confirmed copy - same
 * client-chosen ID - is in the cache, top-level or nested.
 */
export function mergePendingEvents<T extends LiveGameEvent>(
  confirmed: readonly T[] | null | undefined,
  pending: readonly LiveGameEvent[] | null | undefined,
): readonly (T | LiveGameEvent)[] {
  const base = confirmed ?? [];
  if (!pending?.length) return base;
  const confirmedIds = new Set<string>();
  for (const event of base) {
    confirmedIds.add(event.id);
    for (const child of event.childEvents ?? []) confirmedIds.add(child.id);
  }
  const unconfirmed = pending.filter((e) => !confirmedIds.has(e.id));
  return unconfirmed.length === 0 ? base : [...base, ...unconfirmed];
}

/**
 * One team's live roster, re-derived whenever its events or pending outbox
 * events change.
 */
export function useTeamRoster(
  team: LiveTeamData | null | undefined,
  pendingEvents?: readonly LiveGameEvent[],
): TeamRoster | undefined {
  const events = team?.events;
  const gameTeamId = team?.id;
  const defaultFormation = team?.team?.teamConfiguration?.defaultFormation;

  return useMemo(() => {
    if (!gameTeamId) return undefined;
    return {
      gameTeamId,
      ...deriveGameRoster(
        toRosterSourceEvents(mergePendingEvents(events, pendingEvents)),
        { defaultFormation },
      ),
    };
  }, [gameTeamId, events, pendingEvents, defaultFormation]);
}
