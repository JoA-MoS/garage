import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback, useState } from 'react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../../services/teams-graphql.service';
import { TeamConfigurationPresentation } from '../presentation/team-configuration.presentation';

interface TeamConfigurationSmartProps {
  teamId: string;
}

export interface TeamConfiguration {
  playersOnField: number;
  formation: string;
  positions: Position[];
}

export interface Position {
  id: string;
  name: string;
  abbreviation: string;
  x: number; // Position on field (0-100)
  y: number; // Position on field (0-100)
}

// Common soccer formations and positions
const DEFAULT_FORMATIONS = {
  '4-4-2': {
    playersOnField: 11,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'rb', name: 'Right Back', abbreviation: 'RB', x: 25, y: 20 },
      { id: 'cb1', name: 'Center Back', abbreviation: 'CB', x: 25, y: 40 },
      { id: 'cb2', name: 'Center Back', abbreviation: 'CB', x: 25, y: 60 },
      { id: 'lb', name: 'Left Back', abbreviation: 'LB', x: 25, y: 80 },
      { id: 'rm', name: 'Right Midfielder', abbreviation: 'RM', x: 50, y: 20 },
      {
        id: 'cm1',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 50,
        y: 40,
      },
      {
        id: 'cm2',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 50,
        y: 60,
      },
      { id: 'lm', name: 'Left Midfielder', abbreviation: 'LM', x: 50, y: 80 },
      { id: 'st1', name: 'Striker', abbreviation: 'ST', x: 75, y: 35 },
      { id: 'st2', name: 'Striker', abbreviation: 'ST', x: 75, y: 65 },
    ],
  },
  '4-3-3': {
    playersOnField: 11,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'rb', name: 'Right Back', abbreviation: 'RB', x: 25, y: 20 },
      { id: 'cb1', name: 'Center Back', abbreviation: 'CB', x: 25, y: 40 },
      { id: 'cb2', name: 'Center Back', abbreviation: 'CB', x: 25, y: 60 },
      { id: 'lb', name: 'Left Back', abbreviation: 'LB', x: 25, y: 80 },
      {
        id: 'cdm',
        name: 'Defensive Midfielder',
        abbreviation: 'CDM',
        x: 45,
        y: 50,
      },
      {
        id: 'cm1',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 55,
        y: 35,
      },
      {
        id: 'cm2',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 55,
        y: 65,
      },
      { id: 'rw', name: 'Right Winger', abbreviation: 'RW', x: 75, y: 20 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 75, y: 50 },
      { id: 'lw', name: 'Left Winger', abbreviation: 'LW', x: 75, y: 80 },
    ],
  },
  custom: {
    playersOnField: 11,
    positions: [],
  },
};

/**
 * Smart component for configuring team settings
 */
export const TeamConfigurationSmart = ({
  teamId,
}: TeamConfigurationSmartProps) => {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState<TeamConfiguration>({
    playersOnField: 11,
    formation: '4-4-2',
    positions: DEFAULT_FORMATIONS['4-4-2'].positions,
  });

  const { data, loading, error } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
    fetchPolicy: 'cache-first',
  });

  const handleFormationChange = useCallback((formation: string) => {
    const formationData =
      DEFAULT_FORMATIONS[formation as keyof typeof DEFAULT_FORMATIONS];
    setConfiguration({
      playersOnField: formationData.playersOnField,
      formation,
      positions: formationData.positions,
    });
  }, []);

  const handlePlayersOnFieldChange = useCallback((count: number) => {
    setConfiguration((prev) => ({
      ...prev,
      playersOnField: count,
    }));
  }, []);

  const handlePositionUpdate = useCallback(
    (positionId: string, updates: Partial<Position>) => {
      setConfiguration((prev) => ({
        ...prev,
        positions: prev.positions.map((pos) =>
          pos.id === positionId ? { ...pos, ...updates } : pos
        ),
      }));
    },
    []
  );

  const handleContinue = useCallback(() => {
    // In a real app, you might save the configuration to the backend here
    // For now, we'll just navigate to the add players page
    navigate(`/teams/${teamId}/add-players`);
  }, [navigate, teamId]);

  const handleBack = useCallback(() => {
    navigate('/teams/create');
  }, [navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.team) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Team Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              {error?.message || 'The team you are looking for does not exist.'}
            </p>
            <button
              onClick={() => navigate('/teams')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TeamConfigurationPresentation
      team={data.team}
      configuration={configuration}
      formations={Object.keys(DEFAULT_FORMATIONS)}
      onFormationChange={handleFormationChange}
      onPlayersOnFieldChange={handlePlayersOnFieldChange}
      onPositionUpdate={handlePositionUpdate}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
};
