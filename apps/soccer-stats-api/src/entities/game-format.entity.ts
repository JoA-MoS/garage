import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { Game } from './game.entity';

@ObjectType()
@Entity('game_formats')
export class GameFormat {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string; // e.g., "11v11", "9v9", "7v7", "5v5"

  @Field()
  @Column()
  displayName: string; // e.g., "11 vs 11", "9 vs 9", etc.

  @Field(() => Int)
  @Column({ type: 'int' })
  playersPerSide: number; // e.g., 11, 9, 7, 5

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  minPlayers?: number; // Minimum players required to start

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  maxSubstitutions?: number; // Maximum substitutions allowed

  @Field(() => Int)
  @Column({ type: 'int', default: 90 })
  defaultDuration: number; // Default game duration in minutes

  @Field()
  @Column({ default: true })
  isActive: boolean; // Whether this format is currently available

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string; // Optional description of the format

  @Field(() => [Game])
  @OneToMany(() => Game, (game) => game.gameFormat)
  games: Game[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
