import { HistoryTabSmart } from '../components/smart/history-tab.smart';

/**
 * Game history page
 */
export const HistoryPage = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Game History</h1>
        <p className="text-gray-600 mt-2">View and analyze past games</p>
      </div>

      <HistoryTabSmart />
    </div>
  );
};
