import { SoccerStatsTrackerSmart } from './components/smart/soccer-stats-tracker.smart';
import { ApiProvider } from './providers/api-provider';

export function App() {
  return (
    <ApiProvider>
      <div>
        <SoccerStatsTrackerSmart />
      </div>
    </ApiProvider>
  );
}

export default App;
