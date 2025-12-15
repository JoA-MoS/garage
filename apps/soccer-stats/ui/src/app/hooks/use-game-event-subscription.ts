import { useSubscription } from '@apollo/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  GameEventChangedDocument,
  GameEventChangedSubscription,
  GameEventAction,
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
}

export function useGameEventSubscription({
  gameId,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
  onDuplicateDetected,
  onConflictDetected,
}: UseGameEventSubscriptionOptions) {
  const [isConnected, setIsConnected] = useState(false);
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

  useEffect(() => {
    onEventCreatedRef.current = onEventCreated;
    onEventUpdatedRef.current = onEventUpdated;
    onEventDeletedRef.current = onEventDeleted;
    onDuplicateDetectedRef.current = onDuplicateDetected;
    onConflictDetectedRef.current = onConflictDetected;
  }, [
    onEventCreated,
    onEventUpdated,
    onEventDeleted,
    onDuplicateDetected,
    onConflictDetected,
  ]);

  const { data, loading, error } = useSubscription(GameEventChangedDocument, {
    variables: { gameId },
    skip: !gameId,
    onData: ({ data: subscriptionData }) => {
      setIsConnected(true);
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
      setIsConnected(false);
    },
  });

  // Handle connection errors
  useEffect(() => {
    if (error) {
      setConnectionError(error);
      setIsConnected(false);
    }
  }, [error]);

  // Check if an event should be highlighted
  const isEventHighlighted = useCallback(
    (eventId: string) => highlightedEventIds.has(eventId),
    [highlightedEventIds]
  );

  return {
    // Subscription state
    isConnected,
    loading,
    error: connectionError,

    // Latest payload data
    latestPayload: data?.gameEventChanged,

    // Highlight tracking for animations
    highlightedEventIds,
    isEventHighlighted,
  };
}
