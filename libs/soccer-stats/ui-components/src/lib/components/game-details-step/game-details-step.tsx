import { memo } from 'react';

export interface GameDetailsStepProps {
  /** Callback when game details are updated */
  onUpdateGameDetails: (details: Record<string, unknown>) => void;
}

/**
 * GameDetailsStep is a step component for the game creation wizard.
 * Currently shows a placeholder for future game details configuration.
 */
export const GameDetailsStep = memo(function GameDetailsStep({
  onUpdateGameDetails,
}: GameDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="py-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Game Details
        </h2>
        <p className="text-gray-600">
          Set up game format, venue, and other details
        </p>
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-blue-800">
            <span role="img" aria-label="construction">
              🚧
            </span>{' '}
            Game details configuration coming soon! For now, you can proceed to
            review.
          </p>
        </div>
      </div>
    </div>
  );
});
