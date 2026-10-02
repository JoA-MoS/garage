import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ApolloClient } from '@apollo/client';
import {
  buildClientSchema,
  getNullableType,
  isListType,
  type GraphQLObjectType,
} from 'graphql';

import { schemaIntrospection } from '@garage/soccer-stats/graphql-codegen/schema';

import { sendOutboxAction } from './game-outbox-context';
import type { OutboxAction, OutboxActionKind } from './outbox-types';

const addEventsToGameTeam = vi.fn();
vi.mock('../services/game-event-cache', () => ({
  addEventsToGameTeam: (...args: unknown[]) => addEventsToGameTeam(...args),
}));

const e1 = { id: 'e1' };
const e2 = { id: 'e2' };

/** Response data shaped as the API schema returns it for each kind. */
const responses: Record<
  Exclude<OutboxActionKind, 'updateGame'>,
  { data: Record<string, unknown>; expected: unknown[] }
> = {
  // [GameEvent] in the schema
  batchLineupChanges: {
    data: { batchLineupChanges: [e1, e2] },
    expected: [e1, e2],
  },
  swapPositions: { data: { swapPositions: [e1, e2] }, expected: [e1, e2] },
  substitutePlayer: {
    data: { substitutePlayer: [e1, e2] },
    expected: [e1, e2],
  },
  // GameEvent in the schema
  bringPlayerOntoField: { data: { bringPlayerOntoField: e1 }, expected: [e1] },
  removePlayerFromField: {
    data: { removePlayerFromField: e1 },
    expected: [e1],
  },
  recordPositionChange: { data: { recordPositionChange: e1 }, expected: [e1] },
  recordFormationChange: {
    data: { recordFormationChange: e1 },
    expected: [e1],
  },
  recordGoal: { data: { recordGoal: e1 }, expected: [e1] },
};

function action(kind: OutboxActionKind): OutboxAction {
  return {
    actionId: 'a1',
    gameId: 'g1',
    kind,
    variables: { input: { gameTeamId: 'gt1', actionId: 'a1' } },
    pendingEvents: [],
    createdAt: '2026-10-02T10:00:00.000Z',
    attempts: 0,
    nextAttemptAt: 0,
    status: 'queued',
  };
}

/** A client whose mutate runs the update callback with the given data. */
function fakeClient(data: Record<string, unknown>) {
  const cache = {};
  const mutate = vi.fn(async ({ update }) => {
    update?.(cache, { data });
    return { data };
  });
  return { client: { mutate } as unknown as ApolloClient, cache, mutate };
}

describe('response shapes used above', () => {
  const mutationType = buildClientSchema(
    schemaIntrospection,
  ).getMutationType() as GraphQLObjectType;

  it.each(Object.entries(responses))(
    '%s returns a list exactly when the API schema says so',
    (kind, { data }) => {
      const field = mutationType.getFields()[kind];
      expect(isListType(getNullableType(field.type))).toBe(
        Array.isArray(data[kind]),
      );
    },
  );
});

describe('sendOutboxAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(Object.entries(responses))(
    'writes the events %s returns to the team in the cache',
    async (kind, { data, expected }) => {
      const { client, cache } = fakeClient(data);

      await sendOutboxAction(client, action(kind as OutboxActionKind));

      expect(addEventsToGameTeam).toHaveBeenCalledWith(cache, 'gt1', expected);
    },
  );

  it('writes no events for updateGame (the returned Game normalizes itself)', async () => {
    const { client, mutate } = fakeClient({ updateGame: { id: 'g1' } });

    await sendOutboxAction(client, {
      ...action('updateGame'),
      variables: { id: 'g1', updateGameInput: { actionId: 'a1' } },
    });

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(addEventsToGameTeam).not.toHaveBeenCalled();
  });
});
