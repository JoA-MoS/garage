type TeamLike = {
  id?: string | null;
  name?: string | null;
  shortName?: string | null;
};

type GameTeamLike = {
  teamType?: string | null;
  finalScore?: number | null;
  team?: TeamLike | null;
};

const normalizeTeamType = (teamType?: string | null) =>
  teamType?.trim().toLowerCase();

export const findGameTeam = <T extends GameTeamLike>(
  teams: readonly T[] | null | undefined,
  teamType: 'home' | 'away',
): T | undefined =>
  teams?.find((gameTeam) => normalizeTeamType(gameTeam.teamType) === teamType);

export const getTeamDisplayName = (
  gameTeam: GameTeamLike | null | undefined,
  fallback = 'Unassigned',
) => gameTeam?.team?.shortName || gameTeam?.team?.name || fallback;

export const formatGameDateTime = (
  value: string | Date | null | undefined,
  fallback = 'Not scheduled',
) => {
  if (!value) {
    return fallback;
  }

  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatGameDate = (
  value: string | Date | null | undefined,
  fallback = '',
) => {
  if (!value) {
    return fallback;
  }

  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};
