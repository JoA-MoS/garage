import { useSubscription, gql } from '@apollo/client';
import { useEffect } from 'react';

// GraphQL Subscription Hooks for Live Updates

export const GAME_UPDATED_SUBSCRIPTION = gql`
  subscription GameUpdated($gameId: ID!) {
    gameUpdated(gameId: $gameId) {
      ... on Goal {
        id
        timestamp
        scorer {
          id
          name
          jersey
        }
        assist {
          id
          name
          jersey
        }
        team {
          id
          name
        }
      }
      ... on SubstitutionEvent {
        id
        timestamp
        playerOut {
          id
          name
          jersey
        }
        playerIn {
          id
          name
          jersey
        }
      }
      ... on ScoreUpdateEvent {
        gameId
        homeScore
        awayScore
        timestamp
      }
    }
  }
`;

export const SCORE_UPDATED_SUBSCRIPTION = gql`
  subscription ScoreUpdated($gameId: ID!) {
    scoreUpdated(gameId: $gameId) {
      gameId
      homeScore
      awayScore
      lastGoal {
        id
        scorer {
          name
          jersey
        }
        timestamp
      }
    }
  }
`;

// Custom hooks for different subscription types
export const useGameUpdates = (gameId: string) => {
  const { data, loading, error } = useSubscription(GAME_UPDATED_SUBSCRIPTION, {
    variables: { gameId },
  });

  return {
    gameEvent: data?.gameUpdated,
    loading,
    error,
  };
};

export const useScoreUpdates = (
  gameId: string,
  onScoreUpdate?: (score: any) => void
) => {
  const { data, loading, error } = useSubscription(SCORE_UPDATED_SUBSCRIPTION, {
    variables: { gameId },
  });

  useEffect(() => {
    if (data?.scoreUpdated && onScoreUpdate) {
      onScoreUpdate(data.scoreUpdated);
    }
  }, [data, onScoreUpdate]);

  return {
    scoreUpdate: data?.scoreUpdated,
    loading,
    error,
  };
};

// Integration with existing components
export const useRealTimeGameStats = (gameId: string) => {
  const { gameEvent } = useGameUpdates(gameId);

  useEffect(() => {
    if (!gameEvent) return;

    switch (gameEvent.__typename) {
      case 'Goal':
        // Update local state with new goal
        console.log('🥅 Goal scored!', gameEvent);
        // Could trigger notifications, confetti, etc.
        break;

      case 'SubstitutionEvent':
        console.log('🔄 Substitution made!', gameEvent);
        // Update player positions
        break;

      case 'ScoreUpdateEvent':
        console.log('📊 Score updated!', gameEvent);
        // Update scoreboard
        break;
    }
  }, [gameEvent]);

  return { gameEvent };
};
