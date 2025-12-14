import { useState } from 'react';
import { useParams } from 'react-router';
import { useQuery, useMutation } from '@apollo/client/react';

import { GET_TEAM_BY_ID } from '../services/teams-graphql.service';
import {
  CREATE_USER,
  ADD_PLAYER_TO_TEAM,
  UPDATE_USER,
  REMOVE_PLAYER_FROM_TEAM,
} from '../services/users-graphql.service';
import { CreatePlayerModal } from '../components/presentation/create-player-modal.presentation';
import { EditPlayerModal } from '../components/presentation/edit-player-modal.presentation';
import { RemovePlayerDialog } from '../components/presentation/remove-player-dialog.presentation';

interface TeamPlayer {
  id: string;
  jerseyNumber?: string | null;
  primaryPosition?: string | null;
  isActive: boolean;
  joinedDate?: string | null;
  leftDate?: string | null;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
}

export const TeamPlayersPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<TeamPlayer | null>(null);
  const [removingPlayer, setRemovingPlayer] = useState<TeamPlayer | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data, loading, error } = useQuery(GET_TEAM_BY_ID, {
    variables: { id: teamId! },
    skip: !teamId,
  });

  const [createUser, { loading: creatingUser }] = useMutation(CREATE_USER);
  const [addPlayerToTeam, { loading: addingPlayer }] = useMutation(
    ADD_PLAYER_TO_TEAM,
    {
      refetchQueries: [{ query: GET_TEAM_BY_ID, variables: { id: teamId } }],
      awaitRefetchQueries: true,
    }
  );
  const [updateUser, { loading: updatingUser }] = useMutation(UPDATE_USER, {
    refetchQueries: [{ query: GET_TEAM_BY_ID, variables: { id: teamId } }],
    awaitRefetchQueries: true,
  });
  const [removePlayerFromTeam, { loading: removingPlayerMutation }] =
    useMutation(REMOVE_PLAYER_FROM_TEAM, {
      refetchQueries: [{ query: GET_TEAM_BY_ID, variables: { id: teamId } }],
      awaitRefetchQueries: true,
    });

  const team = data?.team;
  const teamPlayers = (team?.teamPlayers || []) as TeamPlayer[];

  const handleCreatePlayer = async (playerData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    jerseyNumber: string;
    primaryPosition: string;
  }) => {
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

      // Step 2: Add user to team
      await addPlayerToTeam({
        variables: {
          userId: newUserId,
          teamId: teamId!,
          jerseyNumber: playerData.jerseyNumber,
          primaryPosition: playerData.primaryPosition,
          joinedDate: new Date().toISOString(),
        },
      });

      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create player:', err);
      throw err;
    }
  };

  const handleUpdatePlayer = async (
    player: TeamPlayer,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      jerseyNumber?: string;
      primaryPosition?: string;
      isActive?: boolean;
    }
  ) => {
    try {
      // Update user profile if any user fields changed
      const userUpdates: Record<string, unknown> = {};
      if (updates.firstName !== undefined)
        userUpdates.firstName = updates.firstName;
      if (updates.lastName !== undefined)
        userUpdates.lastName = updates.lastName;
      if (updates.email !== undefined) userUpdates.email = updates.email;
      if (updates.phone !== undefined) userUpdates.phone = updates.phone;

      if (Object.keys(userUpdates).length > 0) {
        await updateUser({
          variables: {
            id: player.user.id,
            updateUserInput: userUpdates,
          },
        });
      }

      // Note: For team player specific fields (jersey, position, active status),
      // we would need an UPDATE_TEAM_PLAYER mutation. For now, we'll handle
      // what we can with the existing mutations.

      setEditingPlayer(null);
    } catch (err) {
      console.error('Failed to update player:', err);
      throw err;
    }
  };

  const handleRemovePlayer = async (player: TeamPlayer) => {
    try {
      await removePlayerFromTeam({
        variables: {
          userId: player.user.id,
          teamId: teamId!,
          leftDate: new Date().toISOString(),
        },
      });

      setRemovingPlayer(null);
    } catch (err) {
      console.error('Failed to remove player:', err);
      throw err;
    }
  };

  const getPlayerDisplayName = (player: TeamPlayer) => {
    if (player.user.firstName || player.user.lastName) {
      return `${player.user.firstName || ''} ${
        player.user.lastName || ''
      }`.trim();
    }
    return player.user.email || 'Unknown Player';
  };

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
        Error loading team: {error.message}
      </div>
    );
  }

  if (!team) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
        Team not found
      </div>
    );
  }

  const activePlayers = teamPlayers.filter((p) => p.isActive);
  const inactivePlayers = teamPlayers.filter((p) => !p.isActive);
  const displayedPlayers = showInactive ? teamPlayers : activePlayers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Roster</h2>
            <p className="mt-1 text-gray-600">
              {activePlayers.length} active player
              {activePlayers.length !== 1 ? 's' : ''}
              {inactivePlayers.length > 0 &&
                ` (${inactivePlayers.length} inactive)`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {inactivePlayers.length > 0 && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Show inactive
              </label>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <svg
                className="mr-2 h-4 w-4"
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
              Add Player
            </button>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      {teamPlayers.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No players</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding players to your team.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <svg
                className="mr-2 h-4 w-4"
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
              Add Player
            </button>
          </div>
        </div>
      ) : displayedPlayers.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <p className="text-center text-gray-500">
            No active players.{' '}
            {inactivePlayers.length > 0 &&
              'Check "Show inactive" to see inactive players.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedPlayers.map((player) => (
              <div
                key={player.id}
                className={`rounded-lg border p-4 transition-shadow hover:shadow-md ${
                  player.isActive
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Jersey Number */}
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{
                        backgroundColor: player.isActive
                          ? team.homePrimaryColor || '#3B82F6'
                          : '#9CA3AF',
                      }}
                    >
                      {player.jerseyNumber || '?'}
                    </div>
                    {/* Player Info */}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {getPlayerDisplayName(player)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {player.primaryPosition || 'No position'}
                      </p>
                      {!player.isActive && (
                        <span className="mt-1 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingPlayer(player)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit player"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setRemovingPlayer(player)}
                      className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      title="Remove player"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Additional Info */}
                <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <p>{player.user.email}</p>
                  {player.joinedDate && (
                    <p>
                      Joined: {new Date(player.joinedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Player Modal */}
      {showCreateModal && (
        <CreatePlayerModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePlayer}
          loading={creatingUser || addingPlayer}
          teamColor={team.homePrimaryColor || '#3B82F6'}
        />
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSubmit={(updates) => handleUpdatePlayer(editingPlayer, updates)}
          loading={updatingUser}
          teamColor={team.homePrimaryColor || '#3B82F6'}
        />
      )}

      {/* Remove Player Dialog */}
      {removingPlayer && (
        <RemovePlayerDialog
          playerName={getPlayerDisplayName(removingPlayer)}
          onClose={() => setRemovingPlayer(null)}
          onConfirm={() => handleRemovePlayer(removingPlayer)}
          loading={removingPlayerMutation}
        />
      )}
    </div>
  );
};
