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
  GET_TEAMS,
  TeamsResponse,
  Team,
} from '../services/teams-graphql.service';

type GameFormState = {
  homeTeamId: string;
  awayTeamId: string;
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
    gameFormatId: '',
    duration: 60,
  });
  const [error, setError] = useState<string | null>(null);

  const {
    data: teamsData,
    loading: teamsLoading,
    error: teamsError,
  } = useQuery<TeamsResponse>(GET_TEAMS, { fetchPolicy: 'cache-first' });

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
        navigate(`/game/${data.createGame.id}`);
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
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!gameForm.homeTeamId || !gameForm.awayTeamId) {
        setError('Please select both home and away teams');
        return;
      }
      if (gameForm.homeTeamId === gameForm.awayTeamId) {
        setError('Home and away teams must be different');
        return;
      }
      if (!gameForm.gameFormatId) {
        setError('Please select a game format');
        return;
      }

      const createGameInput: CreateGameInput = {
        homeTeamId: gameForm.homeTeamId,
        awayTeamId: gameForm.awayTeamId,
        gameFormatId: gameForm.gameFormatId,
        duration: gameForm.duration,
      };

      try {
        await createGame({ variables: { createGameInput } });
      } catch (err) {
        // Catches errors that bypass onError callback (e.g., network issues before request)
        const message =
          err instanceof Error ? err.message : 'Failed to create game';
        setError(message);
      }
    },
    [gameForm, createGame]
  );

  const teams = teamsData?.teams || [];
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

  if (teams.length < 2) {
    return (
      <div className="p-4">
        <div className="mx-auto max-w-md rounded-lg bg-yellow-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-yellow-800">
            Need More Teams
          </h2>
          <p className="mb-4 text-yellow-700">
            You need at least 2 teams to create a game.
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

          {/* Home Team */}
          <div>
            <label
              htmlFor="homeTeam"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Home Team
            </label>
            <select
              id="homeTeam"
              value={gameForm.homeTeamId}
              onChange={(e) => handleFormChange('homeTeamId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select home team...</option>
              {teams.map((team: Team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Away Team */}
          <div>
            <label
              htmlFor="awayTeam"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Away Team
            </label>
            <select
              id="awayTeam"
              value={gameForm.awayTeamId}
              onChange={(e) => handleFormChange('awayTeamId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select away team...</option>
              {teams.map((team: Team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
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
              disabled={createLoading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createLoading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
