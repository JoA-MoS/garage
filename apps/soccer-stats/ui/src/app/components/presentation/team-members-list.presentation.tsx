import { useState } from 'react';

export interface TeamMemberDisplay {
  id: string;
  role: string;
  isGuest: boolean;
  invitedAt?: string | null;
  acceptedAt?: string | null;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  linkedPlayer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

interface TeamMembersListPresentationProps {
  members: TeamMemberDisplay[];
  currentUserRole?: string;
  loading?: boolean;
  error?: string;
  onUpdateRole?: (membershipId: string, newRole: string) => void;
  onRemoveMember?: (membershipId: string) => void;
  onPromoteGuest?: (membershipId: string) => void;
}

const ROLE_ORDER = ['OWNER', 'MANAGER', 'COACH', 'PLAYER', 'PARENT_FAN'];

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  COACH: 'Coach',
  PLAYER: 'Player',
  PARENT_FAN: 'Parent/Fan',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800 border-purple-200',
  MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  COACH: 'bg-green-100 text-green-800 border-green-200',
  PLAYER: 'bg-orange-100 text-orange-800 border-orange-200',
  PARENT_FAN: 'bg-gray-100 text-gray-800 border-gray-200',
};

const canManageRole = (viewerRole: string, targetRole: string): boolean => {
  const viewerIndex = ROLE_ORDER.indexOf(viewerRole);
  const targetIndex = ROLE_ORDER.indexOf(targetRole);
  // Can only manage roles below your own (higher index = lower rank)
  return viewerIndex < targetIndex;
};

const getAvailableRoles = (viewerRole: string): string[] => {
  const viewerIndex = ROLE_ORDER.indexOf(viewerRole);
  // Can assign roles below your own
  return ROLE_ORDER.filter((_, index) => index > viewerIndex);
};

export const TeamMembersListPresentation = ({
  members,
  currentUserRole = 'PLAYER',
  loading = false,
  error,
  onUpdateRole,
  onRemoveMember,
  onPromoteGuest,
}: TeamMembersListPresentationProps) => {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Group members by role
  const membersByRole = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = members.filter((m) => m.role === role);
    return acc;
  }, {} as Record<string, TeamMemberDisplay[]>);

  const getMemberDisplayName = (member: TeamMemberDisplay) => {
    const firstName = member.user.firstName || '';
    const lastName = member.user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || member.user.email || 'Unknown User';
  };

  const handleStartEdit = (member: TeamMemberDisplay) => {
    setEditingMemberId(member.id);
    setSelectedRole(member.role);
  };

  const handleSaveRole = (memberId: string) => {
    if (onUpdateRole && selectedRole) {
      onUpdateRole(memberId, selectedRole);
    }
    setEditingMemberId(null);
    setSelectedRole('');
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setSelectedRole('');
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Team Members
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {members.length} member{members.length !== 1 ? 's' : ''} in this
              team
            </p>
          </div>
        </div>
      </div>

      {/* Members by Role */}
      <div className="divide-y divide-gray-100">
        {ROLE_ORDER.map((role) => {
          const roleMembers = membersByRole[role];
          if (roleMembers.length === 0) return null;

          const isExpanded = expandedRole === role || expandedRole === null;

          return (
            <div key={role} className="px-6 py-4">
              {/* Role Header */}
              <button
                onClick={() =>
                  setExpandedRole(expandedRole === role ? null : role)
                }
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-medium ${ROLE_COLORS[role]}`}
                  >
                    {ROLE_LABELS[role]}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({roleMembers.length})
                  </span>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Members List */}
              {isExpanded && (
                <div className="mt-3 space-y-2">
                  {roleMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-white">
                          {(
                            member.user.firstName?.[0] ||
                            member.user.email?.[0] ||
                            '?'
                          ).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {getMemberDisplayName(member)}
                            </span>
                            {member.isGuest && (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Guest
                              </span>
                            )}
                          </div>
                          {member.user.email && (
                            <p className="text-sm text-gray-500">
                              {member.user.email}
                            </p>
                          )}
                          {member.linkedPlayer && (
                            <p className="text-xs text-gray-400">
                              Linked to: {member.linkedPlayer.firstName}{' '}
                              {member.linkedPlayer.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {editingMemberId === member.id ? (
                          <>
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              {getAvailableRoles(currentUserRole).map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleSaveRole(member.id)}
                              className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Promote Guest button */}
                            {member.isGuest &&
                              member.role === 'COACH' &&
                              onPromoteGuest &&
                              canManageRole(currentUserRole, 'COACH') && (
                                <button
                                  onClick={() => onPromoteGuest(member.id)}
                                  className="rounded border border-green-300 px-2 py-1 text-sm text-green-600 hover:bg-green-50"
                                  title="Promote to full coach"
                                >
                                  Promote
                                </button>
                              )}

                            {/* Edit Role button */}
                            {onUpdateRole &&
                              canManageRole(currentUserRole, member.role) &&
                              member.role !== 'OWNER' && (
                                <button
                                  onClick={() => handleStartEdit(member)}
                                  className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                                >
                                  Edit
                                </button>
                              )}

                            {/* Remove button */}
                            {onRemoveMember &&
                              canManageRole(currentUserRole, member.role) &&
                              member.role !== 'OWNER' && (
                                <button
                                  onClick={() => onRemoveMember(member.id)}
                                  className="rounded border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {members.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-4xl">👥</div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No team members
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            This team doesn't have any members yet.
          </p>
        </div>
      )}
    </div>
  );
};
