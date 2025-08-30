import { ConfigTab } from '../ConfigTab';
import { StatsTab } from '../StatsTab';
import { GoalModal } from '../GoalModal';
import { TabNavigationPresentation } from '../presentation/TabNavigationPresentation';

import { useGameManager } from './GameManager';
import { GameHeaderSmart } from './GameHeaderSmart';
import { LineupTabSmart } from './LineupTabSmart';
import { SubstitutionsTabSmart } from './SubstitutionsTabSmart';

/**
 * Main smart component that orchestrates all other smart components and manages the overall game state
 * This replaces the original SoccerStatsTracker component
 */
export const SoccerStatsTrackerSmart = () => {
  const { gameData, gameActions, derivedData, defaultGameConfig } =
    useGameManager();

  const {
    gameConfig,
    homeTeam,
    awayTeam,
    gameStarted,
    gameTime,
    isGameRunning,
    activeTab,
    showGoalModal,
    goalTeam,
    selectedScorer,
    selectedAssist,
  } = gameData;

  const {
    handleTeamChange,
    loadTestData,
    clearTeams,
    addPosition,
    removePosition,
    updatePosition,
    setGameConfig,
    startGame,
    resetGame,
    toggleGame,
    setActiveTab,
    openGoalModal,
    closeGoalModal,
    recordGoal,
    updatePlayerStat,
    setSelectedScorer,
    setSelectedAssist,
    substitutePlayer,
  } = gameActions;

  const { currentTeam, availablePlayers } = derivedData;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {!gameStarted ? (
        <ConfigTab
          gameConfig={gameConfig}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          addPosition={addPosition}
          removePosition={removePosition}
          updatePosition={updatePosition}
          setGameConfig={setGameConfig}
          onTeamChange={handleTeamChange}
          startGame={startGame}
          defaultGameConfig={defaultGameConfig}
          loadTestData={loadTestData}
          clearTeams={clearTeams}
        />
      ) : (
        <>
          <GameHeaderSmart
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamName={gameConfig.homeTeamName}
            awayTeamName={gameConfig.awayTeamName}
            gameTime={gameTime}
            isGameRunning={isGameRunning}
            onToggleGame={toggleGame}
            onGoalClick={openGoalModal}
            onResetGame={resetGame}
          />

          <TabNavigationPresentation
            activeTab={activeTab}
            homeTeamName={gameConfig.homeTeamName}
            awayTeamName={gameConfig.awayTeamName}
            onTabChange={setActiveTab}
          />

          {/* Tab Content */}
          {(activeTab === 'home' || activeTab === 'away') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LineupTabSmart
                  team={currentTeam}
                  onStatUpdate={updatePlayerStat}
                />
              </div>
              <div>
                <SubstitutionsTabSmart
                  team={currentTeam}
                  gameTime={gameTime}
                  onSubstitute={substitutePlayer}
                />
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <StatsTab
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              gameTime={gameTime}
            />
          )}

          {/* Goal Modal */}
          {showGoalModal && (
            <GoalModal
              goalTeam={goalTeam}
              onClose={closeGoalModal}
              onRecordGoal={recordGoal}
              availablePlayers={availablePlayers}
              homeTeamName={gameConfig.homeTeamName}
              awayTeamName={gameConfig.awayTeamName}
              selectedScorer={selectedScorer}
              setSelectedScorer={setSelectedScorer}
              selectedAssist={selectedAssist}
              setSelectedAssist={setSelectedAssist}
            />
          )}
        </>
      )}
    </div>
  );
};
