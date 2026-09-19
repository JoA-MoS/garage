import { GameEvent } from '../../../entities/game-event.entity';

/**
 * PostgreSQL LISTEN/NOTIFY payloads are limited to ~8KB.
 *
 * Subscription events may be backed by Postgres PubSub in distributed
 * deployments, so publish only scalar GameEvent fields. GraphQL field resolvers
 * and DataLoaders hydrate relations like eventType, player, gameTeam, and
 * childEvents when subscribers request them.
 */
export function createSlimGameEventForSubscription(
  event: GameEvent,
): GameEvent {
  return {
    id: event.id,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    gameId: event.gameId,
    eventTypeId: event.eventTypeId,
    playerId: event.playerId,
    externalPlayerName: event.externalPlayerName,
    externalPlayerNumber: event.externalPlayerNumber,
    recordedByUserId: event.recordedByUserId,
    gameTeamId: event.gameTeamId,
    parentEventId: event.parentEventId,
    period: event.period,
    periodSecond: event.periodSecond,
    position: event.position,
    formation: event.formation,
    description: event.description,
    conflictId: event.conflictId,
    metadata: event.metadata,
  } as GameEvent;
}
