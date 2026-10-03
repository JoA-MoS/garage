import type {
  BatchSubstitutionInput,
  BatchSwapInput,
} from '@garage/soccer-stats/graphql-codegen';

import type { RecordActionInput } from '../../../outbox/game-outbox-context';
import type { PendingEvent } from '../../../outbox/outbox-types';
import {
  additionEvents,
  removalEvents,
  substitutionEvents,
  swapEvents,
  type OnFieldPlayerRef,
} from '../../../outbox/pending-events';
import { FIELD_SENTINEL_POSITION } from '../lineup-panel/types';

import type { QueuedItem, SwapPlayer } from './types';

export interface QueuedActionContext {
  gameTeamId: string;
  period: string;
  periodSecond: number;
  trackPositions: boolean;
}

type QueuedOf<T extends QueuedItem['type']> = Extract<QueuedItem, { type: T }>;

/**
 * Turns the panel's queued changes into outbox actions, in the order they
 * have always been sent: one `batchLineupChanges` for substitutions and
 * swaps (if any), then one action per removal, then one per addition.
 *
 * Every event gets a client-chosen ID, used both in the mutation input and
 * in the pending events, so the pending events become the confirmed ones
 * without a flicker. A swap that involves a queued substitution references
 * that substitution's incoming player by its `subInEventId`.
 */
export function buildQueuedActions(
  queue: QueuedItem[],
  { gameTeamId, period, periodSecond, trackPositions }: QueuedActionContext,
): RecordActionInput[] {
  const subs = queue.filter(
    (q): q is QueuedOf<'substitution'> => q.type === 'substitution',
  );
  const swaps = queue.filter((q): q is QueuedOf<'swap'> => q.type === 'swap');
  const removals = queue.filter(
    (q): q is QueuedOf<'removal'> => q.type === 'removal',
  );
  const additions = queue.filter(
    (q): q is QueuedOf<'addition'> => q.type === 'addition',
  );

  const actions: RecordActionInput[] = [];
  const stampFor = (occurredAt: string) => ({
    gameTeamId,
    period,
    periodSecond,
    createdAt: occurredAt,
  });

  if (subs.length > 0 || swaps.length > 0) {
    const actionId = crypto.randomUUID();
    const occurredAt = new Date().toISOString();
    const stamp = stampFor(occurredAt);
    const pendingEvents: PendingEvent[] = [];

    const subIds = new Map<string, { out: string; in: string }>();
    const subsById = new Map<string, QueuedOf<'substitution'>>();
    for (const sub of subs) {
      subIds.set(sub.id, { out: crypto.randomUUID(), in: crypto.randomUUID() });
      subsById.set(sub.id, sub);
    }

    const substitutions: BatchSubstitutionInput[] = subs.map((sub) => {
      const ids = subIds.get(sub.id) as { out: string; in: string };
      pendingEvents.push(
        ...substitutionEvents(stamp, sub.playerOut, sub.playerIn, {
          trackPositions,
          subOutEventId: ids.out,
          subInEventId: ids.in,
        }),
      );
      return {
        playerOutEventId: sub.playerOut.gameEventId,
        playerInId: sub.playerIn.playerId || undefined,
        externalPlayerInName: sub.playerIn.externalPlayerName || undefined,
        externalPlayerInNumber: sub.playerIn.externalPlayerNumber || undefined,
        subOutEventId: ids.out,
        subInEventId: ids.in,
      };
    });

    // A swap participant is on the field now, or is the incoming player of
    // a queued sub (taking the outgoing player's position).
    const swapSide = (side: SwapPlayer) => {
      if (side.source === 'onField') {
        return {
          ref: { eventId: side.gameEventId },
          player: side.player as OnFieldPlayerRef,
        };
      }
      const sub = subsById.get(side.queuedSubId);
      const ids = subIds.get(side.queuedSubId);
      if (!sub || !ids) {
        throw new Error('A swapped substitution is no longer queued');
      }
      return {
        ref: { eventId: ids.in },
        player: {
          ...sub.playerIn,
          position: sub.playerOut.position,
        } as OnFieldPlayerRef,
      };
    };

    const swapInputs: BatchSwapInput[] = swaps.map((swap) => {
      const p1 = swapSide(swap.player1);
      const p2 = swapSide(swap.player2);
      const swap1EventId = crypto.randomUUID();
      const swap2EventId = crypto.randomUUID();
      pendingEvents.push(
        ...swapEvents(stamp, p1.player, p2.player, {
          swap1EventId,
          swap2EventId,
        }),
      );
      return { player1: p1.ref, player2: p2.ref, swap1EventId, swap2EventId };
    });

    actions.push({
      actionId,
      kind: 'batchLineupChanges',
      variables: {
        input: {
          actionId,
          occurredAt,
          gameTeamId,
          period,
          periodSecond,
          substitutions,
          swaps: swapInputs,
        },
      },
      pendingEvents,
    });
  }

  for (const removal of removals) {
    const actionId = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const occurredAt = new Date().toISOString();
    actions.push({
      actionId,
      kind: 'removePlayerFromField',
      variables: {
        input: {
          actionId,
          eventId,
          occurredAt,
          gameTeamId,
          playerEventId: removal.playerOut.gameEventId,
          period,
          periodSecond,
        },
      },
      pendingEvents: removalEvents(stampFor(occurredAt), removal.playerOut, {
        trackPositions,
        eventId,
      }),
    });
  }

  for (const addition of additions) {
    const actionId = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const occurredAt = new Date().toISOString();
    const position = addition.position ?? FIELD_SENTINEL_POSITION;
    actions.push({
      actionId,
      kind: 'bringPlayerOntoField',
      variables: {
        input: {
          actionId,
          eventId,
          occurredAt,
          gameTeamId,
          playerId: addition.playerIn.playerId || undefined,
          externalPlayerName: addition.playerIn.externalPlayerName || undefined,
          externalPlayerNumber:
            addition.playerIn.externalPlayerNumber || undefined,
          position,
          period,
          periodSecond,
        },
      },
      pendingEvents: additionEvents(
        stampFor(occurredAt),
        addition.playerIn,
        position,
        { trackPositions, eventId },
      ),
    });
  }

  return actions;
}
