/**
 * Derives a team's live roster (who is on the field, at which position, and
 * each player's current event) from its game events.
 *
 * Must produce the same result as the API's `LineupService.getGameRoster`
 * SQL, which the live game screen used to fetch after every change. Keeping
 * them identical lets the client show a lineup change before the server
 * confirms it (see apps/soccer-stats/docs/event-outbox.md).
 */

/** The fields of a game event the derivation reads. */
export interface RosterSourceEvent {
  id: string;
  eventType: { name: string };
  playerId?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  position?: string | null;
  formation?: string | null;
  period?: string | null;
  periodSecond: number;
  /** ISO string (as GraphQL returns it) or Date. */
  createdAt: string | Date;
  parentEventId?: string | null;
  player?: { firstName?: string | null; lastName?: string | null } | null;
}

export interface RosterPlayerState {
  /** The player's latest roster event - what lineup mutations reference. */
  gameEventId: string;
  playerId?: string;
  externalPlayerName?: string;
  externalPlayerNumber?: string;
  /** Position on the field; null means on the bench. */
  position: string | null;
  firstName?: string;
  lastName?: string;
  playerName?: string;
}

export interface DerivedGameRoster {
  formation: string | null;
  players: RosterPlayerState[];
  /** Players taken off by the most recent PERIOD_END (halftime pre-fill). */
  previousPeriodLineup?: RosterPlayerState[];
}

export interface DeriveGameRosterOptions {
  /** Used when no FORMATION_CHANGE exists (team configuration default). */
  defaultFormation?: string | null;
}

const ROSTER_EVENT_TYPES = new Set([
  'GAME_ROSTER',
  'SUBSTITUTION_IN',
  'SUBSTITUTION_OUT',
  'POSITION_SWAP',
  'POSITION_CHANGE',
]);

/**
 * @param events One team's events, in the order the API returns them
 *   (period, periodSecond, createdAt ascending). That order breaks ties the
 *   millisecond `createdAt` can't, since the database stores microseconds.
 *   Events added locally afterwards should be appended.
 */
export function deriveGameRoster(
  events: readonly RosterSourceEvent[],
  options: DeriveGameRosterOptions = {},
): DerivedGameRoster {
  const indexed = events.map((event, index) => ({ event, index }));

  // SQL: ROW_NUMBER() OVER (PARTITION BY COALESCE(playerId, externalPlayerName)
  //      ORDER BY period DESC, periodSecond DESC, createdAt DESC) = 1
  const latestByPlayer = new Map<string | null, IndexedEvent>();
  for (const item of indexed) {
    if (!ROSTER_EVENT_TYPES.has(item.event.eventType.name)) continue;
    const key = item.event.playerId ?? item.event.externalPlayerName ?? null;
    const current = latestByPlayer.get(key);
    if (!current || isLater(item, current)) {
      latestByPlayer.set(key, item);
    }
  }

  const players = [...latestByPlayer.values()].map(({ event }) =>
    toRosterPlayer(
      event,
      event.eventType.name === 'SUBSTITUTION_OUT'
        ? null
        : (event.position ?? null),
    ),
  );

  let latestFormation: IndexedEvent | undefined;
  for (const item of indexed) {
    if (item.event.eventType.name !== 'FORMATION_CHANGE') continue;
    if (!latestFormation || isLater(item, latestFormation)) {
      latestFormation = item;
    }
  }

  return {
    formation:
      latestFormation?.event.formation ?? options.defaultFormation ?? null,
    players,
    previousPeriodLineup: derivePreviousPeriodLineup(indexed),
  };
}

type IndexedEvent = { event: RosterSourceEvent; index: number };

/** True if `a` sorts after `b` by period, periodSecond, createdAt, input order. */
function isLater(a: IndexedEvent, b: IndexedEvent): boolean {
  const byPeriod = comparePeriodsNullsLast(a.event.period, b.event.period);
  if (byPeriod !== 0) return byPeriod > 0;
  if (a.event.periodSecond !== b.event.periodSecond) {
    return a.event.periodSecond > b.event.periodSecond;
  }
  const byCreated = time(a.event.createdAt) - time(b.event.createdAt);
  if (byCreated !== 0) return byCreated > 0;
  return a.index > b.index;
}

/**
 * Ascending comparison where null counts as the highest value, so it comes
 * first in a DESC ordering - Postgres's default (NULLS FIRST for DESC).
 */
function comparePeriodsNullsLast(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

function time(value: string | Date): number {
  return value instanceof Date ? value.getTime() : Date.parse(value);
}

/**
 * SQL: the PERIOD_END with the latest createdAt (input order breaks ties),
 * then the SUBSTITUTION_OUTs whose parent is that event.
 */
function derivePreviousPeriodLineup(
  indexed: IndexedEvent[],
): RosterPlayerState[] | undefined {
  let periodEnd: IndexedEvent | undefined;
  for (const item of indexed) {
    if (item.event.eventType.name !== 'PERIOD_END') continue;
    if (
      !periodEnd ||
      time(item.event.createdAt) > time(periodEnd.event.createdAt) ||
      (time(item.event.createdAt) === time(periodEnd.event.createdAt) &&
        item.index > periodEnd.index)
    ) {
      periodEnd = item;
    }
  }
  if (!periodEnd) return undefined;

  const periodEndId = periodEnd.event.id;
  return indexed
    .filter(
      ({ event }) =>
        event.eventType.name === 'SUBSTITUTION_OUT' &&
        event.parentEventId === periodEndId,
    )
    .map(({ event }) => toRosterPlayer(event, event.position ?? null));
}

function toRosterPlayer(
  event: RosterSourceEvent,
  position: string | null,
): RosterPlayerState {
  const firstName = event.player?.firstName ?? undefined;
  const lastName = event.player?.lastName ?? undefined;
  return {
    gameEventId: event.id,
    playerId: event.playerId ?? undefined,
    externalPlayerName: event.externalPlayerName ?? undefined,
    externalPlayerNumber: event.externalPlayerNumber ?? undefined,
    position,
    firstName,
    lastName,
    playerName: [firstName, lastName].filter(Boolean).join(' ') || undefined,
  };
}
