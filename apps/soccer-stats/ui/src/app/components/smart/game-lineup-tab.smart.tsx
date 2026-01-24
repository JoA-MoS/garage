import { useState, useCallback, memo, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';

import { CreatePlayerModal } from '@garage/soccer-stats/ui-components';
import { LineupPlayer, GameStatus } from '@garage/soccer-stats/graphql-codegen';

import { useLineup, RosterPlayer } from '../../hooks/use-lineup';
import {
  Formation,
  FormationPosition,
  getFormationsForTeamSize,
  getDefaultFormation,
  ALL_FORMATIONS,
} from '../../constants/positions';
import { FieldLineup } from '../presentation/field-lineup.presentation';
import { LineupBench } from '../presentation/lineup-bench.presentation';
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
  gameStatus?: GameStatus;
  currentGameMinute?: number;
  onFormationChange?: (formation: string, gameMinute?: number) => Promise<void>;
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
  | { type: 'create-player'; position: FormationPosition }
  | {
      type: 'reassign-positions';
      newFormation: Formation;
      playersToReassign: Array<{
        player: LineupPlayer;
        oldPosition: string;
      }>;
    };

// Helper to count position occurrences in a formation
function getPositionCounts(formation: Formation): Map<string, number> {
  const counts = new Map<string, number>();
  for (const pos of formation.positions) {
    counts.set(pos.position, (counts.get(pos.position) || 0) + 1);
  }
  return counts;
}

// Find players who need reassignment when changing formations
function findPlayersNeedingReassignment(
  currentPlayers: LineupPlayer[],
  oldFormation: Formation,
  newFormation: Formation,
): Array<{ player: LineupPlayer; oldPosition: string }> {
  const newPositionCounts = getPositionCounts(newFormation);
  const playersToReassign: Array<{
    player: LineupPlayer;
    oldPosition: string;
  }> = [];

  // Group current players by their position
  const playersByPosition = new Map<string, LineupPlayer[]>();
  for (const player of currentPlayers) {
    if (player.position) {
      const existing = playersByPosition.get(player.position) || [];
      existing.push(player);
      playersByPosition.set(player.position, existing);
    }
  }

  // Check each position group
  for (const [position, players] of playersByPosition) {
    const availableSlots = newPositionCounts.get(position) || 0;
    // If we have more players than slots, some need reassignment
    if (players.length > availableSlots) {
      // Keep the first N players (they fit), reassign the rest
      const playersToMove = players.slice(availableSlots);
      for (const player of playersToMove) {
        playersToReassign.push({ player, oldPosition: position });
      }
    }
  }

  return playersToReassign;
}

export const GameLineupTab = memo(function GameLineupTab({
  gameTeamId,
  gameId,
  teamId,
  teamName,
  teamColor = '#3B82F6',
  isManaged,
  playersPerTeam,
  gameStatus,
  currentGameMinute = 0,
  onFormationChange,
}: GameLineupTabProps) {
  const formations = getFormationsForTeamSize(playersPerTeam);
  const [selectedFormation, setSelectedFormation] = useState<Formation>(() =>
    getDefaultFormation(playersPerTeam),
  );
  const [modalMode, setModalMode] = useState<ModalMode>({ type: 'closed' });
  const [externalName, setExternalName] = useState('');
  const [externalNumber, setExternalNumber] = useState('');

  const [gameMinute, setGameMinute] = useState('0');
  const [savingFormation, setSavingFormation] = useState(false);

  // Mutations for creating new players
  const [createUser, { loading: creatingUser }] = useMutation(CREATE_USER);
  const [addPlayerToTeam, { loading: addingToTeam }] = useMutation(
    ADD_PLAYER_TO_TEAM,
    {
      refetchQueries: [{ query: GET_TEAM_BY_ID, variables: { id: teamId } }],
      awaitRefetchQueries: true,
    },
  );

  const {
    starters,
    bench,
    currentOnField,
    availableRoster,
    teamRoster,
    loading,
    mutating,
    error,
    addToLineup,
    addToBench,
    removeFromLineup,
    updatePosition,
    substitutePlayer,
    recordPositionChange,
    bringPlayerOntoField,
    refetchLineup,
    formation: savedFormation,
  } = useLineup({ gameTeamId, gameId });

  // Helper to get jersey number for a player (from roster for managed players, or externalPlayerNumber)
  const getJerseyNumber = useCallback(
    (player: LineupPlayer): string => {
      // For external players, use externalPlayerNumber
      if (player.externalPlayerNumber) {
        return player.externalPlayerNumber;
      }
      // For managed roster players, look up jersey number from roster
      if (player.playerId && teamRoster) {
        const rosterPlayer = teamRoster.find(
          (rp) => rp.oduserId === player.playerId,
        );
        if (rosterPlayer?.jerseyNumber) {
          return rosterPlayer.jerseyNumber;
        }
      }
      return '?';
    },
    [teamRoster],
  );

  // Sync local formation state with backend formation
  useEffect(() => {
    if (savedFormation) {
      const found = ALL_FORMATIONS.find(
        (f: Formation) => f.code === savedFormation,
      );
      if (found) {
        setSelectedFormation(found);
      }
    }
  }, [savedFormation]);

  // State for tracking position reassignments
  const [reassignments, setReassignments] = useState<Map<string, string>>(
    new Map(),
  );

  // Execute the actual formation change (called directly or after reassignment)
  const executeFormationChange = useCallback(
    async (formation: Formation) => {
      const isGameActive =
        gameStatus === GameStatus.InProgress ||
        gameStatus === GameStatus.FirstHalf ||
        gameStatus === GameStatus.Halftime ||
        gameStatus === GameStatus.SecondHalf;

      if (onFormationChange) {
        setSavingFormation(true);
        try {
          if (isGameActive) {
            // Mid-game: record formation change event with current game minute
            await onFormationChange(formation.code, currentGameMinute);
          } else {
            // Pre-game: just update formation without event
            await onFormationChange(formation.code);
          }
          setSelectedFormation(formation);
        } catch (err) {
          console.error('Failed to update formation:', err);
        } finally {
          setSavingFormation(false);
        }
      } else {
        // No handler - just update local state
        setSelectedFormation(formation);
      }
    },
    [gameStatus, currentGameMinute, onFormationChange],
  );

  // Handle formation selection change
  const handleFormationSelect = useCallback(
    async (formation: Formation) => {
      // Check if any players need reassignment
      const playersToReassign = findPlayersNeedingReassignment(
        currentOnField,
        selectedFormation,
        formation,
      );

      if (playersToReassign.length > 0) {
        // Show reassignment modal
        setReassignments(new Map());
        setModalMode({
          type: 'reassign-positions',
          newFormation: formation,
          playersToReassign,
        });
        return;
      }

      // No reassignment needed - proceed with formation change
      await executeFormationChange(formation);
    },
    [currentOnField, selectedFormation, executeFormationChange],
  );

  // Handle confirming position reassignments
  const handleConfirmReassignments = useCallback(async () => {
    if (modalMode.type !== 'reassign-positions') return;

    const { newFormation, playersToReassign } = modalMode;

    // Verify all players have been assigned - check each player has an entry
    const allAssigned = playersToReassign.every(({ player }) =>
      reassignments.has(player.gameEventId),
    );
    if (!allAssigned) {
      return; // Not all players assigned yet
    }

    setSavingFormation(true);
    try {
      // Update each player's position
      const isGameActive =
        gameStatus === GameStatus.InProgress ||
        gameStatus === GameStatus.FirstHalf ||
        gameStatus === GameStatus.Halftime ||
        gameStatus === GameStatus.SecondHalf;

      for (const { player } of playersToReassign) {
        const newPosition = reassignments.get(player.gameEventId);
        if (newPosition) {
          if (isGameActive) {
            // Use recordPositionChange for proper position-time tracking
            await recordPositionChange({
              playerEventId: player.gameEventId,
              newPosition,
              gameMinute: currentGameMinute,
              gameSecond: 0,
              reason: 'FORMATION_CHANGE',
            });
          } else {
            // Game not started - just update position without time tracking
            await updatePosition(player.gameEventId, newPosition);
          }
        }
      }

      // Now change the formation
      await executeFormationChange(newFormation);
      setModalMode({ type: 'closed' });
      setReassignments(new Map());
    } catch (err) {
      console.error('Failed to reassign positions:', err);
    } finally {
      setSavingFormation(false);
    }
  }, [
    modalMode,
    reassignments,
    updatePosition,
    recordPositionChange,
    executeFormationChange,
    gameStatus,
    currentGameMinute,
  ]);

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
    [],
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
    [addToLineup],
  );

  // Assign bench player to a position (move from bench to lineup)
  const handleAssignBenchPlayerToPosition = useCallback(
    async (player: LineupPlayer, position: string) => {
      const isGameActive =
        gameStatus === GameStatus.InProgress ||
        gameStatus === GameStatus.FirstHalf ||
        gameStatus === GameStatus.Halftime ||
        gameStatus === GameStatus.SecondHalf;

      try {
        if (isGameActive) {
          // During game: use bringPlayerOntoField which creates SUBSTITUTION_IN
          // without trying to remove the existing event (which may be SUBSTITUTION_OUT)
          await bringPlayerOntoField({
            playerId: player.playerId || undefined,
            externalPlayerName: player.externalPlayerName || undefined,
            externalPlayerNumber: player.externalPlayerNumber || undefined,
            position,
            gameMinute: currentGameMinute,
            gameSecond: 0,
          });
        } else {
          // Pre-game: remove from bench, then add to lineup
          await removeFromLineup(player.gameEventId);

          if (player.playerId) {
            await addToLineup({
              playerId: player.playerId,
              position,
            });
          } else {
            await addToLineup({
              externalPlayerName: player.externalPlayerName || undefined,
              externalPlayerNumber: player.externalPlayerNumber || undefined,
              position,
            });
          }
        }
        setModalMode({ type: 'closed' });
      } catch (err) {
        console.error('Failed to move bench player to lineup:', err);
      }
    },
    [
      gameStatus,
      currentGameMinute,
      bringPlayerOntoField,
      addToLineup,
      removeFromLineup,
    ],
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
    [externalName, externalNumber, addToLineup, addToBench],
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
    [addToBench],
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
    [removeFromLineup],
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
    [substitutePlayer, gameMinute],
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
      position: string,
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
    [createUser, addPlayerToTeam, teamId, addToLineup, refetchLineup],
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
                (f) => f.code === e.target.value,
              );
              if (formation) handleFormationSelect(formation);
            }}
            disabled={savingFormation || mutating}
            className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
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

                {/* Bench players - these are the players marked available for the game */}
                {bench.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Available for Game:
                    </p>
                    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                      {bench.map((player) => (
                        <button
                          key={player.gameEventId}
                          onClick={() =>
                            handleAssignBenchPlayerToPosition(
                              player,
                              modalMode.position.position,
                            )
                          }
                          className="flex items-center gap-1 rounded-full px-3 py-1 text-sm hover:opacity-80"
                          style={{
                            backgroundColor: teamColor,
                            color: 'white',
                          }}
                          type="button"
                        >
                          #{getJerseyNumber(player)}{' '}
                          {player.externalPlayerName ||
                            player.playerName ||
                            'Unknown'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Roster selection for managed teams - add directly to position */}
                {isManaged && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      {bench.length > 0
                        ? 'Or add from roster:'
                        : 'Team Roster:'}
                    </p>
                    <p className="mb-2 text-xs text-gray-500">
                      Tip: Add players to bench first to mark them as available
                      for this game
                    </p>
                    {availableRoster.length > 0 ? (
                      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                        {availableRoster.map((player) => (
                          <button
                            key={player.id}
                            onClick={() =>
                              handleAssignRosterPlayer(
                                player,
                                modalMode.position.position,
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
                        modalMode.position.position,
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
                          {getJerseyNumber(player) !== '?'
                            ? getJerseyNumber(player)
                            : 'B'}
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

            {/* Reassign positions modal */}
            {modalMode.type === 'reassign-positions' && (
              <>
                <h4 className="mb-4 text-lg font-semibold">
                  Reassign Players for {modalMode.newFormation.name}
                </h4>

                <p className="mb-4 text-sm text-gray-600">
                  The following players need new positions in the{' '}
                  {modalMode.newFormation.name} formation:
                </p>

                <div className="mb-4 space-y-3">
                  {modalMode.playersToReassign.map(
                    ({ player, oldPosition }) => {
                      const jerseyNum = getJerseyNumber(player);
                      const playerName =
                        player.externalPlayerName ||
                        player.playerName ||
                        (jerseyNum !== '?' ? `#${jerseyNum}` : 'Unknown');
                      const selectedPosition = reassignments.get(
                        player.gameEventId,
                      );

                      // Get IDs of players being reassigned (to exclude from "staying" players)
                      const reassigningPlayerIds = new Set(
                        modalMode.playersToReassign.map(
                          (p) => p.player.gameEventId,
                        ),
                      );

                      // Count positions occupied by players staying in place (not being reassigned)
                      const occupiedByStaying = new Map<string, number>();
                      for (const p of currentOnField) {
                        if (
                          p.position &&
                          !reassigningPlayerIds.has(p.gameEventId)
                        ) {
                          occupiedByStaying.set(
                            p.position,
                            (occupiedByStaying.get(p.position) || 0) + 1,
                          );
                        }
                      }

                      // Count positions selected by OTHER reassigning players (not this one)
                      const selectedByOthers = new Map<string, number>();
                      for (const [eventId, pos] of reassignments) {
                        if (eventId !== player.gameEventId) {
                          selectedByOthers.set(
                            pos,
                            (selectedByOthers.get(pos) || 0) + 1,
                          );
                        }
                      }

                      // Count total slots per position in new formation
                      const totalSlots = getPositionCounts(
                        modalMode.newFormation,
                      );

                      // Filter to positions with available slots
                      const availablePositions =
                        modalMode.newFormation.positions.filter((pos) => {
                          const total = totalSlots.get(pos.position) || 0;
                          const occupied =
                            occupiedByStaying.get(pos.position) || 0;
                          const selected =
                            selectedByOthers.get(pos.position) || 0;
                          const available = total - occupied - selected;
                          // Show if this is the player's current selection OR there are available slots
                          return (
                            selectedPosition === pos.position || available > 0
                          );
                        });

                      // Deduplicate positions (same position may appear multiple times in formation)
                      const uniquePositions = availablePositions.filter(
                        (pos, index, self) =>
                          self.findIndex((p) => p.position === pos.position) ===
                          index,
                      );

                      // Group positions by category for better UX
                      const positionsByCategory = uniquePositions.reduce(
                        (acc, pos) => {
                          const category = pos.position.includes('B')
                            ? 'Defense'
                            : pos.position.includes('M')
                              ? 'Midfield'
                              : pos.position.includes('W') ||
                                  pos.position.includes('ST') ||
                                  pos.position.includes('CF')
                                ? 'Attack'
                                : 'Other';
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(pos);
                          return acc;
                        },
                        {} as Record<string, FormationPosition[]>,
                      );

                      return (
                        <div
                          key={player.gameEventId}
                          className="rounded-lg border bg-gray-50 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium">{playerName}</span>
                            <span className="text-sm text-gray-500">
                              was: {oldPosition}
                            </span>
                          </div>
                          <select
                            value={selectedPosition || ''}
                            onChange={(e) => {
                              const newMap = new Map(reassignments);
                              if (e.target.value) {
                                newMap.set(player.gameEventId, e.target.value);
                              } else {
                                newMap.delete(player.gameEventId);
                              }
                              setReassignments(newMap);
                            }}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="">Select new position...</option>
                            {Object.entries(positionsByCategory).map(
                              ([category, positions]) => (
                                <optgroup key={category} label={category}>
                                  {positions.map((pos, idx) => (
                                    <option
                                      key={`${pos.position}-${idx}`}
                                      value={pos.position}
                                    >
                                      {pos.position}
                                    </option>
                                  ))}
                                </optgroup>
                              ),
                            )}
                          </select>
                        </div>
                      );
                    },
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleConfirmReassignments}
                    disabled={
                      savingFormation ||
                      reassignments.size !== modalMode.playersToReassign.length
                    }
                    className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                    type="button"
                  >
                    {savingFormation
                      ? 'Saving...'
                      : `Confirm (${reassignments.size}/${modalMode.playersToReassign.length} assigned)`}
                  </button>
                  <button
                    onClick={() => {
                      setModalMode({ type: 'closed' });
                      setReassignments(new Map());
                    }}
                    className="w-full rounded border px-4 py-2 text-gray-600 hover:bg-gray-50"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
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
                        modalMode.position,
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
              modalMode.position.position,
            )
          }
          loading={creatingUser || addingToTeam || mutating}
          teamColor={teamColor}
        />
      )}
    </div>
  );
});

export default GameLineupTab;
