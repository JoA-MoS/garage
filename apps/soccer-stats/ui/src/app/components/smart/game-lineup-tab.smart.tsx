import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';

import { useLineup, RosterPlayer } from '../../hooks/use-lineup';
import {
  Formation,
  FormationPosition,
  getFormationsForTeamSize,
  getDefaultFormation,
} from '../../constants/positions';
import { LineupPlayer } from '../../generated/graphql';
import { FieldLineup } from '../presentation/field-lineup.presentation';
import { LineupBench } from '../presentation/lineup-bench.presentation';
import { CreatePlayerModal } from '../presentation/create-player-modal.presentation';
import {
  CREATE_USER,
  ADD_PLAYER_TO_TEAM,
} from '../../services/users-graphql.service';
import { GET_TEAM_BY_ID } from '../../services/teams-graphql.service';

interface GameLineupTabProps {
  gameTeamId: string;
  gameId: string;
  teamId: string;
  teamName: string;
  teamColor?: string;
  isManaged: boolean;
  playersPerTeam: number;
}

type ModalMode =
  | { type: 'closed' }
  | { type: 'assign-position'; position: FormationPosition }
  | {
      type: 'player-options';
      player: LineupPlayer;
      position?: FormationPosition;
    }
  | { type: 'add-external'; target: 'lineup' | 'bench'; position?: string }
  | {
      type: 'substitute';
      playerOut: LineupPlayer;
      position?: FormationPosition;
    }
  | { type: 'create-player'; position: FormationPosition };

export function GameLineupTab({
  gameTeamId,
  gameId,
  teamId,
  teamName,
  teamColor = '#3B82F6',
  isManaged,
  playersPerTeam,
}: GameLineupTabProps) {
  const formations = getFormationsForTeamSize(playersPerTeam);
  const [selectedFormation, setSelectedFormation] = useState<Formation>(() =>
    getDefaultFormation(playersPerTeam)
  );
  const [modalMode, setModalMode] = useState<ModalMode>({ type: 'closed' });
  const [externalName, setExternalName] = useState('');
  const [externalNumber, setExternalNumber] = useState('');

  const [gameMinute, setGameMinute] = useState('0');

  // Mutations for creating new players
  const [createUser, { loading: creatingUser }] = useMutation(CREATE_USER);
  const [addPlayerToTeam, { loading: addingToTeam }] = useMutation(
    ADD_PLAYER_TO_TEAM,
    {
      refetchQueries: [{ query: GET_TEAM_BY_ID, variables: { id: teamId } }],
      awaitRefetchQueries: true,
    }
  );

  const {
    starters,
    bench,
    currentOnField,
    availableRoster,
    loading,
    mutating,
    error,
    addToLineup,
    addToBench,
    removeFromLineup,
    updatePosition,
    substitutePlayer,
    refetchLineup,
  } = useLineup({ gameTeamId, gameId });

  // Handle position click on field
  const handlePositionClick = useCallback(
    (position: FormationPosition, assignedPlayer?: LineupPlayer) => {
      if (assignedPlayer) {
        setModalMode({
          type: 'player-options',
          player: assignedPlayer,
          position,
        });
      } else {
        setModalMode({ type: 'assign-position', position });
      }
    },
    []
  );

  // Assign roster player to a position
  const handleAssignRosterPlayer = useCallback(
    async (player: RosterPlayer, position: string) => {
      try {
        await addToLineup({
          playerId: player.oduserId,
          position,
        });
        setModalMode({ type: 'closed' });
      } catch (err) {
        console.error('Failed to add player to lineup:', err);
      }
    },
    [addToLineup]
  );

  // Add external player
  const handleAddExternalPlayer = useCallback(
    async (target: 'lineup' | 'bench', position?: string) => {
      if (!externalName.trim()) return;

      try {
        if (target === 'lineup' && position) {
          await addToLineup({
            externalPlayerName: externalName.trim(),
            externalPlayerNumber: externalNumber.trim() || undefined,
            position,
          });
        } else {
          await addToBench({
            externalPlayerName: externalName.trim(),
            externalPlayerNumber: externalNumber.trim() || undefined,
          });
        }
        setExternalName('');
        setExternalNumber('');
        setModalMode({ type: 'closed' });
      } catch (err) {
        console.error('Failed to add external player:', err);
      }
    },
    [externalName, externalNumber, addToLineup, addToBench]
  );

  // Add roster player to bench
  const handleAddToBench = useCallback(
    async (player: RosterPlayer) => {
      try {
        await addToBench({ playerId: player.oduserId });
      } catch (err) {
        console.error('Failed to add player to bench:', err);
      }
    },
    [addToBench]
  );

  // Remove player from lineup/bench
  const handleRemovePlayer = useCallback(
    async (gameEventId: string) => {
      try {
        await removeFromLineup(gameEventId);
        setModalMode({ type: 'closed' });
      } catch (err) {
        console.error('Failed to remove player:', err);
      }
    },
    [removeFromLineup]
  );

  // Move bench player to position
  const handleBenchPlayerClick = useCallback((player: LineupPlayer) => {
    setModalMode({ type: 'player-options', player });
  }, []);

  // Handle substitution
  const handleSubstitute = useCallback(
    async (playerOut: LineupPlayer, benchPlayer: LineupPlayer) => {
      try {
        await substitutePlayer({
          playerOutEventId: playerOut.gameEventId,
          playerInId: benchPlayer.playerId || undefined,
          externalPlayerInName: benchPlayer.externalPlayerName || undefined,
          externalPlayerInNumber: benchPlayer.externalPlayerNumber || undefined,
          gameMinute: parseInt(gameMinute, 10) || 0,
          gameSecond: 0,
        });
        setModalMode({ type: 'closed' });
        setGameMinute('0');
      } catch (err) {
        console.error('Failed to substitute player:', err);
      }
    },
    [substitutePlayer, gameMinute]
  );

  // Create new player, add to team roster, then add to lineup
  const handleCreatePlayerAndAddToLineup = useCallback(
    async (
      playerData: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        dateOfBirth?: string;
        jerseyNumber: string;
        primaryPosition: string;
      },
      position: string
    ) => {
      try {
        // Step 1: Create the user
        const userResult = await createUser({
          variables: {
            createUserInput: {
              firstName: playerData.firstName,
              lastName: playerData.lastName,
              email: playerData.email || undefined,
              phone: playerData.phone || undefined,
              dateOfBirth: playerData.dateOfBirth || undefined,
            },
          },
        });

        const newUserId = userResult.data?.createUser?.id;
        if (!newUserId) {
          throw new Error('Failed to create user');
        }

        // Step 2: Add user to team roster
        await addPlayerToTeam({
          variables: {
            userId: newUserId,
            teamId: teamId,
            jerseyNumber: playerData.jerseyNumber,
            primaryPosition: playerData.primaryPosition,
            joinedDate: new Date().toISOString(),
          },
        });

        // Step 3: Add player to lineup at the selected position
        await addToLineup({
          playerId: newUserId,
          position,
        });

        // Refetch lineup data to get the new player
        await refetchLineup();

        setModalMode({ type: 'closed' });
      } catch (err) {
        console.error('Failed to create player and add to lineup:', err);
        throw err;
      }
    },
    [createUser, addPlayerToTeam, teamId, addToLineup, refetchLineup]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        Error loading lineup: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with formation selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{teamName} Lineup</h3>
        <div className="flex items-center gap-2">
          <label htmlFor="formation-select" className="text-sm text-gray-600">
            Formation:
          </label>
          <select
            id="formation-select"
            value={selectedFormation.code}
            onChange={(e) => {
              const formation = formations.find(
                (f) => f.code === e.target.value
              );
              if (formation) setSelectedFormation(formation);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {formations.map((f) => (
              <option key={f.code} value={f.code}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Field visualization */}
      <div className="mx-auto max-w-sm">
        <FieldLineup
          formation={selectedFormation}
          lineup={currentOnField}
          onPositionClick={handlePositionClick}
          teamColor={teamColor}
          disabled={mutating}
        />
      </div>

      {/* Bench and available roster */}
      <LineupBench
        bench={bench}
        availableRoster={availableRoster}
        onBenchPlayerClick={handleBenchPlayerClick}
        onRosterPlayerClick={handleAddToBench}
        onAddExternalPlayer={() =>
          setModalMode({ type: 'add-external', target: 'bench' })
        }
        teamColor={teamColor}
        isManaged={isManaged}
        disabled={mutating}
      />

      {/* Modal for player assignment/options */}
      {modalMode.type !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-xl">
            {/* Assign position modal */}
            {modalMode.type === 'assign-position' && (
              <>
                <h4 className="mb-4 text-lg font-semibold">
                  Assign Player to {modalMode.position.position}
                </h4>

                {/* Roster selection for managed teams */}
                {isManaged && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Team Roster:
                    </p>
                    {availableRoster.length > 0 ? (
                      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                        {availableRoster.map((player) => (
                          <button
                            key={player.id}
                            onClick={() =>
                              handleAssignRosterPlayer(
                                player,
                                modalMode.position.position
                              )
                            }
                            className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
                            type="button"
                          >
                            #{player.jerseyNumber || '?'}{' '}
                            {player.firstName ||
                              player.lastName ||
                              player.email}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-gray-500">
                        No available roster players.
                      </p>
                    )}
                    {/* Add New Player button */}
                    <button
                      onClick={() =>
                        setModalMode({
                          type: 'create-player',
                          position: modalMode.position,
                        })
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                      type="button"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add New Player to Roster
                    </button>
                  </div>
                )}

                {/* External player input - always available */}
                <div className="mb-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {isManaged ? 'Or add external player:' : 'Add player:'}
                  </p>
                  <input
                    type="text"
                    placeholder="Player name"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Jersey number (optional)"
                    value={externalNumber}
                    onChange={(e) => setExternalNumber(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                  <button
                    onClick={() =>
                      handleAddExternalPlayer(
                        'lineup',
                        modalMode.position.position
                      )
                    }
                    disabled={!externalName.trim() || mutating}
                    className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                    type="button"
                  >
                    {mutating ? 'Adding...' : 'Add Player'}
                  </button>
                </div>

                <button
                  onClick={() => setModalMode({ type: 'closed' })}
                  className="w-full rounded border px-4 py-2 text-gray-600 hover:bg-gray-50"
                  type="button"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Player options modal */}
            {modalMode.type === 'player-options' && (
              <>
                <h4 className="mb-4 text-lg font-semibold">
                  {modalMode.player.externalPlayerName ||
                    modalMode.player.playerName ||
                    'Player'}
                </h4>

                <div className="space-y-2">
                  {/* Show substitute option if player is on field and there are bench players */}
                  {modalMode.player.isOnField && bench.length > 0 && (
                    <button
                      onClick={() =>
                        setModalMode({
                          type: 'substitute',
                          playerOut: modalMode.player,
                          position: modalMode.position,
                        })
                      }
                      className="w-full rounded border border-blue-300 px-4 py-2 text-blue-600 hover:bg-blue-50"
                      type="button"
                    >
                      Substitute Player
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleRemovePlayer(modalMode.player.gameEventId)
                    }
                    className="w-full rounded border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
                    type="button"
                  >
                    Remove from Lineup
                  </button>

                  <button
                    onClick={() => setModalMode({ type: 'closed' })}
                    className="w-full rounded border px-4 py-2 text-gray-600 hover:bg-gray-50"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Substitute player modal */}
            {modalMode.type === 'substitute' && (
              <>
                <h4 className="mb-4 text-lg font-semibold">
                  Substitute for{' '}
                  {modalMode.playerOut.externalPlayerName ||
                    modalMode.playerOut.playerName ||
                    'Player'}
                </h4>

                <div className="mb-4">
                  <label
                    htmlFor="game-minute"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Game Minute
                  </label>
                  <input
                    id="game-minute"
                    type="number"
                    min="0"
                    max="120"
                    value={gameMinute}
                    onChange={(e) => setGameMinute(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                    placeholder="0"
                  />
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Select substitute:
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {bench.map((player) => (
                      <button
                        key={player.gameEventId}
                        onClick={() =>
                          handleSubstitute(modalMode.playerOut, player)
                        }
                        disabled={mutating}
                        className="flex w-full items-center gap-2 rounded border px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50"
                        type="button"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm">
                          {player.externalPlayerNumber || 'B'}
                        </span>
                        <span>
                          {player.externalPlayerName ||
                            player.playerName ||
                            'Unknown Player'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setModalMode({ type: 'closed' })}
                  className="w-full rounded border px-4 py-2 text-gray-600 hover:bg-gray-50"
                  type="button"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Add external player modal */}
            {modalMode.type === 'add-external' && (
              <>
                <h4 className="mb-4 text-lg font-semibold">
                  Add {modalMode.target === 'bench' ? 'to Bench' : 'to Lineup'}
                </h4>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Player name"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Jersey number (optional)"
                    value={externalNumber}
                    onChange={(e) => setExternalNumber(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                  <button
                    onClick={() =>
                      handleAddExternalPlayer(
                        modalMode.target,
                        modalMode.position
                      )
                    }
                    disabled={!externalName.trim()}
                    className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                    type="button"
                  >
                    Add Player
                  </button>
                  <button
                    onClick={() => setModalMode({ type: 'closed' })}
                    className="w-full rounded border px-4 py-2 text-gray-600 hover:bg-gray-50"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Player Modal - rendered outside the main modal container */}
      {modalMode.type === 'create-player' && (
        <CreatePlayerModal
          onClose={() => setModalMode({ type: 'closed' })}
          onSubmit={(playerData) =>
            handleCreatePlayerAndAddToLineup(
              playerData,
              modalMode.position.position
            )
          }
          loading={creatingUser || addingToTeam || mutating}
          teamColor={teamColor}
        />
      )}
    </div>
  );
}

export default GameLineupTab;
