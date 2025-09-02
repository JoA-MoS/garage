/**
 * Players management page
 */
export const PlayersPage = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Players</h1>
        <p className="text-gray-600 mt-2">
          Manage player profiles and statistics
        </p>
      </div>

      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Player Management
        </h2>
        <p className="text-gray-600 mb-6">
          Create and manage player profiles, track performance across games
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Add New Player
        </button>
      </div>
    </div>
  );
};
