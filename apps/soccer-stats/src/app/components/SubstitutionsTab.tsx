import { AlertCircle } from 'lucide-react';

import { Player, SubstitutionRecommendation } from '../types';
import { formatTime } from '../utils';

interface SubstitutionsTabProps {
  substitutionRecommendations: SubstitutionRecommendation[];
  playersOnField: Player[];
  playersOnBench: Player[];
  onSubstitute: (playerOutId: number, playerInId: number) => void;
}

export const SubstitutionsTab = ({
  substitutionRecommendations,
  playersOnField,
  playersOnBench,
  onSubstitute,
}: SubstitutionsTabProps) => {
  return (
    <div className="space-y-6">
      {substitutionRecommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            Smart Recommendations
          </h3>
          <div className="space-y-3">
            {substitutionRecommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-orange-50 border border-orange-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-orange-800">
                      Sub: {rec.playerOut.name} → {rec.playerIn.name}
                    </p>
                    <p className="text-sm text-orange-600">{rec.reason}</p>
                  </div>
                  <button
                    onClick={() =>
                      onSubstitute(rec.playerOut.id, rec.playerIn.id)
                    }
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Make Sub
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Manual Substitutions</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 mb-4">Select a player to substitute:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Players on Field
              </h4>
              <div className="space-y-2">
                {playersOnField.map((player) => (
                  <div
                    key={player.id}
                    className="bg-white border border-gray-200 rounded p-2 flex justify-between items-center"
                  >
                    <span className="text-sm">
                      #{player.jersey} {player.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(player.playTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Players on Bench
              </h4>
              <div className="space-y-2">
                {playersOnBench.map((player) => (
                  <div
                    key={player.id}
                    className="bg-white border border-gray-200 rounded p-2 flex justify-between items-center"
                  >
                    <span className="text-sm">
                      #{player.jersey} {player.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(player.playTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
