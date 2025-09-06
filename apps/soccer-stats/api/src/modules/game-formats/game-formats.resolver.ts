import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { GameFormat } from '../../entities/game-format.entity';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { Public } from '../auth/public.decorator';

import { GameFormatsService } from './game-formats.service';
import { CreateGameFormatInput } from './dto/create-game-format.input';

@Resolver(() => GameFormat)
@UseGuards(ClerkAuthGuard)
export class GameFormatsResolver {
  constructor(private readonly gameFormatsService: GameFormatsService) {}

  @Query(() => [GameFormat], { name: 'gameFormats' })
  @Public() // Public endpoint - no auth required
  findAll() {
    return this.gameFormatsService.findAll();
  }

  @Query(() => GameFormat, { name: 'gameFormat' })
  @Public() // Public endpoint
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.gameFormatsService.findOne(id);
  }

  @Mutation(() => GameFormat)
  @Public() // Temporarily public for MVP
  async createGameFormat(
    @Args('input') input: CreateGameFormatInput
  ): Promise<GameFormat> {
    return this.gameFormatsService.create(input);
  }

  @Mutation(() => Boolean)
  @Public() // Temporarily public for MVP
  async seedGameFormats(): Promise<boolean> {
    await this.gameFormatsService.seedDefaultFormats();
    return true;
  }
}
