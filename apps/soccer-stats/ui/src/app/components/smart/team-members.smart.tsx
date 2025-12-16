import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams } from 'react-router';

import { TeamRole } from '../../generated/graphql';
import {
  GET_TEAM_MEMBERS,
  GET_MY_ROLE_IN_TEAM,
  UPDATE_TEAM_MEMBER_ROLE,
  REMOVE_TEAM_MEMBER,
  PROMOTE_GUEST_COACH,
  ADD_TEAM_MEMBER,
  GET_ALL_USERS_FOR_MEMBER_SELECTION,
  GET_TEAM_PLAYERS_FOR_LINKING,
} from '../../services/team-members-graphql.service';
import {
  TeamMembersListPresentation,
  TeamMemberDisplay,
} from '../presentation/team-members-list.presentation';
import {
  AddTeamMemberModal,
  UserForSelection,
  PlayerForSelection,
} from '../presentation/add-team-member-modal.presentation';

export const TeamMembersSmart = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addError, setAddError] = useState<string | undefined>();
  const [addLoading, setAddLoading] = useState(false);

  // Fetch team members
  const {
    data: membersData,
    loading: membersLoading,
    error: membersError,
  } = useQuery(GET_TEAM_MEMBERS, {
    variables: { teamId: teamId! },
    skip: !teamId,
  });

  // Fetch current user's role
  const { data: myRoleData } = useQuery(GET_MY_ROLE_IN_TEAM, {
    variables: { teamId: teamId! },
    skip: !teamId,
  });

  // Fetch all users for selection (only when modal is open)
  const { data: usersData } = useQuery(GET_ALL_USERS_FOR_MEMBER_SELECTION, {
    skip: !isAddModalOpen,
  });

  // Fetch team players for parent/fan linking (only when modal is open)
  const { data: playersData } = useQuery(GET_TEAM_PLAYERS_FOR_LINKING, {
    variables: { teamId: teamId! },
    skip: !isAddModalOpen || !teamId,
  });

  // Mutations
  const [updateRole] = useMutation(UPDATE_TEAM_MEMBER_ROLE, {
    refetchQueries: [{ query: GET_TEAM_MEMBERS, variables: { teamId } }],
  });

  const [removeMember] = useMutation(REMOVE_TEAM_MEMBER, {
    refetchQueries: [{ query: GET_TEAM_MEMBERS, variables: { teamId } }],
  });

  const [promoteGuest] = useMutation(PROMOTE_GUEST_COACH, {
    refetchQueries: [{ query: GET_TEAM_MEMBERS, variables: { teamId } }],
  });

  const [addMember] = useMutation(ADD_TEAM_MEMBER, {
    refetchQueries: [{ query: GET_TEAM_MEMBERS, variables: { teamId } }],
  });

  // Handlers
  const handleUpdateRole = useCallback(
    async (membershipId: string, newRole: string) => {
      try {
        await updateRole({
          variables: { membershipId, newRole: newRole as TeamRole },
        });
      } catch (err) {
        console.error('Error updating role:', err);
      }
    },
    [updateRole]
  );

  const handleRemoveMember = useCallback(
    async (membershipId: string) => {
      if (
        !window.confirm(
          'Are you sure you want to remove this member from the team?'
        )
      ) {
        return;
      }
      try {
        await removeMember({
          variables: { membershipId },
        });
      } catch (err) {
        console.error('Error removing member:', err);
      }
    },
    [removeMember]
  );

  const handlePromoteGuest = useCallback(
    async (membershipId: string) => {
      try {
        await promoteGuest({
          variables: { membershipId },
        });
      } catch (err) {
        console.error('Error promoting guest:', err);
      }
    },
    [promoteGuest]
  );

  const handleOpenAddModal = useCallback(() => {
    setAddError(undefined);
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setAddError(undefined);
  }, []);

  const handleAddMember = useCallback(
    async (
      userId: string,
      role: string,
      linkedPlayerId?: string,
      isGuest?: boolean
    ) => {
      setAddLoading(true);
      setAddError(undefined);
      try {
        await addMember({
          variables: {
            teamId: teamId!,
            userId,
            role: role as TeamRole,
            linkedPlayerId,
            isGuest,
          },
        });
        setIsAddModalOpen(false);
      } catch (err) {
        console.error('Error adding member:', err);
        setAddError(
          err instanceof Error ? err.message : 'Failed to add member'
        );
      } finally {
        setAddLoading(false);
      }
    },
    [addMember, teamId]
  );

  // Map data to display format
  const members: TeamMemberDisplay[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (membersData?.teamMembers as any[])?.map((member) => ({
      id: member.id,
      role: member.role,
      isGuest: member.isGuest ?? false,
      invitedAt: member.invitedAt,
      acceptedAt: member.acceptedAt,
      user: {
        id: member.user.id,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
      },
      linkedPlayer: member.linkedPlayer
        ? {
            id: member.linkedPlayer.id,
            firstName: member.linkedPlayer.firstName,
            lastName: member.linkedPlayer.lastName,
          }
        : null,
    })) ?? [];

  // Filter out users who are already team members
  const existingMemberUserIds = new Set(members.map((m) => m.user.id));
  const availableUsers: UserForSelection[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (usersData?.users as any[])
      ?.filter((user) => !existingMemberUserIds.has(user.id))
      .map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })) ?? [];

  // Map team players for linking
  const teamPlayers: PlayerForSelection[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (playersData?.playersByTeam as any[])?.map((player) => ({
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
    })) ?? [];

  const currentUserRole = myRoleData?.myRoleInTeam?.role ?? 'PLAYER';

  return (
    <>
      <TeamMembersListPresentation
        members={members}
        currentUserRole={currentUserRole}
        loading={membersLoading}
        error={membersError?.message}
        onUpdateRole={handleUpdateRole}
        onRemoveMember={handleRemoveMember}
        onPromoteGuest={handlePromoteGuest}
        onAddMember={handleOpenAddModal}
      />

      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onConfirm={handleAddMember}
        users={availableUsers}
        teamPlayers={teamPlayers}
        currentUserRole={currentUserRole}
        loading={addLoading}
        error={addError}
      />
    </>
  );
};
