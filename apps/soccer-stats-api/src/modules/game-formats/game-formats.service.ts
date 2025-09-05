import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GameFormat } from '../../entities/game-format.entity';

import { CreateGameFormatInput } from './dto/create-game-format.input';

@Injectable()
export class GameFormatsService {
  constructor(
    @InjectRepository(GameFormat)
    private gameFormatsRepository: Repository<GameFormat>
  ) {}

  async findAll(): Promise<GameFormat[]> {
    return this.gameFormatsRepository.find({
      where: { isActive: true },
      order: { playersPerSide: 'DESC' },
    });
  }

  async findOne(id: string): Promise<GameFormat | null> {
    return this.gameFormatsRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findByName(name: string): Promise<GameFormat | null> {
    return this.gameFormatsRepository.findOne({
      where: { name, isActive: true },
    });
  }

  async create(input: CreateGameFormatInput): Promise<GameFormat> {
    const gameFormat = this.gameFormatsRepository.create({
      ...input,
      defaultDuration: input.defaultDuration || 90,
    });
    return this.gameFormatsRepository.save(gameFormat);
  }

  async update(
    id: string,
    input: Partial<CreateGameFormatInput>
  ): Promise<GameFormat> {
    await this.gameFormatsRepository.update(id, input);
    const updated = await this.gameFormatsRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Game format not found');
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete by setting isActive to false
    const result = await this.gameFormatsRepository.update(id, {
      isActive: false,
    });
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
        playersPerSide: 11,
        minPlayers: 7,
        maxSubstitutions: 5,
        defaultDuration: 90,
        description:
          'Standard full-field football match with 11 players per side',
      },
      {
        name: '9v9',
        displayName: '9 vs 9',
        playersPerSide: 9,
        minPlayers: 6,
        maxSubstitutions: 5,
        defaultDuration: 70,
        description: 'Youth football format with 9 players per side',
      },
      {
        name: '7v7',
        displayName: '7 vs 7',
        playersPerSide: 7,
        minPlayers: 5,
        maxSubstitutions: 5,
        defaultDuration: 60,
        description: 'Small-sided game with 7 players per side',
      },
      {
        name: '5v5',
        displayName: '5 vs 5',
        playersPerSide: 5,
        minPlayers: 4,
        maxSubstitutions: 3,
        defaultDuration: 50,
        description: 'Futsal or small-sided game with 5 players per side',
      },
    ];

    for (const format of defaultFormats) {
      await this.create(format);
    }

    console.log('Successfully seeded default game formats');
  }
}
