import { Player } from '../types';

interface GoalModalProps {
  goalTeam: 'home' | 'away';
  homeTeamName: string;
  awayTeamName: string;
  availablePlayers: Player[];
  selectedScorer: string;
  selectedAssist: string;
  setSelectedScorer: (value: string) => void;
  setSelectedAssist: (value: string) => void;
  onClose: () => void;
  onRecordGoal: (scorerId: number, assistId: number | null) => void;
}

export const GoalModal = ({
  goalTeam,
  homeTeamName,
  awayTeamName,
  availablePlayers,
  selectedScorer,
  selectedAssist,
  setSelectedScorer,
  setSelectedAssist,
  onClose,
  onRecordGoal,
}: GoalModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          Record Goal for {goalTeam === 'home' ? homeTeamName : awayTeamName}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who scored? *
            </label>
            <select
              value={selectedScorer}
              onChange={(e) => setSelectedScorer(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select player...</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  #{player.jersey} {player.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who assisted? (optional)
            </label>
            <select
              value={selectedAssist}
              onChange={(e) => setSelectedAssist(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No assist / Select player...</option>
              {availablePlayers
                .filter((p) => p.id !== parseInt(selectedScorer))
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    #{player.jersey} {player.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onRecordGoal(
                parseInt(selectedScorer),
                selectedAssist ? parseInt(selectedAssist) : null
              )
            }
            disabled={!selectedScorer}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Record Goal
          </button>
        </div>
      </div>
    </div>
  );
};
