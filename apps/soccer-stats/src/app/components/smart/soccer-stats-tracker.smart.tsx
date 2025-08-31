import { ConfigTab } from '../config-tab';
import { GoalModal } from '../goal-modal';
import { OpponentGoalModal } from '../opponent-goal-modal';
import { TabNavigationPresentation } from '../presentation/tab-navigation.presentation';
import { GameStatsService } from '../../services/game-stats.service';

import { useGameManager } from './game-manager.smart';
import { GameHeaderSmart } from './game-header.smart';
import { HistoryTabSmart } from './history-tab.smart';
import { LineupTabSmart } from './lineup-tab.smart';
import { RosterViewSmart } from './roster-view.smart';
import { SubstitutionsTabSmart } from './substitutions-tab.smart';
import { StatsTabSmart } from './stats-tab.smart';

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
    recordOpponentGoal,
    updatePlayerStat,
    setSelectedScorer,
    setSelectedAssist,
    substitutePlayer,
    saveAndNewGame,
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
            onSaveAndNewGame={saveAndNewGame}
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
                  showPhase1Stats={true}
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
            <StatsTabSmart
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              gameTime={gameTime}
            />
          )}

          {activeTab === 'roster' && (
            <RosterViewSmart
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeTeamName={gameConfig.homeTeamName}
              awayTeamName={gameConfig.awayTeamName}
            />
          )}

          {activeTab === 'history' && <HistoryTabSmart />}

          {activeTab === 'stats' && (
            <StatsTabSmart
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              gameTime={gameTime}
            />
          )}

          {/* Goal Modal */}
          {showGoalModal &&
            (() => {
              const currentTeam = goalTeam === 'home' ? homeTeam : awayTeam;
              const useDetailedTracking = currentTeam.isDetailedTracking;

              if (useDetailedTracking) {
                return (
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
                );
              } else {
                return (
                  <OpponentGoalModal
                    isOpen={true}
                    teamName={
                      goalTeam === 'home'
                        ? gameConfig.homeTeamName
                        : gameConfig.awayTeamName
                    }
                    onClose={closeGoalModal}
                    onRecordGoal={recordOpponentGoal}
                  />
                );
              }
            })()}
        </>
      )}
    </div>
  );
};
