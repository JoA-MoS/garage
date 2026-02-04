import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

/**
 * Panel visual state
 */
export type PanelState = 'collapsed' | 'bench-view' | 'expanded';

/**
 * Selection direction - which type of player was selected first
 */
export type SelectionDirection = 'field-first' | 'bench-first' | null;

/**
 * Currently selected player for substitution.
 * Selection order depends on direction:
 * - field-first: fieldPlayer selected first, then benchPlayer
 * - bench-first: benchPlayer selected first, then fieldPlayer
 */
export interface PlayerSelection {
  direction: SelectionDirection;
  fieldPlayer: GqlRosterPlayer | null;
  benchPlayer: GqlRosterPlayer | null;
}

/**
 * A player involved in a swap (can be on-field or incoming from queued sub)
 */
export type SwapPlayer =
  | {
      source: 'onField';
      player: GqlRosterPlayer;
      gameEventId: string;
    }
  | {
      source: 'queuedSub';
      player: GqlRosterPlayer;
      queuedSubId: string;
    };

/**
 * Queued item - either a substitution or a position swap
 */
export type QueuedItem =
  | {
      id: string;
      type: 'substitution';
      playerOut: GqlRosterPlayer;
      playerIn: GqlRosterPlayer;
    }
  | {
      id: string;
      type: 'swap';
      player1: SwapPlayer;
      player2: SwapPlayer;
    };

/**
 * Props for the presentation component
 */
export interface SubstitutionPanelPresentationProps {
  // Panel state
  panelState: PanelState;
  onPanelStateChange: (state: PanelState) => void;

  // Team info
  teamName: string;
  teamColor: string;

  // Player data
  onFieldPlayers: GqlRosterPlayer[];
  benchPlayers: GqlRosterPlayer[];
  playTimeByPlayer: Map<string, { minutes: number; isOnField: boolean }>;

  // Selection state
  selection: PlayerSelection;
  onFieldPlayerClick: (player: GqlRosterPlayer) => void;
  onBenchPlayerClick: (player: GqlRosterPlayer) => void;
  onClearSelection: () => void;

  // Queue
  queue: QueuedItem[];
  onRemoveFromQueue: (queueId: string) => void;
  onConfirmAll: () => void;

  // Execution state
  isExecuting: boolean;
  executionProgress: number;
  error: string | null;

  // Game time display
  period: string;
  periodSecond: number;
}

/**
 * Props for the smart component
 */
export interface SubstitutionPanelSmartProps {
  gameTeamId: string;
  gameId: string;
  teamName: string;
  teamColor: string;
  onField: GqlRosterPlayer[];
  bench: GqlRosterPlayer[];
  period: string;
  periodSecond: number;
  gameEvents: Array<{
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
  onSubstitutionComplete?: () => void;

  /**
   * External field player selection - when set, panel opens with this player
   * selected for replacement (field-first flow)
   */
  externalFieldPlayerSelection?: GqlRosterPlayer | null;

  /**
   * Called when the external selection has been handled (processed or cleared)
   */
  onExternalSelectionHandled?: () => void;

  /**
   * Called when bench selection changes - allows parent to know when
   * field player clicks should be routed to the panel
   */
  onBenchSelectionChange?: (benchPlayer: GqlRosterPlayer | null) => void;

  /**
   * External field player to replace - when set with an active bench selection,
   * completes the substitution (bench-first flow completion from external click)
   */
  externalFieldPlayerToReplace?: GqlRosterPlayer | null;

  /**
   * Called when the external field player to replace has been handled
   */
  onExternalFieldPlayerToReplaceHandled?: () => void;

  /**
   * Called when the set of queued player IDs changes.
   * Used to show visual indicators on field players who are already in the queue.
   */
  onQueuedPlayerIdsChange?: (queuedOutIds: Set<string>) => void;

  /**
   * Called when the selected field player changes (field-first flow).
   * Used to show a visual indicator on the field for the player being replaced.
   */
  onSelectedFieldPlayerChange?: (gameEventId: string | null) => void;
}
