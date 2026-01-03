import { useState } from 'react';

import { TabNavigation } from '@garage/soccer-stats/ui-components';

import { ConfigTab } from '../config-tab';
import { GoalModal } from '../goal-modal';
import { OpponentGoalModal } from '../opponent-goal-modal';
import { GamesListComposition } from '../composition/games-list.composition';

import { useGameManager } from './game-manager.smart';
import { GameHeaderSmart } from './game-header.smart';
import { HistoryTabSmart } from './history-tab.smart';
import { LineupTabSmart } from './lineup-tab.smart';
import { RosterViewSmart } from './roster-view.smart';
import { SubstitutionsTabSmart } from './substitutions-tab.smart';
import { StatsTabSmart } from './stats-tab.smart';

type AppView = 'game' | 'games-list';

/**
 * Main smart component that orchestrates all other smart components and manages the overall game state
 * This replaces the original SoccerStatsTracker component
 */
export const SoccerStatsTrackerSmart = () => {
  const [currentView, setCurrentView] = useState<AppView>('game');
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

  // Render navigation header
  const renderNavigationHeader = () => (
    <div className="mb-6 border-b border-gray-200">
      <div className="flex space-x-8">
        <button
          onClick={() => setCurrentView('game')}
          className={`
            border-b-2 px-1 py-2 text-sm font-medium
            ${
              currentView === 'game'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }
          `}
        >
          Current Game
        </button>
        <button
          onClick={() => setCurrentView('games-list')}
          className={`
            border-b-2 px-1 py-2 text-sm font-medium
            ${
              currentView === 'games-list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }
          `}
        >
          All Games
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl rounded-lg bg-white p-6 shadow-lg">
      {renderNavigationHeader()}

      {currentView === 'games-list' ? (
        <GamesListComposition />
      ) : (
        <>
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

              <TabNavigation
                activeTab={activeTab}
                homeTeamName={gameConfig.homeTeamName}
                awayTeamName={gameConfig.awayTeamName}
                onTabChange={setActiveTab}
              />

              {/* Tab Content */}
              {(activeTab === 'home' || activeTab === 'away') && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
        </>
      )}
    </div>
  );
};
