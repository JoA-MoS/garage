/**
 * Game Summary Presentation Component
 *
 * Displays a summary of a completed game including:
 * - Goals timeline with halftime marker and assists
 */

interface PlayerInfo {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

interface ChildEvent {
  id: string;
  playerId?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  player?: PlayerInfo | null;
  eventType?: {
    name: string;
  } | null;
}

interface GameEvent {
  id: string;
  createdAt: string;
  gameMinute: number;
  gameSecond: number;
  playerId?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  player?: PlayerInfo | null;
  eventType?: {
    name: string;
    category: string;
  } | null;
  childEvents?: ChildEvent[] | null;
}

interface TeamData {
  id: string;
  teamType: 'home' | 'away';
  team: {
    id: string;
    name: string;
    homePrimaryColor?: string | null;
  };
  gameEvents?: GameEvent[] | null;
}

export interface GameSummaryProps {
  /** Home team data */
  homeTeam: TeamData;
  /** Away team data */
  awayTeam: TeamData;
}

// Format time as M' (e.g., "45'" or "12:30'")
function formatEventTime(minute: number, second: number): string {
  if (second > 0) {
    return `${minute}:${second.toString().padStart(2, '0')}'`;
  }
  return `${minute}'`;
}

// Get player display name from available player identifiers
function getPlayerName(
  externalName?: string | null,
  externalNumber?: string | null,
  player?: PlayerInfo | null,
): string {
  if (externalName) return externalName;
  if (externalNumber) return `#${externalNumber}`;
  if (player) {
    const name = `${player.firstName || ''} ${player.lastName || ''}`.trim();
    return name || player.email || 'Unknown';
  }
  return 'Unknown';
}

// Timeline item type - goal or halftime marker
type TimelineItem =
  | {
      type: 'goal';
      id: string;
      createdAt: string;
      minute: number;
      second: number;
      teamName: string;
      teamColor: string;
      scorerName: string;
      assistName?: string;
    }
  | {
      type: 'halftime';
      createdAt: string;
      minute: number;
    };

// Extract timeline items from a team's game events
function extractTimelineItems(teamData: TeamData): TimelineItem[] {
  const events = teamData.gameEvents || [];
  const teamName = teamData.team.name;
  const teamColor =
    teamData.team.homePrimaryColor ||
    (teamData.teamType === 'home' ? '#3B82F6' : '#EF4444');

  const items: TimelineItem[] = [];

  for (const event of events) {
    if (event.eventType?.name === 'GOAL') {
      const assistEvent = event.childEvents?.find(
        (ce) => ce.eventType?.name === 'ASSIST',
      );
      const assistName = assistEvent
        ? getPlayerName(
            assistEvent.externalPlayerName,
            assistEvent.externalPlayerNumber,
            assistEvent.player,
          )
        : undefined;

      items.push({
        type: 'goal',
        id: event.id,
        createdAt: event.createdAt,
        minute: event.gameMinute,
        second: event.gameSecond,
        teamName,
        teamColor,
        scorerName: getPlayerName(
          event.externalPlayerName,
          event.externalPlayerNumber,
          event.player,
        ),
        assistName,
      });
    } else if (event.eventType?.name === 'HALFTIME') {
      items.push({
        type: 'halftime',
        createdAt: event.createdAt,
        minute: event.gameMinute,
      });
    }
  }

  return items;
}

// Build and sort timeline from both teams, deduplicating halftime markers
function buildSortedTimeline(
  homeTeam: TeamData,
  awayTeam: TeamData,
): TimelineItem[] {
  const allItems = [
    ...extractTimelineItems(homeTeam),
    ...extractTimelineItems(awayTeam),
  ];

  // Deduplicate halftime markers (keep only the first one)
  let hasHalftime = false;
  const deduplicatedItems = allItems.filter((item) => {
    if (item.type === 'halftime') {
      if (hasHalftime) return false;
      hasHalftime = true;
    }
    return true;
  });

  // Sort by createdAt timestamp (actual order events were recorded)
  return deduplicatedItems.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function GameSummaryPresentation({
  homeTeam,
  awayTeam,
}: GameSummaryProps) {
  const timelineItems = buildSortedTimeline(homeTeam, awayTeam);

  const hasGoals = timelineItems.some((item) => item.type === 'goal');

  return (
    <div className="space-y-4">
      {/* Goals Timeline */}
      {hasGoals && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Goals</h3>
          <div className="space-y-3">
            {timelineItems.map((item) => {
              if (item.type === 'halftime') {
                return (
                  <div key="halftime" className="flex items-center gap-3 py-2">
                    <div className="h-px flex-1 bg-gray-300" />
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Halftime
                    </span>
                    <div className="h-px flex-1 bg-gray-300" />
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span
                    className="rounded-full px-2 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: item.teamColor }}
                  >
                    {formatEventTime(item.minute, item.second)}
                  </span>
                  <span className="text-lg" role="img" aria-label="Goal">
                    ⚽
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {item.scorerName}
                    </span>
                    {item.assistName && (
                      <span className="text-xs text-gray-500">
                        Assist: {item.assistName}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    ({item.teamName})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasGoals && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
          No goals scored
        </div>
      )}
    </div>
  );
}
