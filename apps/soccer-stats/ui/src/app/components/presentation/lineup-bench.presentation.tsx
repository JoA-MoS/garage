import { LineupPlayer } from '@garage/soccer-stats/graphql-codegen';

import { getPlayerDisplayName, RosterPlayer } from '../../hooks/use-lineup';

interface LineupBenchProps {
  bench: LineupPlayer[];
  availableRoster: RosterPlayer[];
  onBenchPlayerClick?: (player: LineupPlayer) => void;
  onRosterPlayerClick?: (player: RosterPlayer) => void;
  onAddExternalPlayer?: () => void;
  teamColor?: string;
  isManaged?: boolean;
  disabled?: boolean;
}

export function LineupBench({
  bench,
  availableRoster,
  onBenchPlayerClick,
  onRosterPlayerClick,
  onAddExternalPlayer,
  teamColor = '#3B82F6',
  isManaged = true,
  disabled = false,
}: LineupBenchProps) {
  // Filter bench to only show players not currently on field
  const benchPlayersNotOnField = bench.filter((player) => !player.isOnField);

  return (
    <div className="space-y-4">
      {/* Bench section */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-gray-700">
          Bench ({benchPlayersNotOnField.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {benchPlayersNotOnField.length === 0 ? (
            <p className="text-sm text-gray-400">No players on bench</p>
          ) : (
            benchPlayersNotOnField.map((player) => (
              <button
                key={player.gameEventId}
                onClick={() => !disabled && onBenchPlayerClick?.(player)}
                disabled={disabled}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  disabled
                    ? 'cursor-default'
                    : 'cursor-pointer hover:bg-gray-100'
                }`}
                style={{ borderColor: teamColor }}
                type="button"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                  style={{ backgroundColor: teamColor }}
                >
                  {player.externalPlayerNumber || 'B'}
                </span>
                <span className="max-w-24 truncate">
                  {getPlayerDisplayName(player)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Available roster section (for managed teams) */}
      {isManaged && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700">
            Available Roster ({availableRoster.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableRoster.length === 0 ? (
              <p className="text-sm text-gray-400">All players assigned</p>
            ) : (
              availableRoster.map((player) => (
                <button
                  key={player.id}
                  onClick={() => !disabled && onRosterPlayerClick?.(player)}
                  disabled={disabled}
                  className={`flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm transition-colors ${
                    disabled
                      ? 'cursor-default'
                      : 'cursor-pointer hover:bg-gray-100'
                  }`}
                  type="button"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-xs text-white">
                    {player.jerseyNumber || '?'}
                  </span>
                  <span className="max-w-24 truncate">
                    {player.firstName || player.lastName
                      ? `${player.firstName || ''} ${
                          player.lastName || ''
                        }`.trim()
                      : player.email || 'Unknown'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add external player button - always available for adding players to bench */}
      <div>
        <button
          onClick={() => !disabled && onAddExternalPlayer?.()}
          disabled={disabled}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50"
          type="button"
        >
          <span className="text-lg">+</span>
          {isManaged ? 'Add External Player to Bench' : 'Add Opponent Player'}
        </button>
      </div>
    </div>
  );
}

export default LineupBench;
