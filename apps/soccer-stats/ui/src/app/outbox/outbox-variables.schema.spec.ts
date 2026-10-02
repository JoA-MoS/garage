import { describe, expect, it } from 'vitest';
import { buildClientSchema, getOperationAST, type DocumentNode } from 'graphql';
import { getVariableValues } from 'graphql/execution/values';

import type { RosterPlayer } from '@garage/soccer-stats/graphql-codegen';
import { schemaIntrospection } from '@garage/soccer-stats/graphql-codegen/schema';

import { buildQueuedActions } from '../components/smart/substitution-panel/build-queued-actions';
import type { QueuedItem } from '../components/smart/substitution-panel/types';

import {
  outboxMutationDocument,
  type RecordActionInput,
} from './game-outbox-context';
import { buildGameClockAction } from './game-clock-action';
import { buildGoalAction } from './goal-action';

/**
 * Outbox actions carry their mutation variables as plain objects built at
 * runtime, so TypeScript can't catch a misnamed or mistyped field - the
 * server would reject the action on the coach's phone. This validates every
 * kind of action the app builds against the API schema.
 */
const schema = buildClientSchema(schemaIntrospection);

function expectValidVariables(action: RecordActionInput) {
  const document = outboxMutationDocument(action.kind) as DocumentNode;
  const operation = getOperationAST(document);
  if (!operation) throw new Error(`No operation for ${action.kind}`);
  const result = getVariableValues(
    schema,
    operation.variableDefinitions ?? [],
    action.variables,
  );
  expect(result.errors?.map((e) => e.message) ?? []).toEqual([]);
}

const player = (id: string, position: string | null, eventId: string) =>
  ({
    playerId: id,
    firstName: `First${id}`,
    lastName: `Last${id}`,
    gameEventId: eventId,
    position,
  }) as RosterPlayer;
const guest = {
  externalPlayerName: 'Guest 7',
  externalPlayerNumber: '7',
  gameEventId: 'g7',
  position: null,
} as RosterPlayer;

describe('outbox action variables match the API schema', () => {
  it('substitution panel: batch (subs + swaps incl. a queued sub), removal, addition', () => {
    const queue: QueuedItem[] = [
      {
        id: 'sub1',
        type: 'substitution',
        playerOut: player('1', 'GK', 'e1'),
        playerIn: player('9', null, 'b9'),
      },
      {
        id: 'sub2',
        type: 'substitution',
        playerOut: player('4', 'LB', 'e4'),
        playerIn: guest,
      },
      {
        id: 'swap1',
        type: 'swap',
        player1: {
          source: 'onField',
          player: player('2', 'CM', 'e2'),
          gameEventId: 'e2',
        },
        player2: {
          source: 'queuedSub',
          player: player('9', null, 'b9'),
          queuedSubId: 'sub1',
        },
      },
      { id: 'rem', type: 'removal', playerOut: player('3', 'ST', 'e3') },
      {
        id: 'add',
        type: 'addition',
        playerIn: player('5', null, 'b5'),
        position: 'RB',
      },
    ];

    const actions = buildQueuedActions(queue, {
      gameTeamId: 'gt1',
      period: '2',
      periodSecond: 610,
      trackPositions: true,
    });

    expect(actions.map((a) => a.kind)).toEqual([
      'batchLineupChanges',
      'removePlayerFromField',
      'bringPlayerOntoField',
    ]);
    actions.forEach(expectValidVariables);
  });

  it('goals: tracked scorer and assist, quick-entry numbers, unknown scorer', () => {
    expectValidVariables(
      buildGoalAction({
        gameTeamId: 'gt1',
        period: '1',
        periodSecond: 420,
        scorer: player('1', 'ST', 'e1'),
        assister: player('2', 'CM', 'e2'),
      }),
    );
    expectValidVariables(
      buildGoalAction({
        gameTeamId: 'gt1',
        period: '1',
        periodSecond: 420,
        scorer: { externalPlayerName: '#10', externalPlayerNumber: '10' },
        assister: undefined,
      }),
    );
    expectValidVariables(
      buildGoalAction({
        gameTeamId: 'gt1',
        period: '1',
        periodSecond: 420,
        scorer: undefined,
        assister: undefined,
      }),
    );
  });

  it('game clock: the inputs game.page sends for each status/clock change', () => {
    const clock = { periodSecond: 734 };
    const cases: Array<Parameters<typeof buildGameClockAction>> = [
      ['g1', 'startFirstHalf', { status: 'FIRST_HALF' }, clock],
      ['g1', 'endFirstHalf', { status: 'HALFTIME', periodSecond: 1500 }, clock],
      ['g1', 'startSecondHalf', { status: 'SECOND_HALF' }, clock],
      ['g1', 'endGame', { status: 'COMPLETED', periodSecond: 1490 }, clock],
      [
        'g1',
        'pause',
        { pausedAt: new Date().toISOString(), period: '2', periodSecond: 734 },
        clock,
      ],
      [
        'g1',
        'resume',
        { pausedAt: null, period: '2', periodSecond: 734 },
        clock,
      ],
    ];
    for (const args of cases) {
      expectValidVariables(buildGameClockAction(...args));
    }
  });
});
