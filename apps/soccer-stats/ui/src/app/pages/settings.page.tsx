/**
 * Application settings page
 */
export const SettingsPage = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure application preferences and defaults
        </p>
      </div>

      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Game Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Default Game Duration
                </label>
                <p className="text-sm text-gray-500">
                  Default length for new games
                </p>
              </div>
              <select className="border border-gray-300 rounded-md px-3 py-2">
                <option value="90">90 minutes</option>
                <option value="80">80 minutes</option>
                <option value="70">70 minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Auto-save Games
                </label>
                <p className="text-sm text-gray-500">
                  Automatically save game progress
                </p>
              </div>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Display Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Theme
                </label>
                <p className="text-sm text-gray-500">
                  Choose your preferred color scheme
                </p>
              </div>
              <select className="border border-gray-300 rounded-md px-3 py-2">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Data Management
          </h2>
          <div className="space-y-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Export Game Data
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors ml-3">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
