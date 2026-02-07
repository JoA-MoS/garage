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

  private get gameTeamsRepository() {
    return this.coreService.gameTeamsRepository;
  }

  async recordGoal(
    input: RecordGoalInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
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

    // Increment the team's score (handle null case)
    const currentGameTeam = await this.gameTeamsRepository.findOne({
      where: { id: input.gameTeamId },
    });
    if (currentGameTeam) {
      await this.gameTeamsRepository.update(
        { id: input.gameTeamId },
        { finalScore: (currentGameTeam.finalScore ?? 0) + 1 },
      );
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

    // Decrement the team's score
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameEvent.gameTeamId },
    });
    if (gameTeam && (gameTeam.finalScore ?? 0) > 0) {
      await this.gameTeamsRepository.update(
        { id: gameEvent.gameTeamId },
        { finalScore: (gameTeam.finalScore ?? 0) - 1 },
      );
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
