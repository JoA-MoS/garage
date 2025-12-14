/**
 * Analytics and advanced statistics page
 */
export const AnalyticsPage = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Advanced statistics, trends, and performance insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">📈</div>
          <h3 className="font-semibold text-blue-900 mb-2">
            Performance Trends
          </h3>
          <p className="text-sm text-blue-700">
            Track team and player performance over time
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">⚽</div>
          <h3 className="font-semibold text-green-900 mb-2">Goal Analytics</h3>
          <p className="text-sm text-green-700">
            Analyze scoring patterns and efficiency
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-semibold text-purple-900 mb-2">
            Position Analysis
          </h3>
          <p className="text-sm text-purple-700">
            Performance breakdown by field position
          </p>
        </div>
      </div>

      <div className="mt-8 text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Coming Soon
        </h2>
        <p className="text-gray-600">
          Advanced analytics features are in development
        </p>
      </div>
    </div>
  );
};
