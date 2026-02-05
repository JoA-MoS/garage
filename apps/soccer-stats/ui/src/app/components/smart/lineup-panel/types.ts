import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';

/**
 * Panel visual state - matches substitution panel pattern
 */
export type PanelState = 'collapsed' | 'bench-view' | 'expanded';

/**
 * Selection direction - which type of selection was made first
 */
export type SelectionDirection = 'position-first' | 'player-first' | null;

/**
 * Currently selected state for lineup assignment
 */
export interface LineupSelection {
  direction: SelectionDirection;
  position: string | null;
  player: GqlRosterPlayer | TeamRosterPlayer | null;
  /** For player-first with roster player, tracks if it's from team roster vs game roster */
  playerSource: 'onField' | 'bench' | 'roster' | null;
}

/**
 * A queued lineup change
 */
export type QueuedLineupItem =
  | {
      id: string;
      type: 'assignment';
      position: string;
      player: GqlRosterPlayer | TeamRosterPlayer;
      playerSource: 'bench' | 'roster';
      /** If replacing someone already at this position */
      replacingPlayer?: GqlRosterPlayer;
    }
  | {
      id: string;
      type: 'position-change';
      player: GqlRosterPlayer;
      fromPosition: string;
      toPosition: string;
    }
  | {
      id: string;
      type: 'removal';
      player: GqlRosterPlayer;
      position: string;
    };

/**
 * Props for the presentation component
 */
export interface LineupPanelPresentationProps {
  // Panel state
  panelState: PanelState;
  onPanelStateChange: (state: PanelState) => void;

  // Context
  gameStatus: 'SCHEDULED' | 'HALFTIME';
  teamName: string;
  teamColor: string;
  formation: string | null;
  playersPerTeam: number;

  // Player data
  onFieldPlayers: GqlRosterPlayer[];
  benchPlayers: GqlRosterPlayer[];
  availableRoster: TeamRosterPlayer[];
  playTimeByPlayer?: Map<string, { minutes: number; isOnField: boolean }>;

  // Formation
  availableFormations: string[];
  onFormationChange: (formation: string) => void;

  // Selection state
  selection: LineupSelection;
  onPositionClick: (position: string) => void;
  onPlayerClick: (
    player: GqlRosterPlayer | TeamRosterPlayer,
    source: 'onField' | 'bench' | 'roster'
  ) => void;
  onClearSelection: () => void;

  // Queue
  queue: QueuedLineupItem[];
  onRemoveFromQueue: (queueId: string) => void;
  onConfirmAll: () => void;
  onClearQueue: () => void;

  // Quick actions (halftime only)
  onKeepSameLineup?: () => void;

  // Execution state
  isExecuting: boolean;
  executionProgress: number;
  error: string | null;

  // Positions info
  filledPositions: Set<string>;
  requiredPositions: string[];
}

/**
 * Props for the smart component
 */
export interface LineupPanelSmartProps {
  gameId: string;
  gameTeamId: string;
  gameStatus: 'SCHEDULED' | 'HALFTIME';
  teamName: string;
  teamColor: string;
  playersPerTeam: number;

  // Current lineup data (from useLineup hook)
  formation: string | null;
  onField: GqlRosterPlayer[];
  bench: GqlRosterPlayer[];
  availableRoster: TeamRosterPlayer[];

  // First half lineup for halftime comparison
  firstHalfLineup?: GqlRosterPlayer[];

  // Game events for play time calculation (halftime only)
  gameEvents?: Array<{
    id: string;
    playerId?: string | null;
    externalPlayerName?: string | null;
    eventType: { category: string; name?: string };
    period: string;
    periodSecond: number;
    childEvents?: Array<{
      playerId?: string | null;
      externalPlayerName?: string | null;
      eventType: { name: string };
    }>;
  }>;

  // Callbacks
  onLineupComplete?: () => void;
  onFormationChange: (formation: string) => void;

  // External coordination (from field visualization clicks)
  externalPositionSelection?: string | null;
  onExternalPositionHandled?: () => void;

  // Notify parent of state changes
  onQueuedPositionsChange?: (positions: Set<string>) => void;
  onSelectedPositionChange?: (position: string | null) => void;
}
