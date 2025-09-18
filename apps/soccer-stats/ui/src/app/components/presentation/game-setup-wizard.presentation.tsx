import { ChevronLeft, ChevronRight, Users, Calendar, Play } from 'lucide-react';

import { Team } from '../../services/teams-graphql.service';
import { Player } from '../../services/players-graphql.service';
import { GameSetupStep, SelectedTeams } from '../smart/game-setup-wizard.smart';

import { TeamSelectionStep } from './team-selection-step.presentation';
import { PlayerAssignmentStep } from './player-assignment-step.presentation';
import { GameDetailsStep } from './game-details-step.presentation';
import { GameReviewStep } from './game-review-step.presentation';

interface GameSetupWizardPresentationProps {
  currentStep: GameSetupStep;
  selectedTeams: SelectedTeams;
  managedTeams: Team[];
  availablePlayers: Player[];
  isLoading: boolean;
  canProceedFromTeams: boolean;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onSelectManagedTeam: (team: Team, side: 'home' | 'away') => void;
  onCreateOpponentTeam: (teamName: string, shortName?: string) => Promise<void>;
  onCreatePlayerForTeam: (
    teamId: string,
    firstName: string,
    lastName: string,
    jerseyNumber: number
  ) => Promise<void>;
  onCompleteGame: (gameData: Record<string, unknown>) => Promise<void>;
}

const stepConfig = {
  teams: { title: 'Select Teams', icon: Users, step: 1 },
  players: { title: 'Add Players', icon: Users, step: 2 },
  'game-details': { title: 'Game Details', icon: Calendar, step: 3 },
  review: { title: 'Review & Start', icon: Play, step: 4 },
};

export const GameSetupWizardPresentation = ({
  currentStep,
  selectedTeams,
  managedTeams,
  availablePlayers,
  isLoading,
  canProceedFromTeams,
  onNextStep,
  onPreviousStep,
  onSelectManagedTeam,
  onCreateOpponentTeam,
  onCreatePlayerForTeam,
  onCompleteGame,
}: GameSetupWizardPresentationProps) => {
  const { title, icon: Icon, step } = stepConfig[currentStep];
  const totalSteps = Object.keys(stepConfig).length;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'teams':
        return (
          <TeamSelectionStep
            selectedTeams={selectedTeams}
            managedTeams={managedTeams}
            isLoading={isLoading}
            onSelectManagedTeam={onSelectManagedTeam}
            onCreateOpponentTeam={onCreateOpponentTeam}
          />
        );
      case 'players':
        return (
          <PlayerAssignmentStep
            selectedTeams={selectedTeams}
            availablePlayers={availablePlayers}
            isLoading={isLoading}
            onCreatePlayerForTeam={onCreatePlayerForTeam}
            onUpdatePlayers={() => {
              // TODO: Implement player assignment
            }}
          />
        );
      case 'game-details':
        return (
          <GameDetailsStep
            onUpdateGameDetails={() => {
              // TODO: Implement game details
            }}
          />
        );
      case 'review':
        return (
          <GameReviewStep
            selectedTeams={selectedTeams}
            onStartGame={onCompleteGame}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'teams':
        return canProceedFromTeams;
      case 'players':
        return true; // TODO: Add validation
      case 'game-details':
        return true; // TODO: Add validation
      case 'review':
        return false; // This step uses "Start Game" instead
      default:
        return false;
    }
  };

  return (
    <div
      className="
      min-h-screen bg-gray-50

      /* Mobile-first layout */
      flex flex-col

      /* Desktop enhancement */
      lg:max-w-4xl lg:mx-auto lg:mt-8 lg:min-h-0 lg:bg-white lg:rounded-lg lg:shadow-lg
    "
    >
      {/* Header with progress indicator */}
      <div
        className="
        bg-white border-b border-gray-200 p-4

        /* Desktop styling */
        lg:rounded-t-lg lg:p-6
      "
      >
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              Step {step} of {totalSteps}
            </span>
            <span>{Math.round((step / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step title */}
        <div className="flex items-center space-x-3">
          <div
            className="
            p-2 bg-blue-100 rounded-lg

            /* Desktop enhancement */
            lg:p-3
          "
          >
            <Icon className="w-5 h-5 text-blue-600 lg:w-6 lg:h-6" />
          </div>
          <div>
            <h1
              className="
              text-xl font-bold text-gray-900

              /* Desktop enhancement */
              lg:text-2xl
            "
            >
              {title}
            </h1>
            <p className="text-sm text-gray-600 lg:text-base">
              Set up your game step by step
            </p>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div
        className="
        flex-1 p-4

        /* Desktop enhancement */
        lg:p-6
      "
      >
        {renderStepContent()}
      </div>

      {/* Navigation footer */}
      <div
        className="
        bg-white border-t border-gray-200 p-4

        /* Mobile: sticky bottom navigation */
        sticky bottom-0

        /* Desktop: rounded bottom */
        lg:rounded-b-lg lg:relative lg:p-6
      "
      >
        <div className="flex items-center justify-between">
          {/* Previous button */}
          <button
            onClick={onPreviousStep}
            disabled={step === 1}
            className="
              flex items-center space-x-2 px-4 py-2 text-gray-600 
              disabled:opacity-50 disabled:cursor-not-allowed

              /* Touch-friendly sizing */
              min-h-[44px] min-w-[44px]

              /* Hover states for desktop */
              lg:hover:text-gray-800 lg:hover:bg-gray-100 lg:rounded-md lg:transition-colors
            "
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Next/Complete button */}
          {currentStep === 'review' ? (
            <button
              onClick={() => onCompleteGame({})}
              disabled={isLoading}
              className="
                flex items-center space-x-2 px-6 py-3 bg-green-600 text-white 
                rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed

                /* Touch-friendly sizing */
                min-h-[44px]

                /* Loading state */
                disabled:bg-green-500

                /* Hover states for desktop */
                lg:hover:bg-green-700 lg:transition-colors
              "
            >
              <Play className="w-5 h-5" />
              <span>{isLoading ? 'Starting...' : 'Start Game'}</span>
            </button>
          ) : (
            <button
              onClick={onNextStep}
              disabled={!canProceed() || isLoading}
              className="
                flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white 
                rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed

                /* Touch-friendly sizing */
                min-h-[44px]

                /* Hover states for desktop */
                lg:hover:bg-blue-700 lg:transition-colors
              "
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
