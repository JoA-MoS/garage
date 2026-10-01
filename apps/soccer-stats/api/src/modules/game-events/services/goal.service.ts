import { randomUUID } from 'crypto';

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { GameEvent } from '../../../entities/game-event.entity';
import { RecordGoalInput } from '../dto/record-goal.input';
import { UpdateGoalInput } from '../dto/update-goal.input';
import { GameEventAction } from '../dto/game-event-subscription.output';

import { EventCoreService } from './event-core.service';

/**
 * Service responsible for goal recording and management operations.
 * Handles recording, updating, and deleting goals (with assists).
 */
@Injectable()
export class GoalService {
  constructor(private readonly coreService: EventCoreService) {}

  private get gameEventsRepository() {
    return this.coreService.gameEventsRepository;
  }

  /** Receipts deliberately survive event deletion: an old retry must not resurrect a goal. */
  private async recordIdempotentGoal(
    input: RecordGoalInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const actionId = input.clientActionId!;
    // Stable ordering and null normalization make transport serialization irrelevant.
    const payload = JSON.stringify(
      Object.keys(input)
        .sort()
        .map((key) => [key, input[key as keyof RecordGoalInput] ?? null]),
    );
    let replay = false;
    const goal = await this.gameEventsRepository.manager.transaction(
      async (manager) => {
        await manager.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          [actionId],
        );
        const [receipt] = await manager.query(
          'SELECT payload, result FROM goal_action_receipts WHERE "userId" = $1 AND "actionId" = $2',
          [recordedByUserId, actionId],
        );
        if (receipt) {
          replay = true;
          if (receipt.payload !== payload)
            throw new BadRequestException(
              'Action ID reused with different payload',
            );
          return Object.assign(new GameEvent(), receipt.result, {
            createdAt: new Date(receipt.result.createdAt),
            updatedAt: new Date(receipt.result.updatedAt),
          });
        }
        const repository = manager.getRepository(GameEvent);
        const common = {
          gameId: gameTeam.gameId,
          gameTeamId: input.gameTeamId,
          recordedByUserId,
          period: input.period,
          periodSecond: input.periodSecond,
        };
        // Never use save with a client-controlled primary key: it can UPDATE an
        // unrelated existing event. INSERT makes collisions fail without mutation.
        const goalEvent = repository.create({
          ...common,
          id: actionId,
          eventTypeId: this.coreService.getEventTypeByName('GOAL').id,
          playerId: input.scorerId,
          externalPlayerName: input.externalScorerName,
          externalPlayerNumber: input.externalScorerNumber,
        });
        await repository.insert(goalEvent);
        const saved = await repository.findOneByOrFail({ id: actionId });
        if (input.assisterId || input.externalAssisterName) {
          await repository.save(
            repository.create({
              ...common,
              eventTypeId: this.coreService.getEventTypeByName('ASSIST').id,
              parentEventId: saved.id,
              playerId: input.assisterId,
              externalPlayerName: input.externalAssisterName,
              externalPlayerNumber: input.externalAssisterNumber,
            }),
          );
        }
        await manager.query(
          'INSERT INTO goal_action_receipts ("userId", "actionId", payload, result) VALUES ($1, $2, $3, $4::jsonb)',
          [recordedByUserId, actionId, payload, JSON.stringify(saved)],
        );
        return saved;
      },
    );
    // Publish only new commits. Historical receipts may describe a goal that
    // was edited/deleted; replaying CREATED would resurrect it in other caches.
    // Game-scoped catch-up recovers missed pub/sub delivery.
    if (!replay)
      await this.coreService.publishGameEvent(
        gameTeam.gameId,
        GameEventAction.CREATED,
        goal,
      );
    return goal;
  }

  async recordGoal(
    input: RecordGoalInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    if (input.clientActionId) {
      try {
        return await this.recordIdempotentGoal(input, recordedByUserId);
      } catch (error) {
        // Only known permanent payload/constraint failures are terminal. Connection
        // failures, deadlocks and unknown internal errors must remain retryable.
        const code = (error as { driverError?: { code?: string } }).driverError
          ?.code;
        if (code && ['22001', '23503', '23505', '23514'].includes(code))
          throw new BadRequestException(
            'Goal could not be recorded: invalid or conflicting input. Discard it and record a corrected goal.',
          );
        throw error;
      }
    }
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const goalEventType = this.coreService.getEventTypeByName('GOAL');

    // Check for duplicate or conflict
    const detectionResult = await this.coreService.checkForDuplicateOrConflict(
      input.gameTeamId,
      'GOAL',
      input.scorerId,
      input.externalScorerName,
      input.period,
      input.periodSecond,
    );

    // If duplicate: return existing event, notify subscriber with DUPLICATE_DETECTED
    if (detectionResult.isDuplicate && detectionResult.existingEvent) {
      // Publish duplicate detection (silent sync - event already exists)
      // Field resolvers handle relation loading for subscribers
      await this.coreService.publishGameEvent(
        gameTeam.gameId,
        GameEventAction.DUPLICATE_DETECTED,
        detectionResult.existingEvent,
      );

      // Return base entity - field resolvers handle relation loading on-demand
      return detectionResult.existingEvent;
    }

    // Prepare conflictId if this is a conflict
    let conflictId: string | undefined;
    if (detectionResult.isConflict && detectionResult.conflictingEvents) {
      conflictId = randomUUID();

      // Mark existing conflicting events with the same conflictId
      for (const event of detectionResult.conflictingEvents) {
        if (!event.conflictId) {
          await this.gameEventsRepository.update(
            { id: event.id },
            { conflictId },
          );
        } else {
          // Use existing conflictId if one exists
          conflictId = event.conflictId;
        }
      }
    }

    // Create GOAL event (with conflictId if applicable)
    const goalEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: goalEventType.id,
      playerId: input.scorerId,
      externalPlayerName: input.externalScorerName,
      externalPlayerNumber: input.externalScorerNumber,
      recordedByUserId,
      period: input.period,
      periodSecond: input.periodSecond,
      conflictId,
    });

    const savedGoalEvent = await this.gameEventsRepository.save(goalEvent);

    // If assister provided, create ASSIST event linked to the goal
    if (input.assisterId || input.externalAssisterName) {
      const assistEventType = this.coreService.getEventTypeByName('ASSIST');

      const assistEvent = this.gameEventsRepository.create({
        gameId: gameTeam.gameId,
        gameTeamId: input.gameTeamId,
        eventTypeId: assistEventType.id,
        playerId: input.assisterId,
        externalPlayerName: input.externalAssisterName,
        externalPlayerNumber: input.externalAssisterNumber,
        recordedByUserId,
        period: input.period,
        periodSecond: input.periodSecond,
        parentEventId: savedGoalEvent.id,
      });

      await this.gameEventsRepository.save(assistEvent);
    }

    // Publish the event to subscribers
    // Field resolvers handle relation loading for subscribers
    if (detectionResult.isConflict && conflictId) {
      // Get all conflicting events for the conflict info
      // This eager loading is needed for building conflict info (business logic)
      const allConflictingEvents = await this.gameEventsRepository.find({
        where: { conflictId },
        relations: ['player', 'recordedByUser'],
      });

      const conflictInfo = this.coreService.buildConflictInfo(
        conflictId,
        'GOAL',
        input.period,
        input.periodSecond,
        allConflictingEvents,
      );

      await this.coreService.publishGameEvent(
        gameTeam.gameId,
        GameEventAction.CONFLICT_DETECTED,
        savedGoalEvent,
        undefined,
        conflictInfo,
      );
    } else {
      await this.coreService.publishGameEvent(
        gameTeam.gameId,
        GameEventAction.CREATED,
        savedGoalEvent,
      );
    }

    // Return base entity - field resolvers handle relation loading on-demand
    return savedGoalEvent;
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
