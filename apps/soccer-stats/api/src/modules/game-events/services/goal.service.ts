import { randomUUID } from 'crypto';

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { GameEvent } from '../../../entities/game-event.entity';
import { RecordGoalInput } from '../dto/record-goal.input';
import { UpdateGoalInput } from '../dto/update-goal.input';
import { GameEventAction } from '../dto/game-event-subscription.output';
import {
  assertClientUuid,
  resolveOccurredAt,
} from '../utils/client-action.util';

import { EventCoreService } from './event-core.service';
import { ActionReceiptService } from './action-receipt.service';

/** What recordGoal's first application decided, for post-commit publishing. */
type RecordGoalOutcome =
  | { kind: 'duplicate'; goal: GameEvent }
  | { kind: 'created'; goal: GameEvent; conflictId?: string };

/**
 * Service responsible for goal recording and management operations.
 * Handles recording, updating, and deleting goals (with assists).
 */
@Injectable()
export class GoalService {
  constructor(
    private readonly coreService: EventCoreService,
    private readonly receipts: ActionReceiptService,
  ) {}

  private get gameEventsRepository() {
    return this.coreService.gameEventsRepository;
  }

  /**
   * Record a goal (and its assist). Creates GOAL plus an optional linked
   * ASSIST in one transaction.
   *
   * Duplicate/conflict detection is unchanged: a same-scorer goal within
   * the window returns the existing goal; a different-scorer goal is
   * created and flagged. It runs inside `apply`, so with `actionId` a retry
   * replays the original outcome instead of being judged against itself.
   */
  async recordGoal(
    input: RecordGoalInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    assertClientUuid(input.goalEventId, 'goalEventId');
    assertClientUuid(input.assistEventId, 'assistEventId');
    const occurredAt = resolveOccurredAt(input.occurredAt);
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);

    const { result: outcome, replayed } =
      await this.receipts.applyOnce<RecordGoalOutcome>(
        {
          actionId: input.actionId,
          gameId: gameTeam.gameId,
          recordedByUserId,
          kind: 'recordGoal',
        },
        {
          apply: async (manager) => {
            const events = manager.getRepository(GameEvent);

            const detection =
              await this.coreService.checkForDuplicateOrConflict(
                input.gameTeamId,
                'GOAL',
                input.scorerId,
                input.externalScorerName,
                input.period,
                input.periodSecond,
              );

            // Duplicate: nothing is written; the receipt points at the
            // existing goal so a retry returns it too.
            if (detection.isDuplicate && detection.existingEvent) {
              return {
                result: { kind: 'duplicate', goal: detection.existingEvent },
                eventIds: [detection.existingEvent.id],
              };
            }

            // Conflict: flag the existing goals with a shared conflictId.
            let conflictId: string | undefined;
            if (detection.isConflict && detection.conflictingEvents) {
              conflictId = randomUUID();
              for (const event of detection.conflictingEvents) {
                if (!event.conflictId) {
                  await events.update({ id: event.id }, { conflictId });
                } else {
                  // Use existing conflictId if one exists
                  conflictId = event.conflictId;
                }
              }
            }

            // insert, not save: a reused client ID must fail, not overwrite.
            const goal = events.create({
              id: input.goalEventId,
              gameId: gameTeam.gameId,
              gameTeamId: input.gameTeamId,
              eventTypeId: this.coreService.getEventTypeByName('GOAL').id,
              playerId: input.scorerId,
              externalPlayerName: input.externalScorerName,
              externalPlayerNumber: input.externalScorerNumber,
              recordedByUserId,
              period: input.period,
              periodSecond: input.periodSecond,
              occurredAt,
              conflictId,
            });
            await events.insert(goal);
            const eventIds = [goal.id];

            if (input.assisterId || input.externalAssisterName) {
              const assist = events.create({
                id: input.assistEventId,
                gameId: gameTeam.gameId,
                gameTeamId: input.gameTeamId,
                eventTypeId: this.coreService.getEventTypeByName('ASSIST').id,
                playerId: input.assisterId,
                externalPlayerName: input.externalAssisterName,
                externalPlayerNumber: input.externalAssisterNumber,
                recordedByUserId,
                period: input.period,
                periodSecond: input.periodSecond,
                occurredAt,
                parentEventId: goal.id,
              });
              await events.insert(assist);
              eventIds.push(assist.id);
            }

            return {
              result: { kind: 'created', goal, conflictId },
              eventIds,
            };
          },
          replay: async (eventIds) => {
            const [goal] = await this.receipts.loadEvents(eventIds);
            if (!goal) {
              throw new ConflictException(
                `Action ${input.actionId} was already applied; its events have since been deleted`,
              );
            }
            return { kind: 'created', goal };
          },
        },
      );

    // Publish after commit, never on a replay. Field resolvers handle
    // relation loading for subscribers.
    if (!replayed) {
      await this.publishRecordGoalOutcome(gameTeam.gameId, outcome, input);
    }

    return outcome.goal;
  }

  private async publishRecordGoalOutcome(
    gameId: string,
    outcome: RecordGoalOutcome,
    input: RecordGoalInput,
  ): Promise<void> {
    if (outcome.kind === 'duplicate') {
      // Silent sync - the event already exists
      await this.coreService.publishGameEvent(
        gameId,
        GameEventAction.DUPLICATE_DETECTED,
        outcome.goal,
      );
      return;
    }

    if (outcome.conflictId) {
      // Eager loading is needed to build the conflict info
      const allConflictingEvents = await this.gameEventsRepository.find({
        where: { conflictId: outcome.conflictId },
        relations: ['player', 'recordedByUser'],
      });
      const conflictInfo = this.coreService.buildConflictInfo(
        outcome.conflictId,
        'GOAL',
        input.period,
        input.periodSecond,
        allConflictingEvents,
      );
      await this.coreService.publishGameEvent(
        gameId,
        GameEventAction.CONFLICT_DETECTED,
        outcome.goal,
        undefined,
        conflictInfo,
      );
      return;
    }

    await this.coreService.publishGameEvent(
      gameId,
      GameEventAction.CREATED,
      outcome.goal,
    );
  }

  async updateGoal(input: UpdateGoalInput): Promise<GameEvent> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: input.gameEventId },
      relations: ['eventType', 'childEvents', 'childEvents.eventType'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${input.gameEventId} not found`);
    }

    if (gameEvent.eventType.name !== 'GOAL') {
      throw new BadRequestException(
        'Can only update GOAL events with this method',
      );
    }

    // Update goal event fields
    if (input.scorerId !== undefined) {
      gameEvent.playerId = input.scorerId || undefined;
    }
    if (input.externalScorerName !== undefined) {
      gameEvent.externalPlayerName = input.externalScorerName || undefined;
    }
    if (input.externalScorerNumber !== undefined) {
      gameEvent.externalPlayerNumber = input.externalScorerNumber || undefined;
    }
    if (input.period !== undefined) {
      gameEvent.period = input.period;
    }
    if (input.periodSecond !== undefined) {
      gameEvent.periodSecond = input.periodSecond;
    }

    await this.gameEventsRepository.save(gameEvent);

    // Handle assist event
    const existingAssist = gameEvent.childEvents?.find(
      (e) => e.eventType?.name === 'ASSIST',
    );

    const hasNewAssist = input.assisterId || input.externalAssisterName;
    const shouldClearAssist = input.clearAssist === true;

    if (shouldClearAssist && existingAssist) {
      // Remove existing assist
      await this.gameEventsRepository.remove(existingAssist);
    } else if (hasNewAssist) {
      if (existingAssist) {
        // Update existing assist
        if (input.assisterId !== undefined) {
          existingAssist.playerId = input.assisterId || undefined;
        }
        if (input.externalAssisterName !== undefined) {
          existingAssist.externalPlayerName =
            input.externalAssisterName || undefined;
        }
        if (input.externalAssisterNumber !== undefined) {
          existingAssist.externalPlayerNumber =
            input.externalAssisterNumber || undefined;
        }
        // Sync time with goal
        if (input.period !== undefined) {
          existingAssist.period = input.period;
        }
        if (input.periodSecond !== undefined) {
          existingAssist.periodSecond = input.periodSecond;
        }
        await this.gameEventsRepository.save(existingAssist);
      } else {
        // Create new assist
        const assistEventType = this.coreService.getEventTypeByName('ASSIST');
        const assistEvent = this.gameEventsRepository.create({
          gameId: gameEvent.gameId,
          gameTeamId: gameEvent.gameTeamId,
          eventTypeId: assistEventType.id,
          playerId: input.assisterId,
          externalPlayerName: input.externalAssisterName,
          externalPlayerNumber: input.externalAssisterNumber,
          recordedByUserId: gameEvent.recordedByUserId,
          // Copy timing from goal event
          period: gameEvent.period,
          periodSecond: gameEvent.periodSecond,
          parentEventId: gameEvent.id,
        });
        await this.gameEventsRepository.save(assistEvent);
      }
    }

    // Publish the update event - field resolvers handle relation loading for subscribers
    await this.coreService.publishGameEvent(
      gameEvent.gameId,
      GameEventAction.UPDATED,
      gameEvent,
    );

    // Return base entity - field resolvers handle relation loading on-demand
    return gameEvent;
  }

  async deleteGoal(gameEventId: string): Promise<boolean> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: ['eventType', 'childEvents', 'gameTeam'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    if (gameEvent.eventType.name !== 'GOAL') {
      throw new BadRequestException(
        'Can only delete GOAL events with this method',
      );
    }

    // Delete child events (e.g., ASSIST)
    if (gameEvent.childEvents && gameEvent.childEvents.length > 0) {
      await this.gameEventsRepository.remove(gameEvent.childEvents);
    }

    // Store gameId before removing the event
    const gameId = gameEvent.gameId;

    // Delete the goal event
    await this.gameEventsRepository.remove(gameEvent);

    // Publish deletion event
    await this.coreService.publishGameEvent(
      gameId,
      GameEventAction.DELETED,
      undefined,
      gameEventId,
    );

    return true;
  }
}
