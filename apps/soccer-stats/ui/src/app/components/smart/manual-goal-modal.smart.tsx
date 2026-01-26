import { useState } from 'react';
import { useMutation } from '@apollo/client/react';

import { ModalPortal } from '@garage/soccer-stats/ui-components';
import {
  LineupPlayer,
  StatsTrackingLevel,
} from '@garage/soccer-stats/graphql-codegen';

import { RECORD_GOAL } from '../../services/games-graphql.service';

interface TeamData {
  gameTeamId: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  teamType: 'home' | 'away';
  currentOnField: LineupPlayer[];
  bench: LineupPlayer[];
  statsTrackingLevel?: StatsTrackingLevel | null;
}

interface ManualGoalModalProps {
  gameId: string;
  homeTeam: TeamData;
  awayTeam: TeamData;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Get display name for a player
 */
function getPlayerDisplayName(player: LineupPlayer): string {
  if (player.playerName) {
    return player.playerName;
  }
  if (player.firstName || player.lastName) {
    return `${player.firstName || ''} ${player.lastName || ''}`.trim();
  }
  if (player.externalPlayerName) {
    return player.externalPlayerName;
  }
  return 'Unknown';
}

/**
 * Get jersey number display
 */
function getJerseyNumber(player: LineupPlayer): string {
  if (player.externalPlayerNumber) {
    return `#${player.externalPlayerNumber}`;
  }
  return '';
}

type EntryMode = 'lineup' | 'quick';

/**
 * Modal for manually adding a goal at any time (including for completed games).
 * Allows selecting which team scored, the period, exact time, and player details.
 */
export const ManualGoalModal = ({
  gameId: _gameId,
  homeTeam,
  awayTeam,
  onClose,
  onSuccess,
}: ManualGoalModalProps) => {
  // Team selection
  const [selectedTeamType, setSelectedTeamType] = useState<'home' | 'away'>(
    'home',
  );
  const selectedTeam = selectedTeamType === 'home' ? homeTeam : awayTeam;

  // Time fields
  const [period, setPeriod] = useState<'1' | '2'>('1');
  const [minute, setMinute] = useState(0);
  const [second, setSecond] = useState(0);

  // Determine tracking level from selected team
  const statsTrackingLevel = selectedTeam.statsTrackingLevel;
  const showScorerField = statsTrackingLevel !== StatsTrackingLevel.GoalsOnly;
  const showAssisterField =
    statsTrackingLevel === StatsTrackingLevel.Full || !statsTrackingLevel;

  // Player selection
  const hasLineupPlayers =
    selectedTeam.currentOnField.length > 0 || selectedTeam.bench.length > 0;
  const [entryMode, setEntryMode] = useState<EntryMode>(
    hasLineupPlayers ? 'lineup' : 'quick',
  );
  const [scorerId, setScorerId] = useState('');
  const [assisterId, setAssisterId] = useState('');
  const [quickScorerNumber, setQuickScorerNumber] = useState('');
  const [quickAssisterNumber, setQuickAssisterNumber] = useState('');

  const [error, setError] = useState<string | null>(null);

  const [recordGoal, { loading }] = useMutation(RECORD_GOAL);

  // Players available - include both on-field and bench for manual entry
  const availablePlayers = [
    ...selectedTeam.currentOnField,
    ...selectedTeam.bench,
  ];

  // Exclude selected scorer from assist options
  const assistOptions = availablePlayers.filter((p) => {
    const playerId = p.playerId || p.externalPlayerName;
    return playerId !== scorerId;
  });

  // Reset player selection when team changes
  const handleTeamChange = (teamType: 'home' | 'away') => {
    setSelectedTeamType(teamType);
    setScorerId('');
    setAssisterId('');
    setQuickScorerNumber('');
    setQuickAssisterNumber('');
    // Update entry mode based on new team's lineup
    const newTeam = teamType === 'home' ? homeTeam : awayTeam;
    const hasPlayers =
      newTeam.currentOnField.length > 0 || newTeam.bench.length > 0;
    setEntryMode(hasPlayers ? 'lineup' : 'quick');
  };

  const handleSubmit = async () => {
    setError(null);

    // Find selected players (lineup mode)
    const scorer =
      entryMode === 'lineup' && scorerId
        ? availablePlayers.find(
            (p) => (p.playerId || p.externalPlayerName) === scorerId,
          )
        : null;

    const assister =
      entryMode === 'lineup' && assisterId
        ? availablePlayers.find(
            (p) => (p.playerId || p.externalPlayerName) === assisterId,
          )
        : null;

    try {
      await recordGoal({
        variables: {
          input: {
            gameTeamId: selectedTeam.gameTeamId,
            gameMinute: minute,
            gameSecond: second,
            scorerId: scorer?.playerId || undefined,
            externalScorerName:
              scorer?.externalPlayerName ||
              (entryMode === 'quick' && quickScorerNumber
                ? `#${quickScorerNumber}`
                : undefined),
            externalScorerNumber:
              scorer?.externalPlayerNumber ||
              (entryMode === 'quick'
                ? quickScorerNumber || undefined
                : undefined),
            assisterId: assister?.playerId || undefined,
            externalAssisterName:
              assister?.externalPlayerName ||
              (entryMode === 'quick' && quickAssisterNumber
                ? `#${quickAssisterNumber}`
                : undefined),
            externalAssisterNumber:
              assister?.externalPlayerNumber ||
              (entryMode === 'quick'
                ? quickAssisterNumber || undefined
                : undefined),
          },
        },
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to record goal:', err);
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Goal</h3>
          <p className="text-sm text-gray-500">Manually record a missed goal</p>
        </div>

        {/* Team Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Which team scored? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTeamChange('home')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                selectedTeamType === 'home'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: homeTeam.teamColor }}
              />
              {homeTeam.teamName}
            </button>
            <button
              type="button"
              onClick={() => handleTeamChange('away')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                selectedTeamType === 'away'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: awayTeam.teamColor }}
              />
              {awayTeam.teamName}
            </button>
          </div>
        </div>

        {/* Period & Time */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Period <span className="text-red-500">*</span>
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as '1' | '2')}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1st Half</option>
              <option value="2">2nd Half</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Time <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="999"
                value={minute}
                onChange={(e) =>
                  setMinute(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-16 rounded-lg border border-gray-300 p-2.5 text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Min"
              />
              <span className="text-gray-500">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={second}
                onChange={(e) =>
                  setSecond(
                    Math.min(59, Math.max(0, parseInt(e.target.value) || 0)),
                  )
                }
                className="w-16 rounded-lg border border-gray-300 p-2.5 text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Sec"
              />
            </div>
          </div>
        </div>

        {/* Entry Mode Toggle */}
        {showScorerField && hasLineupPlayers && (
          <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setEntryMode('lineup')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                entryMode === 'lineup'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              From Lineup
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('quick')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                entryMode === 'quick'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quick Entry
            </button>
          </div>
        )}

        {/* Player Selection */}
        <div className="space-y-4">
          {/* Goals Only Mode */}
          {!showScorerField && (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-600">
              <p>Player tracking is disabled for this team</p>
              <p className="mt-1 text-xs text-gray-500">
                Goal will be recorded without player info
              </p>
            </div>
          )}

          {showScorerField && entryMode === 'lineup' ? (
            <>
              {/* Scorer - Lineup Mode */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Who scored?
                </label>
                <select
                  value={scorerId}
                  onChange={(e) => {
                    setScorerId(e.target.value);
                    if (e.target.value === assisterId) {
                      setAssisterId('');
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select player (optional)...</option>
                  {availablePlayers.map((player) => {
                    const id =
                      player.playerId || player.externalPlayerName || '';
                    const jersey = getJerseyNumber(player);
                    const name = getPlayerDisplayName(player);
                    const isBench = !player.isOnField;
                    return (
                      <option key={id} value={id}>
                        {jersey ? `${jersey} ` : ''}
                        {name}
                        {isBench ? ' (bench)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Assist - Lineup Mode */}
              {showAssisterField && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Who assisted? (optional)
                  </label>
                  <select
                    value={assisterId}
                    onChange={(e) => setAssisterId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No assist / Select player...</option>
                    {assistOptions.map((player) => {
                      const id =
                        player.playerId || player.externalPlayerName || '';
                      const jersey = getJerseyNumber(player);
                      const name = getPlayerDisplayName(player);
                      const isBench = !player.isOnField;
                      return (
                        <option key={id} value={id}>
                          {jersey ? `${jersey} ` : ''}
                          {name}
                          {isBench ? ' (bench)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </>
          ) : showScorerField ? (
            <>
              {/* Quick Entry Mode */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Scorer jersey number (optional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quickScorerNumber}
                  onChange={(e) =>
                    setQuickScorerNumber(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {showAssisterField && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assister jersey number (optional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quickAssisterNumber}
                    onChange={(e) =>
                      setQuickAssisterNumber(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="e.g. 7"
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? 'Recording...' : 'Add Goal'}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
