import { useGameHistory } from '../../hooks/use-game-history';
import { HistoryTabPresentation } from '../presentation/history-tab.presentation';

export const HistoryTabSmart = () => {
  const {
    gameHistory,
    seasonStats,
    isLoading,
    deleteGame,
    clearAllData,
    exportGameReport,
    exportSeasonReport,
    getTeamAnalytics,
  } = useGameHistory();

  const handleExportGame = (gameId: string) => {
    exportGameReport(gameId); // This now handles the download directly
  };

  const handleExportSeason = () => {
    exportSeasonReport(); // This now handles the download directly
  };

  return (
    <HistoryTabPresentation
      gameHistory={gameHistory}
      seasonStats={seasonStats}
      isLoading={isLoading}
      onDeleteGame={deleteGame}
      onExportGame={handleExportGame}
      onExportSeason={handleExportSeason}
      onClearAllData={clearAllData}
      getTeamAnalytics={getTeamAnalytics}
    />
  );
};
