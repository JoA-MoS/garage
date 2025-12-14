import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GameFormat } from '../../entities/game-format.entity';

import { CreateGameFormatInput } from './dto/create-game-format.input';
import { UpdateGameFormatInput } from './dto/update-game-format.input';

@Injectable()
export class GameFormatsService {
  constructor(
    @InjectRepository(GameFormat)
    private gameFormatsRepository: Repository<GameFormat>
  ) {}

  async findAll(): Promise<GameFormat[]> {
    return this.gameFormatsRepository.find({
      order: { playersPerTeam: 'DESC' },
    });
  }

  async findOne(id: string): Promise<GameFormat | null> {
    return this.gameFormatsRepository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<GameFormat | null> {
    return this.gameFormatsRepository.findOne({
      where: { name },
    });
  }

  async create(
    createGameFormatInput: CreateGameFormatInput
  ): Promise<GameFormat> {
    const gameFormat = this.gameFormatsRepository.create(createGameFormatInput);
    return this.gameFormatsRepository.save(gameFormat);
  }

  async update(
    id: string,
    updateGameFormatInput: UpdateGameFormatInput
  ): Promise<GameFormat | null> {
    await this.gameFormatsRepository.update(id, updateGameFormatInput);
    return this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.gameFormatsRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async seedDefaultFormats(): Promise<void> {
    const existingFormats = await this.gameFormatsRepository.count();

    if (existingFormats > 0) {
      console.log('Game formats already exist, skipping seed');
      return;
    }

    const defaultFormats: CreateGameFormatInput[] = [
      {
        name: '11v11',
        displayName: '11 vs 11',
        playersPerTeam: 11,
        minPlayers: 7,
        maxSubstitutions: 5,
        durationMinutes: 90,
        allowsSubstitutions: true,
        description:
          'Standard full-field football match with 11 players per side',
      },
      {
        name: '9v9',
        displayName: '9 vs 9',
        playersPerTeam: 9,
        minPlayers: 6,
        maxSubstitutions: 5,
        durationMinutes: 70,
        allowsSubstitutions: true,
        description: 'Youth football format with 9 players per side',
      },
      {
        name: '7v7',
        displayName: '7 vs 7',
        playersPerTeam: 7,
        minPlayers: 5,
        maxSubstitutions: 5,
        durationMinutes: 60,
        allowsSubstitutions: true,
        description: 'Small-sided game with 7 players per side',
      },
      {
        name: '5v5',
        displayName: '5 vs 5',
        playersPerTeam: 5,
        minPlayers: 4,
        maxSubstitutions: 3,
        durationMinutes: 50,
        allowsSubstitutions: true,
        description: 'Futsal or small-sided game with 5 players per side',
      },
    ];

    for (const format of defaultFormats) {
      await this.create(format);
    }

    console.log('Successfully seeded default game formats');
  }
}
