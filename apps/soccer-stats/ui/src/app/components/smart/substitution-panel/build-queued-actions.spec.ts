import { describe, expect, it } from 'vitest';

import type { RosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { buildQueuedActions } from './build-queued-actions';
import type { QueuedItem } from './types';

const player = (id: string, position: string | null, eventId: string) =>
  ({
    playerId: id,
    firstName: `P${id}`,
    lastName: 'X',
    gameEventId: eventId,
    position,
  }) as RosterPlayer;

const ctx = {
  gameTeamId: 'gt1',
  period: '1',
  periodSecond: 600,
  trackPositions: true,
};

describe('buildQueuedActions', () => {
  it('records one batch, then removals, then additions, in order', () => {
    const queue: QueuedItem[] = [
      {
        id: 'add',
        type: 'addition',
        playerIn: player('9', null, 'b9'),
        position: 'LB',
      },
      { id: 'rem', type: 'removal', playerOut: player('2', 'CM', 'e2') },
      {
        id: 'sub',
        type: 'substitution',
        playerOut: player('1', 'GK', 'e1'),
        playerIn: player('3', null, 'b3'),
      },
    ];

    const actions = buildQueuedActions(queue, ctx);

    expect(actions.map((a) => a.kind)).toEqual([
      'batchLineupChanges',
      'removePlayerFromField',
      'bringPlayerOntoField',
    ]);
    for (const action of actions) {
      expect((action.variables['input'] as { actionId: string }).actionId).toBe(
        action.actionId,
      );
    }
  });

  it('uses the same client IDs in the inputs and the pending events', () => {
    const [batch, removal, addition] = buildQueuedActions(
      [
        {
          id: 'sub',
          type: 'substitution',
          playerOut: player('1', 'GK', 'e1'),
          playerIn: player('3', null, 'b3'),
        },
        { id: 'rem', type: 'removal', playerOut: player('2', 'CM', 'e2') },
        { id: 'add', type: 'addition', playerIn: player('9', null, 'b9') },
      ],
      ctx,
    );

    const batchInput = batch.variables['input'] as {
      substitutions: { subOutEventId: string; subInEventId: string }[];
    };
    const sub = batchInput.substitutions[0];
    expect(batch.pendingEvents.map((e) => e.id)).toEqual([
      sub.subOutEventId,
      sub.subInEventId,
    ]);
    expect(batch.pendingEvents[1].position).toBe('GK');

    expect(removal.pendingEvents[0].id).toBe(
      (removal.variables['input'] as { eventId: string }).eventId,
    );
    expect(addition.pendingEvents[0]).toMatchObject({
      id: (addition.variables['input'] as { eventId: string }).eventId,
      position: 'FIELD',
    });
  });

  it('references a queued sub by its subInEventId in a swap', () => {
    const [batch] = buildQueuedActions(
      [
        {
          id: 'sub',
          type: 'substitution',
          playerOut: player('1', 'GK', 'e1'),
          playerIn: player('3', null, 'b3'),
        },
        {
          id: 'swap',
          type: 'swap',
          player1: {
            source: 'queuedSub',
            player: player('3', null, 'b3'),
            queuedSubId: 'sub',
          },
          player2: {
            source: 'onField',
            player: player('2', 'CM', 'e2'),
            gameEventId: 'e2',
          },
        },
      ],
      ctx,
    );

    const input = batch.variables['input'] as {
      substitutions: { subInEventId: string }[];
      swaps: {
        player1: { eventId?: string; substitutionIndex?: number };
        player2: { eventId?: string };
        swap1EventId: string;
        swap2EventId: string;
      }[];
    };
    const swap = input.swaps[0];
    expect(swap.player1).toEqual({
      eventId: input.substitutions[0].subInEventId,
    });
    expect(swap.player2).toEqual({ eventId: 'e2' });

    const swapEvents = batch.pendingEvents.filter(
      (e) => e.eventType.name === 'POSITION_SWAP',
    );
    expect(swapEvents.map((e) => e.id)).toEqual([
      swap.swap1EventId,
      swap.swap2EventId,
    ]);
    // The incoming player (taking GK) swaps with the CM
    expect(swapEvents[0]).toMatchObject({ playerId: '3', position: 'CM' });
    expect(swapEvents[1]).toMatchObject({ playerId: '2', position: 'GK' });
  });

  it('records nothing for an empty queue', () => {
    expect(buildQueuedActions([], ctx)).toEqual([]);
  });
});
