import { useSubscription } from '@apollo/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  GameEventChangedDocument,
  GameEventChangedSubscription,
  GameEventAction,
  GameUpdatedDocument,
  GameUpdatedSubscription,
} from '../generated/graphql';

export interface UseGameEventSubscriptionOptions {
  gameId: string;
  onEventCreated?: (
    event: NonNullable<
      GameEventChangedSubscription['gameEventChanged']['event']
    >
  ) => void;
  onEventUpdated?: (
    event: NonNullable<
      GameEventChangedSubscription['gameEventChanged']['event']
    >
  ) => void;
  onEventDeleted?: (deletedEventId: string) => void;
  onDuplicateDetected?: (
    event: NonNullable<
      GameEventChangedSubscription['gameEventChanged']['event']
    >
  ) => void;
  onConflictDetected?: (
    conflict: NonNullable<
      GameEventChangedSubscription['gameEventChanged']['conflict']
    >
  ) => void;
  onGameStateChanged?: (game: GameUpdatedSubscription['gameUpdated']) => void;
}

export function useGameEventSubscription({
  gameId,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
  onDuplicateDetected,
  onConflictDetected,
  onGameStateChanged,
}: UseGameEventSubscriptionOptions) {
  const [isEventSubConnected, setIsEventSubConnected] = useState(false);
  const [isGameSubConnected, setIsGameSubConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  // Track recently highlighted event IDs for animation
  const [highlightedEventIds, setHighlightedEventIds] = useState<Set<string>>(
    new Set()
  );

  // Use refs to avoid stale closure issues with callbacks
  const onEventCreatedRef = useRef(onEventCreated);
  const onEventUpdatedRef = useRef(onEventUpdated);
  const onEventDeletedRef = useRef(onEventDeleted);
  const onDuplicateDetectedRef = useRef(onDuplicateDetected);
  const onConflictDetectedRef = useRef(onConflictDetected);
  const onGameStateChangedRef = useRef(onGameStateChanged);

  useEffect(() => {
    onEventCreatedRef.current = onEventCreated;
    onEventUpdatedRef.current = onEventUpdated;
    onEventDeletedRef.current = onEventDeleted;
    onDuplicateDetectedRef.current = onDuplicateDetected;
    onConflictDetectedRef.current = onConflictDetected;
    onGameStateChangedRef.current = onGameStateChanged;
  }, [
    onEventCreated,
    onEventUpdated,
    onEventDeleted,
    onDuplicateDetected,
    onConflictDetected,
    onGameStateChanged,
  ]);

  // Subscribe to game events (goals, substitutions, etc.)
  const {
    data: eventData,
    loading: eventLoading,
    error: eventError,
  } = useSubscription(GameEventChangedDocument, {
    variables: { gameId },
    skip: !gameId,
    onData: ({ data: subscriptionData }) => {
      setIsEventSubConnected(true);
      setConnectionError(null);

      const payload = subscriptionData.data?.gameEventChanged;
      if (!payload) return;

      switch (payload.action) {
        case GameEventAction.Created:
          if (payload.event) {
            // Add to highlighted set for animation
            setHighlightedEventIds((prev) =>
              new Set(prev).add(payload.event!.id)
            );

            // Remove highlight after animation completes (3 seconds)
            setTimeout(() => {
              setHighlightedEventIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(payload.event!.id);
                return newSet;
              });
            }, 3000);

            onEventCreatedRef.current?.(payload.event);
          }
          break;

        case GameEventAction.Updated:
          if (payload.event) {
            onEventUpdatedRef.current?.(payload.event);
          }
          break;

        case GameEventAction.Deleted:
          if (payload.deletedEventId) {
            onEventDeletedRef.current?.(payload.deletedEventId);
          }
          break;

        case GameEventAction.DuplicateDetected:
          if (payload.event) {
            onDuplicateDetectedRef.current?.(payload.event);
          }
          break;

        case GameEventAction.ConflictDetected:
          if (payload.conflict) {
            onConflictDetectedRef.current?.(payload.conflict);
          }
          break;
      }
    },
    onComplete: () => {
      setIsEventSubConnected(false);
    },
  });

  // Subscribe to game state changes (start, pause, half-time, end, reset)
  const {
    data: gameData,
    loading: gameLoading,
    error: gameError,
  } = useSubscription(GameUpdatedDocument, {
    variables: { gameId },
    skip: !gameId,
    onData: ({ data: subscriptionData }) => {
      setIsGameSubConnected(true);

      const game = subscriptionData.data?.gameUpdated;
      if (game) {
        onGameStateChangedRef.current?.(game);
      }
    },
    onComplete: () => {
      setIsGameSubConnected(false);
    },
  });

  // Handle connection errors from either subscription
  useEffect(() => {
    const err = eventError || gameError;
    if (err) {
      setConnectionError(err);
    }
  }, [eventError, gameError]);

  // Check if an event should be highlighted
  const isEventHighlighted = useCallback(
    (eventId: string) => highlightedEventIds.has(eventId),
    [highlightedEventIds]
  );

  // Combined connection status - connected if at least one subscription is active
  const isConnected = isEventSubConnected || isGameSubConnected;
  const loading = eventLoading || gameLoading;

  return {
    // Subscription state
    isConnected,
    loading,
    error: connectionError,

    // Latest payload data
    latestEventPayload: eventData?.gameEventChanged,
    latestGameUpdate: gameData?.gameUpdated,

    // Highlight tracking for animations
    highlightedEventIds,
    isEventHighlighted,
  };
}
