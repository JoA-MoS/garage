import { Repository } from 'typeorm';

import { Team } from '../../entities/team.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { TeamMembersService } from '../team-members/team-members.service';

import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let teamRepository: jest.Mocked<Pick<Repository<Team>, 'findOne'>>;
  let teamConfigurationRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    teamRepository = {
      findOne: jest.fn(),
    };
    const gameTeamRepository = {
      find: jest.fn(),
    } as unknown as Repository<GameTeam>;
    teamConfigurationRepository = {
      findOne: jest.fn(),
      create: jest.fn((config) => config as TeamConfiguration),
      save: jest.fn(),
    };
    const teamMembersService = {} as TeamMembersService;

    service = new TeamsService(
      teamRepository as unknown as Repository<Team>,
      gameTeamRepository,
      teamConfigurationRepository as unknown as Repository<TeamConfiguration>,
      teamMembersService,
    );
  });

  describe('getTeamConfiguration', () => {
    it('loads the default game format relation for GraphQL population', async () => {
      const defaultGameFormat = {
        id: 'format-1',
        name: '9v9',
        playersPerTeam: 9,
        durationMinutes: 70,
      } as GameFormat;
      const config = {
        id: 'config-1',
        teamId: 'team-1',
        defaultGameFormatId: defaultGameFormat.id,
        defaultGameFormat,
      } as TeamConfiguration;
      teamConfigurationRepository.findOne.mockResolvedValue(config);

      await expect(service.getTeamConfiguration('team-1')).resolves.toBe(
        config,
      );

      expect(teamConfigurationRepository.findOne).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        relations: { defaultGameFormat: true },
      });
    });
  });

  describe('updateTeamConfiguration', () => {
    it('returns the saved configuration with defaultGameFormat populated', async () => {
      const existingConfig = {
        id: 'config-1',
        teamId: 'team-1',
        defaultGameFormatId: null,
      } as TeamConfiguration;
      const reloadedConfig = {
        ...existingConfig,
        defaultGameFormatId: 'format-1',
        defaultGameFormat: {
          id: 'format-1',
          name: '9v9',
          playersPerTeam: 9,
          durationMinutes: 70,
        } as GameFormat,
      } as TeamConfiguration;

      teamRepository.findOne.mockResolvedValue({ id: 'team-1' } as Team);
      teamConfigurationRepository.findOne
        .mockResolvedValueOnce(existingConfig)
        .mockResolvedValueOnce(reloadedConfig);
      teamConfigurationRepository.save.mockResolvedValue(reloadedConfig);

      await expect(
        service.updateTeamConfiguration('team-1', {
          defaultGameFormatId: 'format-1',
        }),
      ).resolves.toBe(reloadedConfig);

      expect(teamConfigurationRepository.save).toHaveBeenCalledWith({
        ...existingConfig,
        defaultGameFormatId: 'format-1',
      });
      expect(teamConfigurationRepository.findOne).toHaveBeenLastCalledWith({
        where: { teamId: 'team-1' },
        relations: { defaultGameFormat: true },
      });
    });
  });
});
