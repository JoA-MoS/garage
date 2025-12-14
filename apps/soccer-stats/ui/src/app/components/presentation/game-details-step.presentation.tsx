interface GameDetailsStepProps {
  onUpdateGameDetails: (details: Record<string, unknown>) => void;
}

export const GameDetailsStep = ({
  onUpdateGameDetails,
}: GameDetailsStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Game Details
        </h2>
        <p className="text-gray-600">
          Set up game format, venue, and other details
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
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
};
