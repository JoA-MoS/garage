/**
 * About page with application information
 */
export const AboutPage = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          About Soccer Stats Tracker
        </h1>
        <p className="text-gray-600 mt-2">Learn more about this application</p>
      </div>

      <div className="space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Soccer Stats Tracker
          </h2>
          <p className="text-gray-600">Version 1.0.0</p>
        </div>

        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            About This Application
          </h3>
          <p className="text-gray-600 mb-4">
            Soccer Stats Tracker is a comprehensive tool for tracking and
            analyzing soccer game statistics. Built with modern web
            technologies, it provides real-time game tracking, player
            statistics, and team performance analytics.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Real-time game tracking with live statistics</li>
            <li>Player performance monitoring and statistics</li>
            <li>Team lineup management and formations</li>
            <li>Game history and performance trends</li>
            <li>Advanced analytics and reporting</li>
            <li>Export capabilities for data analysis</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Technology Stack
          </h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>React 18 with TypeScript</li>
            <li>React Router for navigation</li>
            <li>Tailwind CSS for styling</li>
            <li>Vite for build tooling</li>
            <li>Nx for monorepo management</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">Support</h3>
          <p className="text-gray-600">
            For support, feature requests, or bug reports, please contact the
            development team.
          </p>
        </div>
      </div>
    </div>
  );
};
