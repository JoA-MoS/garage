import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate, Link } from 'react-router';

import {
  CREATE_GAME,
  GET_GAME_FORMATS,
  CreateGameInput,
  CreateGameResponse,
  GameFormat,
} from '../services/games-graphql.service';
import {
  GET_MANAGED_TEAMS,
  FIND_OR_CREATE_UNMANAGED_TEAM,
  Team,
} from '../services/teams-graphql.service';

type GameFormState = {
  homeTeamId: string;
  awayTeamId: string; // Used when selecting existing managed team as opponent
  opponentName: string; // Used when creating/finding unmanaged opponent
  useExistingManagedTeam: boolean; // Toggle for managed team mode
  gameFormatId: string;
  duration: number;
};

/**
 * Page for creating a new game with team selection
 */
export const CreateGamePage = () => {
  const navigate = useNavigate();
  const [gameForm, setGameForm] = useState<GameFormState>({
    homeTeamId: '',
    awayTeamId: '',
    opponentName: '',
    useExistingManagedTeam: false,
    gameFormatId: '',
    duration: 60,
  });
  const [error, setError] = useState<string | null>(null);

  const {
    data: managedTeamsData,
    loading: teamsLoading,
    error: teamsError,
  } = useQuery<{ managedTeams: Team[] }>(GET_MANAGED_TEAMS, {
    fetchPolicy: 'cache-first',
  });

  // Mutation to find or create unmanaged opponent team
  const [findOrCreateUnmanagedTeam, { loading: opponentLoading }] =
    useMutation<{
      findOrCreateUnmanagedTeam: Team;
    }>(FIND_OR_CREATE_UNMANAGED_TEAM);

  const {
    data: gameFormatsData,
    loading: gameFormatsLoading,
    error: gameFormatsError,
  } = useQuery<{ gameFormats: GameFormat[] }>(GET_GAME_FORMATS, {
    fetchPolicy: 'cache-first',
  });

  // Create game mutation
  const [createGame, { loading: createLoading }] =
    useMutation<CreateGameResponse>(CREATE_GAME, {
      onCompleted: (data: CreateGameResponse) => {
        navigate(`/games/${data.createGame.id}`);
      },
      onError: (err) => {
        setError(err.message);
      },
      update: (cache) => {
        // Evict games from cache to force refetch when returning to games list
        cache.evict({ fieldName: 'games' });
        cache.gc();
      },
    });

  const handleFormChange = useCallback(
    <K extends keyof GameFormState>(field: K, value: GameFormState[K]) => {
      setGameForm((prev) => ({ ...prev, [field]: value }));
      setError(null);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!gameForm.homeTeamId) {
        setError('Please select your team');
        return;
      }

      // Validate opponent based on mode
      if (gameForm.useExistingManagedTeam) {
        if (!gameForm.awayTeamId) {
          setError('Please select an opponent team');
          return;
        }
        if (gameForm.homeTeamId === gameForm.awayTeamId) {
          setError('Home and away teams must be different');
          return;
        }
      } else {
        if (!gameForm.opponentName.trim()) {
          setError('Please enter opponent team name');
          return;
        }
      }

      if (!gameForm.gameFormatId) {
        setError('Please select a game format');
        return;
      }

      let awayTeamId = gameForm.awayTeamId;

      // If using unmanaged opponent mode, create/find the opponent first
      if (!gameForm.useExistingManagedTeam) {
        try {
          const opponentResult = await findOrCreateUnmanagedTeam({
            variables: {
              name: gameForm.opponentName.trim(),
            },
          });

          awayTeamId = opponentResult.data?.findOrCreateUnmanagedTeam.id ?? '';

          if (!awayTeamId) {
            setError(
              'Unexpected error creating opponent team. Please try again.',
            );
            return;
          }
        } catch (err) {
          // Catches both network errors and GraphQL errors
          const message = err instanceof Error ? err.message : 'Unknown error';
          setError(
            `Failed to create opponent "${gameForm.opponentName}": ${message}`,
          );
          return;
        }
      }

      const createGameInput: CreateGameInput = {
        homeTeamId: gameForm.homeTeamId,
        awayTeamId,
        gameFormatId: gameForm.gameFormatId,
        duration: gameForm.duration,
      };

      try {
        await createGame({ variables: { createGameInput } });
      } catch (err) {
        // Catches network errors that bypass onError callback
        const message =
          err instanceof Error ? err.message : 'Failed to create game';
        setError(message);
      }
    },
    [gameForm, createGame, findOrCreateUnmanagedTeam],
  );

  const managedTeams = managedTeamsData?.managedTeams || [];
  const gameFormats = gameFormatsData?.gameFormats || [];
  const isLoading = teamsLoading || gameFormatsLoading;
  const queryError = teamsError || gameFormatsError;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="p-4">
        <div className="mx-auto max-w-md rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-800">
            Failed to Load
          </h2>
          <p className="mb-4 text-red-700">
            {queryError.message || 'Unable to load teams or game formats.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (managedTeams.length < 1) {
    return (
      <div className="p-4">
        <div className="mx-auto max-w-md rounded-lg bg-yellow-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-yellow-800">
            No Teams Found
          </h2>
          <p className="mb-4 text-yellow-700">
            You need at least one team to schedule a game.
          </p>
          <Link
            to="/teams/new"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create a Team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">New Game</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Home Team (Your Team) */}
          <div>
            <label
              htmlFor="homeTeam"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Your Team
            </label>
            <select
              id="homeTeam"
              value={gameForm.homeTeamId}
              onChange={(e) => handleFormChange('homeTeamId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select your team...</option>
              {managedTeams.map((team: Team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Opponent Team */}
          <div>
            <label
              htmlFor={gameForm.useExistingManagedTeam ? 'opponentTeam' : 'opponentName'}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Opponent
            </label>

            {!gameForm.useExistingManagedTeam ? (
              // Default: Text input for opponent name
              <div className="space-y-2">
                <input
                  type="text"
                  id="opponentName"
                  value={gameForm.opponentName}
                  onChange={(e) =>
                    handleFormChange('opponentName', e.target.value)
                  }
                  placeholder="Enter opponent team name..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleFormChange('useExistingManagedTeam', true);
                    handleFormChange('opponentName', '');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Or select from your teams
                </button>
              </div>
            ) : (
              // Alternative: Select from managed teams
              <div className="space-y-2">
                <select
                  id="opponentTeam"
                  value={gameForm.awayTeamId}
                  onChange={(e) =>
                    handleFormChange('awayTeamId', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select opponent team...</option>
                  {managedTeams.map((team: Team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    handleFormChange('useExistingManagedTeam', false);
                    handleFormChange('awayTeamId', '');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Or enter opponent name
                </button>
              </div>
            )}
          </div>

          {/* Game Format */}
          <div>
            <label
              htmlFor="gameFormat"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Game Format
            </label>
            <select
              id="gameFormat"
              value={gameForm.gameFormatId}
              onChange={(e) => handleFormChange('gameFormatId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select format...</option>
              {gameFormats.map((format: GameFormat) => (
                <option key={format.id} value={format.id}>
                  {format.name} ({format.playersPerTeam}v{format.playersPerTeam}
                  )
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              min={10}
              max={120}
              value={gameForm.duration}
              onChange={(e) =>
                handleFormChange('duration', parseInt(e.target.value, 10) || 60)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || opponentLoading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createLoading || opponentLoading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
