import { GameEvent } from '../../../entities/game-event.entity';

/**
 * PostgreSQL LISTEN/NOTIFY payloads are limited to ~8000 bytes.
 *
 * Subscription events may be backed by Postgres PubSub in distributed
 * deployments, so publish only scalar GameEvent fields. GraphQL field
 * resolvers and DataLoaders hydrate relations like eventType, player,
 * gameTeam, and childEvents when subscribers request them.
 *
 * createdAt/updatedAt/metadata are stripped too: no subscriber selects them
 * (metadata isn't even part of the GraphQL schema), Postgres NOTIFY's JSON
 * round-trip turns Dates into strings which would null out the whole
 * `event` field if createdAt/updatedAt were ever selected (GraphQL's
 * non-nullable ISODateTime scalar rejects non-Date values), and metadata is
 * free-form/unbounded - the one field that could still blow the payload
 * limit once relations are gone.
 *
 * Destructuring the fields to omit (rather than listing fields to keep)
 * means a new scalar column added to GameEvent flows through automatically;
 * only relations and the fields above need to be named here.
 */
export function createSlimGameEventForSubscription(
  event: GameEvent,
): GameEvent {
  const {
    game: _game,
    eventType: _eventType,
    player: _player,
    recordedByUser: _recordedByUser,
    gameTeam: _gameTeam,
    parentEvent: _parentEvent,
    childEvents: _childEvents,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    metadata: _metadata,
    ...slim
  } = event;
  return slim as GameEvent;
}
