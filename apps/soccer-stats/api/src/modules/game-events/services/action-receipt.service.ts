import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';

import { AppliedAction } from '../../../entities/applied-action.entity';
import { GameEvent } from '../../../entities/game-event.entity';
import { assertClientUuid } from '../utils/client-action.util';

export interface ClientAction {
  /** Client-generated idempotency key. Omitted by clients without an outbox. */
  actionId?: string;
  gameId: string;
  recordedByUserId: string;
  /** Mutation name, stored on the receipt and checked on replay. */
  kind: string;
}

export interface ApplyOnceHandlers<T> {
  /** Writes the action's rows using `manager` so they share the transaction. */
  apply: (manager: EntityManager) => Promise<{ result: T; eventIds: string[] }>;
  /** Rebuilds the response for a retry from the recorded event IDs. */
  replay: (eventIds: string[]) => Promise<T>;
}

export interface ApplyOnceOutcome<T> {
  result: T;
  /** True when this was a retry and nothing was written. */
  replayed: boolean;
}

/**
 * Applies a client action at most once.
 *
 * In one transaction: insert the receipt with ON CONFLICT DO NOTHING, write
 * the action's rows, then record their IDs on the receipt. If a concurrent
 * request holds the same actionId, Postgres blocks the insert until that
 * transaction finishes. A committed receipt makes this request a replay; a
 * rolled-back one lets this request apply normally.
 *
 * Callers publish subscription events only when `replayed` is false: the
 * first application already published them.
 */
@Injectable()
export class ActionReceiptService {
  constructor(private readonly dataSource: DataSource) {}

  async applyOnce<T>(
    action: ClientAction,
    handlers: ApplyOnceHandlers<T>,
  ): Promise<ApplyOnceOutcome<T>> {
    assertClientUuid(action.actionId, 'actionId');

    return this.dataSource.transaction(async (manager) => {
      if (!action.actionId) {
        const { result } = await handlers.apply(manager);
        return { result, replayed: false };
      }

      const inserted: unknown[] = await manager.query(
        `INSERT INTO "applied_actions" ("actionId", "gameId", "recordedByUserId", "kind")
         VALUES ($1, $2, $3, $4)
         ON CONFLICT ("actionId") DO NOTHING
         RETURNING "actionId"`,
        [action.actionId, action.gameId, action.recordedByUserId, action.kind],
      );

      if (inserted.length === 0) {
        const receipt = await manager.findOneBy(AppliedAction, {
          actionId: action.actionId,
        });
        this.assertSameAction(action, receipt);
        return {
          result: await handlers.replay(receipt.resultEventIds),
          replayed: true,
        };
      }

      const { result, eventIds } = await handlers.apply(manager);
      await manager.update(
        AppliedAction,
        { actionId: action.actionId },
        { resultEventIds: eventIds },
      );
      return { result, replayed: false };
    });
  }

  /**
   * Loads recorded events for a replay, in the recorded order. Events
   * deleted since the action was applied are skipped.
   */
  async loadEvents(eventIds: string[]): Promise<GameEvent[]> {
    if (eventIds.length === 0) return [];
    const events = await this.dataSource
      .getRepository(GameEvent)
      .findBy({ id: In(eventIds) });
    const byId = new Map(events.map((event) => [event.id, event]));
    return eventIds.flatMap((id) => byId.get(id) ?? []);
  }

  private assertSameAction(
    action: ClientAction,
    receipt: AppliedAction | null,
  ): asserts receipt is AppliedAction {
    if (
      !receipt ||
      receipt.gameId !== action.gameId ||
      receipt.recordedByUserId !== action.recordedByUserId ||
      receipt.kind !== action.kind
    ) {
      throw new BadRequestException(
        `actionId ${action.actionId} was already used for a different action`,
      );
    }
  }
}
