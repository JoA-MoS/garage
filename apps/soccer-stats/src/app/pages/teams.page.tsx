/**
 * Teams management page
 */
export const TeamsPage = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <p className="text-gray-600 mt-2">
          Manage team rosters, formations, and tactics
        </p>
      </div>

      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Team Management
        </h2>
        <p className="text-gray-600 mb-6">
          Create teams, set formations, and manage player assignments
        </p>
        <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
          Create New Team
        </button>
      </div>
    </div>
  );
};
