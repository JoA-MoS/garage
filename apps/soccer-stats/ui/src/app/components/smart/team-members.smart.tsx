import { useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams } from 'react-router';

import { TeamRole } from '../../generated/graphql';
import {
  GET_TEAM_MEMBERS,
  GET_MY_ROLE_IN_TEAM,
  UPDATE_TEAM_MEMBER_ROLE,
  REMOVE_TEAM_MEMBER,
  PROMOTE_GUEST_COACH,
} from '../../services/team-members-graphql.service';
import {
  TeamMembersListPresentation,
  TeamMemberDisplay,
} from '../presentation/team-members-list.presentation';

export const TeamMembersSmart = () => {
  const { teamId } = useParams<{ teamId: string }>();

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

  const currentUserRole = myRoleData?.myRoleInTeam?.role ?? 'PLAYER';

  return (
    <TeamMembersListPresentation
      members={members}
      currentUserRole={currentUserRole}
      loading={membersLoading}
      error={membersError?.message}
      onUpdateRole={handleUpdateRole}
      onRemoveMember={handleRemoveMember}
      onPromoteGuest={handlePromoteGuest}
    />
  );
};
