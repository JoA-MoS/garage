import { useState } from 'react';
import { X } from 'lucide-react';

interface OpponentGoalModalProps {
  isOpen: boolean;
  teamName: string;
  onClose: () => void;
  onRecordGoal: (scorerJersey: number, assistJersey?: number) => void;
}

export const OpponentGoalModal = ({
  isOpen,
  teamName,
  onClose,
  onRecordGoal,
}: OpponentGoalModalProps) => {
  const [scorerJersey, setScorerJersey] = useState<string>('');
  const [assistJersey, setAssistJersey] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const scorerNum = parseInt(scorerJersey);
    const assistNum = assistJersey ? parseInt(assistJersey) : undefined;

    if (!scorerNum || scorerNum < 1 || scorerNum > 99) {
      setError('Please enter a valid jersey number (1-99) for the scorer');
      return;
    }

    if (assistJersey && (!assistNum || assistNum < 1 || assistNum > 99)) {
      setError(
        'Please enter a valid jersey number (1-99) for the assist, or leave blank'
      );
      return;
    }

    if (assistNum && assistNum === scorerNum) {
      setError('Scorer and assist player cannot be the same');
      return;
    }

    onRecordGoal(scorerNum, assistNum);
    setScorerJersey('');
    setAssistJersey('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setScorerJersey('');
    setAssistJersey('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{teamName} Goal</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scorer Jersey Number *
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={scorerJersey}
              onChange={(e) => setScorerJersey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter jersey number (1-99)"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assist Jersey Number (Optional)
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={assistJersey}
              onChange={(e) => setAssistJersey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter jersey number or leave blank"
            />
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <p>
              <strong>Quick Entry:</strong> Just enter the jersey numbers you
              can see. Player names are not required for opponent tracking.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Record Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
